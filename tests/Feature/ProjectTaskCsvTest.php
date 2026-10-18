<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Models\Project;
use App\Models\ProjectSection;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ProjectTaskCsvTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_project_tasks_export_as_csv(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = $this->createProject($user);
        $section = ProjectSection::query()->create(['project_id' => $project->id, 'name' => 'Launch']);
        Task::query()->create(['workspace_id' => $project->workspace_id, 'project_id' => $project->id, 'creator_id' => $user->id, 'section_id' => $section->id, 'title' => 'Draft announcement', 'status' => 'in_progress', 'priority' => 'high', 'due_date' => '2026-11-05', 'position' => 1]);

        $response = $this->actingAs($user)->get("/api/v1/projects/{$project->id}/tasks/export");

        $response->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $lines = array_map('str_getcsv', array_values(array_filter(array_map('trim', explode("\n", trim($response->streamedContent()))))));

        $this->assertSame(['Title', 'Description', 'Status', 'Priority', 'Assignee', 'Start Date', 'Due Date', 'Section', 'Milestone'], $lines[0]);
        $this->assertSame(['Draft announcement', '', 'in_progress', 'high', '', '', '2026-11-05', 'Launch', 'no'], $lines[1]);
    }

    public function test_csv_import_creates_tasks_and_skips_blank_rows(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = $this->createProject($user);
        ProjectSection::query()->create(['project_id' => $project->id, 'name' => 'Launch']);
        $file = UploadedFile::fake()->createWithContent('tasks.csv', <<<'CSV'
        Title,Status,Priority,Due Date,Section,Milestone
        Write the brief,in progress,urgent,2026-11-10,Launch,yes
        ,complete,low,,,
        Draft copy,blocked,,2026-11-12,Unknown,
        CSV);

        $response = $this->actingAs($user)->post("/api/v1/projects/{$project->id}/tasks/import", ['file' => $file]);

        $response->assertCreated()->assertJsonPath('data.imported', 2)->assertJsonPath('data.skipped', 1);
        $this->assertDatabaseHas('tasks', ['project_id' => $project->id, 'title' => 'Write the brief', 'status' => 'in_progress', 'priority' => 'urgent', 'is_milestone' => 1]);
        $this->assertDatabaseHas('tasks', ['project_id' => $project->id, 'title' => 'Draft copy', 'status' => 'blocked', 'priority' => 'medium', 'section_id' => null]);
        $this->assertDatabaseMissing('tasks', ['project_id' => $project->id, 'title' => '']);
    }

    public function test_csv_import_rejects_a_missing_file(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = $this->createProject($user);

        $this->actingAs($user)->postJson("/api/v1/projects/{$project->id}/tasks/import", [])->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    public function test_member_cannot_import_into_another_workspace_project(): void
    {
        $user = $this->createUserWithWorkspace('member@example.com');
        $other = $this->createUserWithWorkspace('other@example.com');
        $project = $this->createProject($other);
        $file = UploadedFile::fake()->createWithContent('tasks.csv', "Title\nSneaky task\n");

        $this->actingAs($user)->post("/api/v1/projects/{$project->id}/tasks/import", ['file' => $file])->assertNotFound();
        $this->assertDatabaseMissing('tasks', ['project_id' => $project->id, 'title' => 'Sneaky task']);
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
