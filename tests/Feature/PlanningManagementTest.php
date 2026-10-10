<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class PlanningManagementTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_member_creates_project_with_default_section_and_returns_201(): void
    {
        $user = $this->createUserWithWorkspace('planner@example.com');

        $response = $this->actingAs($user)->postJson('/api/v1/workspaces/'.$user->current_workspace_id.'/projects', [
            'name' => 'Website launch',
            'start_date' => '2026-10-10',
            'due_date' => '2026-11-10',
        ]);

        $response->assertCreated()->assertJsonPath('data.name', 'Website launch');
        $this->assertDatabaseHas('projects', ['workspace_id' => $user->current_workspace_id, 'name' => 'Website launch']);
        $this->assertDatabaseHas('project_sections', ['project_id' => $response->json('data.id'), 'name' => 'General']);
    }

    public function test_project_creation_rejects_due_date_before_start_date_with_422(): void
    {
        $user = $this->createUserWithWorkspace('planner@example.com');

        $response = $this->actingAs($user)->postJson('/api/v1/workspaces/'.$user->current_workspace_id.'/projects', [
            'name' => 'Invalid schedule',
            'start_date' => '2026-11-10',
            'due_date' => '2026-10-10',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('due_date');
        $this->assertDatabaseMissing('projects', ['name' => 'Invalid schedule']);
    }

    public function test_owner_creates_milestone_task_with_dates_and_returns_201(): void
    {
        $user = $this->createUserWithWorkspace('owner@example.com');
        $project = Project::factory()->create(['workspace_id' => $user->current_workspace_id, 'owner_id' => $user->id]);

        $response = $this->actingAs($user)->postJson('/api/v1/projects/'.$project->id.'/tasks', [
            'title' => 'Public launch',
            'start_date' => '2026-10-20',
            'due_date' => '2026-10-20',
            'is_milestone' => true,
            'priority' => 'high',
        ]);

        $response->assertCreated()->assertJsonPath('data.is_milestone', true);
        $this->assertDatabaseHas('tasks', ['project_id' => $project->id, 'title' => 'Public launch', 'is_milestone' => true]);
    }

    public function test_member_cannot_discover_another_workspace_project(): void
    {
        $user = $this->createUserWithWorkspace('member@example.com');
        $other = $this->createUserWithWorkspace('other@example.com');
        $project = Project::factory()->create(['workspace_id' => $other->current_workspace_id, 'owner_id' => $other->id]);

        $this->actingAs($user)->getJson('/api/v1/projects/'.$project->id)->assertNotFound();
        $this->actingAs($user)->postJson('/api/v1/projects/'.$project->id.'/tasks', ['title' => 'Hidden'])->assertNotFound();
        $this->assertDatabaseMissing('tasks', ['project_id' => $project->id, 'title' => 'Hidden']);
    }

    public function test_dependency_cycle_is_rejected_with_422(): void
    {
        $user = $this->createUserWithWorkspace('planner@example.com');
        $project = Project::factory()->create(['workspace_id' => $user->current_workspace_id, 'owner_id' => $user->id]);
        $first = Task::factory()->create(['project_id' => $project->id, 'workspace_id' => $project->workspace_id, 'creator_id' => $user->id]);
        $second = Task::factory()->create(['project_id' => $project->id, 'workspace_id' => $project->workspace_id, 'creator_id' => $user->id]);

        $this->actingAs($user)->postJson('/api/v1/tasks/'.$second->id.'/dependencies', ['predecessor_task_id' => $first->id])->assertOk();
        $response = $this->actingAs($user)->postJson('/api/v1/tasks/'.$first->id.'/dependencies', ['predecessor_task_id' => $second->id]);

        $response->assertUnprocessable()->assertJsonValidationErrors('predecessor_task_id');
        $this->assertDatabaseMissing('task_dependencies', ['predecessor_task_id' => $second->id, 'dependent_task_id' => $first->id]);
    }

    public function test_project_workload_groups_completion_and_blocked_counts_by_assignee(): void
    {
        $user = $this->createUserWithWorkspace('planner@example.com');
        $project = Project::factory()->create(['workspace_id' => $user->current_workspace_id, 'owner_id' => $user->id]);
        Task::factory()->create(['project_id' => $project->id, 'workspace_id' => $project->workspace_id, 'creator_id' => $user->id, 'assignee_id' => $user->id, 'status' => 'complete']);
        Task::factory()->create(['project_id' => $project->id, 'workspace_id' => $project->workspace_id, 'creator_id' => $user->id, 'assignee_id' => $user->id, 'status' => 'blocked']);

        $response = $this->actingAs($user)->getJson('/api/v1/projects/'.$project->id.'/workload');

        $response->assertOk()
            ->assertJsonPath('data.0.assignee.id', $user->id)
            ->assertJsonPath('data.0.total', 2)
            ->assertJsonPath('data.0.completed', 1)
            ->assertJsonPath('data.0.blocked', 1);
    }

    private function createUserWithWorkspace(string $email): User
    {
        return app(CreateUserWithWorkspace::class)->handle([
            'name' => 'Project Planner',
            'email' => $email,
            'password' => 'password',
            'workspace_name' => 'Planning Workspace',
            'timezone' => 'UTC',
        ]);
    }
}
