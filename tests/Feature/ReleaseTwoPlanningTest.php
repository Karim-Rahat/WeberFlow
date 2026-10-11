<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Models\Project;
use App\Models\ProjectForm;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ReleaseTwoPlanningTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_owner_creates_custom_field_and_stores_task_value(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = $this->createProject($user);

        $fieldResponse = $this->actingAs($user)->postJson("/api/v1/projects/{$project->id}/custom-fields", ['name' => 'Budget', 'type' => 'number', 'is_required' => true]);
        $fieldId = $fieldResponse->json('data.id');
        $taskResponse = $this->actingAs($user)->postJson("/api/v1/projects/{$project->id}/tasks", ['title' => 'Approve campaign', 'custom_fields' => [(string) $fieldId => '12500']]);

        $fieldResponse->assertCreated()->assertJsonPath('data.name', 'Budget');
        $taskResponse->assertCreated()->assertJsonPath('data.custom_fields.0.value', '12500');
        $this->assertDatabaseHas('custom_field_values', ['custom_field_id' => $fieldId, 'value' => '12500']);
    }

    public function test_member_cannot_add_custom_field_to_another_workspace_project(): void
    {
        $user = $this->createUserWithWorkspace('member@example.com');
        $other = $this->createUserWithWorkspace('other@example.com');
        $project = $this->createProject($other);

        $this->actingAs($user)->postJson("/api/v1/projects/{$project->id}/custom-fields", ['name' => 'Secret', 'type' => 'text'])->assertNotFound();
        $this->assertDatabaseMissing('custom_fields', ['project_id' => $project->id, 'name' => 'Secret']);
    }

    public function test_active_project_form_submission_creates_task(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = $this->createProject($user);
        $formResponse = $this->actingAs($user)->postJson("/api/v1/projects/{$project->id}/forms", ['name' => 'Creative request', 'fields' => [['label' => 'Audience', 'type' => 'text', 'required' => true]]]);
        $formId = $formResponse->json('data.id');

        $response = $this->actingAs($user)->postJson("/api/v1/forms/{$formId}/submissions", ['title' => 'Design launch banner', 'responses' => ['0' => 'Existing customers']]);

        $formResponse->assertCreated();
        $response->assertCreated()->assertJsonPath('data.title', 'Design launch banner');
        $this->assertDatabaseHas('tasks', ['project_id' => $project->id, 'title' => 'Design launch banner']);
    }

    public function test_project_form_rejects_missing_required_response_with_422(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = $this->createProject($user);
        $form = ProjectForm::query()->create(['project_id' => $project->id, 'name' => 'Required brief', 'fields' => [['label' => 'Goal', 'type' => 'text', 'required' => true]]]);

        $this->actingAs($user)->postJson("/api/v1/forms/{$form->id}/submissions", ['title' => 'Incomplete request', 'responses' => ['0' => '']])->assertUnprocessable();
        $this->assertDatabaseMissing('tasks', ['project_id' => $project->id, 'title' => 'Incomplete request']);
    }

    public function test_template_application_copies_project_work_and_custom_fields(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = $this->createProject($user);
        $project->sections()->create(['name' => 'Delivery', 'position' => 0]);
        Task::factory()->create(['project_id' => $project->id, 'workspace_id' => $project->workspace_id, 'creator_id' => $user->id, 'title' => 'Kickoff']);
        $project->customFields()->create(['name' => 'Department', 'type' => 'text']);
        $templateResponse = $this->actingAs($user)->postJson("/api/v1/projects/{$project->id}/templates", ['name' => 'Launch plan']);
        $templateId = $templateResponse->json('data.id');

        $response = $this->actingAs($user)->postJson("/api/v1/workspaces/{$project->workspace_id}/templates/{$templateId}", ['name' => 'New launch']);

        $templateResponse->assertCreated();
        $response->assertCreated()->assertJsonPath('data.name', 'New launch')->assertJsonCount(1, 'data.tasks')->assertJsonCount(1, 'data.custom_fields');
        $this->assertDatabaseHas('projects', ['workspace_id' => $project->workspace_id, 'name' => 'New launch']);
    }

    public function test_completing_recurring_task_creates_next_occurrence_once(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = $this->createProject($user);
        $task = Task::factory()->create(['project_id' => $project->id, 'workspace_id' => $project->workspace_id, 'creator_id' => $user->id, 'title' => 'Weekly review', 'start_date' => '2026-10-12', 'due_date' => '2026-10-12', 'recurrence' => 'weekly', 'recurrence_interval' => 2]);

        $this->actingAs($user)->patchJson("/api/v1/tasks/{$task->id}", ['status' => 'complete'])->assertOk();
        $this->actingAs($user)->patchJson("/api/v1/tasks/{$task->id}", ['status' => 'complete'])->assertOk();

        $this->assertDatabaseHas('tasks', ['recurring_parent_id' => $task->id, 'title' => 'Weekly review', 'start_date' => '2026-10-26', 'status' => 'not_started']);
        $this->assertSame(1, Task::query()->where('recurring_parent_id', $task->id)->count());
    }

    private function createUserWithWorkspace(string $email = 'planner@example.com'): User
    {
        return app(CreateUserWithWorkspace::class)->handle(['name' => 'Release Planner', 'email' => $email, 'password' => 'password', 'workspace_name' => 'Release Two', 'timezone' => 'UTC']);
    }

    private function createProject(User $user): Project
    {
        return Project::factory()->create(['workspace_id' => $user->current_workspace_id, 'owner_id' => $user->id]);
    }
}
