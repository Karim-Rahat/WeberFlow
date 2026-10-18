<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class GlobalSearchTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_search_groups_matching_tasks_projects_comments_and_people(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = Project::factory()->create(['workspace_id' => $user->current_workspace_id, 'owner_id' => $user->id, 'name' => 'Alpha launch']);
        $task = Task::factory()->create(['project_id' => $project->id, 'workspace_id' => $project->workspace_id, 'creator_id' => $user->id, 'title' => 'Alpha campaign brief']);
        Comment::create(['workspace_id' => $project->workspace_id, 'task_id' => $task->id, 'author_id' => $user->id, 'body' => 'Alpha kickoff notes']);

        $response = $this->actingAs($user)->getJson('/api/v1/search?q=alpha');

        $response->assertOk()
            ->assertJsonPath('data.tasks.0.id', $task->id)
            ->assertJsonPath('data.projects.0.name', 'Alpha launch')
            ->assertJsonPath('data.comments.0.task.id', $task->id)
            ->assertJsonCount(1, 'data.tasks')
            ->assertJsonCount(1, 'data.projects')
            ->assertJsonCount(1, 'data.comments');
    }

    public function test_search_is_scoped_to_the_current_workspace(): void
    {
        $user = $this->createUserWithWorkspace('member@example.com');
        $other = $this->createUserWithWorkspace('other@example.com');
        $project = Project::factory()->create(['workspace_id' => $other->current_workspace_id, 'owner_id' => $other->id, 'name' => 'Alpha private']);
        Task::factory()->create(['project_id' => $project->id, 'workspace_id' => $project->workspace_id, 'creator_id' => $other->id, 'title' => 'Alpha secret']);

        $this->actingAs($user)->getJson('/api/v1/search?q=alpha')
            ->assertOk()
            ->assertJsonCount(0, 'data.tasks')
            ->assertJsonCount(0, 'data.projects');
    }

    public function test_search_ignores_queries_shorter_than_two_characters(): void
    {
        $user = $this->createUserWithWorkspace();

        $this->actingAs($user)->getJson('/api/v1/search?q=a')
            ->assertOk()
            ->assertJsonCount(0, 'data.tasks')
            ->assertJsonCount(0, 'data.projects')
            ->assertJsonCount(0, 'data.people');
    }

    private function createUserWithWorkspace(string $email = 'planner@example.com'): User
    {
        return app(CreateUserWithWorkspace::class)->handle(['name' => 'Release Planner', 'email' => $email, 'password' => 'password', 'workspace_name' => 'Release Two', 'timezone' => 'UTC']);
    }
}
