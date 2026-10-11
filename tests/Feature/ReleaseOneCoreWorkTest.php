<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Events\TaskChanged;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssigned;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReleaseOneCoreWorkTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_assigning_task_creates_activity_and_queues_notification(): void
    {
        [$owner, $member, $project] = $this->workspaceTeam();
        Notification::fake([TaskAssigned::class]);
        Event::fake([TaskChanged::class]);

        $response = $this->actingAs($owner)->postJson('/api/v1/projects/'.$project->id.'/tasks', [
            'title' => 'Prepare release notes',
            'assignee_id' => $member->id,
            'due_date' => '2026-10-20',
        ]);

        $response->assertCreated()->assertJsonPath('data.assignee.id', $member->id);
        $this->assertDatabaseHas('activity_logs', ['task_id' => $response->json('data.id'), 'event' => 'task.created']);
        Notification::assertSentTo($member, TaskAssigned::class, fn (TaskAssigned $notification): bool => $notification->task->title === 'Prepare release notes');
        Event::assertDispatched(TaskChanged::class, fn (TaskChanged $event): bool => $event->action === 'created' && $event->task->id === $response->json('data.id'));
    }

    public function test_member_comments_on_task_and_activity_is_recorded(): void
    {
        [$owner, $member, $project] = $this->workspaceTeam();
        $task = Task::factory()->create(['workspace_id' => $project->workspace_id, 'project_id' => $project->id, 'creator_id' => $owner->id]);

        $response = $this->actingAs($member)->postJson('/api/v1/tasks/'.$task->id.'/comments', ['body' => 'Ready for review.']);

        $response->assertCreated()->assertJsonPath('data.body', 'Ready for review.');
        $this->assertDatabaseHas('comments', ['task_id' => $task->id, 'author_id' => $member->id, 'body' => 'Ready for review.']);
        $this->assertDatabaseHas('activity_logs', ['task_id' => $task->id, 'event' => 'comment.created']);
    }

    public function test_owner_uploads_private_task_attachment(): void
    {
        Storage::fake('local');
        [$owner, , $project] = $this->workspaceTeam();
        $task = Task::factory()->create(['workspace_id' => $project->workspace_id, 'project_id' => $project->id, 'creator_id' => $owner->id]);

        $response = $this->actingAs($owner)->post('/api/v1/tasks/'.$task->id.'/attachments', [
            'file' => UploadedFile::fake()->create('brief.pdf', 120, 'application/pdf'),
        ], ['Accept' => 'application/json']);

        $response->assertCreated()->assertJsonPath('data.name', 'brief.pdf');
        $attachment = $task->attachments()->firstOrFail();
        Storage::disk('local')->assertExists($attachment->path);
    }

    public function test_cross_workspace_user_cannot_read_task_collaboration(): void
    {
        [$owner, , $project] = $this->workspaceTeam();
        $other = $this->createUserWithWorkspace('other@example.com');
        $task = Task::factory()->create(['workspace_id' => $project->workspace_id, 'project_id' => $project->id, 'creator_id' => $owner->id]);

        $this->actingAs($other)->getJson('/api/v1/tasks/'.$task->id)->assertNotFound();
        $this->actingAs($other)->postJson('/api/v1/tasks/'.$task->id.'/comments', ['body' => 'Hidden'])->assertNotFound();
        $this->assertDatabaseMissing('comments', ['task_id' => $task->id, 'body' => 'Hidden']);
    }

    public function test_task_details_include_project_subtasks_and_collaboration_data(): void
    {
        [$owner, $member, $project] = $this->workspaceTeam();
        $task = Task::factory()->create(['workspace_id' => $project->workspace_id, 'project_id' => $project->id, 'creator_id' => $owner->id, 'assignee_id' => $member->id]);
        Task::factory()->create(['workspace_id' => $project->workspace_id, 'project_id' => $project->id, 'creator_id' => $owner->id, 'parent_id' => $task->id, 'title' => 'Review first draft']);
        $task->comments()->create(['workspace_id' => $project->workspace_id, 'author_id' => $owner->id, 'body' => 'Ready for review.']);

        $response = $this->actingAs($owner)->getJson('/api/v1/tasks/'.$task->id);

        $response->assertOk()
            ->assertJsonPath('data.project.name', $project->name)
            ->assertJsonPath('data.assignee.id', $member->id)
            ->assertJsonPath('data.subtasks.0.title', 'Review first draft')
            ->assertJsonPath('data.comments.0.body', 'Ready for review.');
    }

    public function test_task_assignee_can_be_changed_to_an_active_workspace_member(): void
    {
        [$owner, $member, $project] = $this->workspaceTeam();
        $task = Task::factory()->create(['workspace_id' => $project->workspace_id, 'project_id' => $project->id, 'creator_id' => $owner->id, 'assignee_id' => null]);

        $response = $this->actingAs($owner)->patchJson('/api/v1/tasks/'.$task->id, [
            'assignee_id' => $member->id,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.assignee.id', $member->id);
        $this->assertSame($member->id, $task->fresh()->assignee_id);
    }

    private function workspaceTeam(): array
    {
        $owner = $this->createUserWithWorkspace('owner@example.com');
        $member = User::factory()->create();
        $owner->currentWorkspace->members()->attach($member->id, ['role' => 'member', 'status' => 'active', 'joined_at' => now()]);
        $member->notificationPreference()->create();
        $member->update(['current_workspace_id' => $owner->current_workspace_id]);
        $project = Project::factory()->create(['workspace_id' => $owner->current_workspace_id, 'owner_id' => $owner->id]);

        return [$owner, $member, $project];
    }

    private function createUserWithWorkspace(string $email): User
    {
        return app(CreateUserWithWorkspace::class)->handle(['name' => 'Release User', 'email' => $email, 'password' => 'password', 'workspace_name' => 'Release Workspace', 'timezone' => 'UTC']);
    }
}
