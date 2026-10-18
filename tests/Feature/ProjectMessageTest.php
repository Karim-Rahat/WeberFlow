<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ProjectMessageTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_member_posts_and_reads_project_messages(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = $this->createProject($user);

        $created = $this->actingAs($user)->postJson("/api/v1/projects/{$project->id}/messages", ['body' => 'Kicking off the launch this week.']);

        $created->assertCreated()->assertJsonPath('data.body', 'Kicking off the launch this week.')->assertJsonPath('data.can_delete', true);
        $this->actingAs($user)->getJson("/api/v1/projects/{$project->id}/messages")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.author.name', 'Release Planner');
    }

    public function test_posting_a_message_requires_a_body(): void
    {
        $user = $this->createUserWithWorkspace();
        $project = $this->createProject($user);

        $this->actingAs($user)->postJson("/api/v1/projects/{$project->id}/messages", ['body' => ''])->assertUnprocessable()->assertJsonValidationErrors('body');
    }

    public function test_member_cannot_post_to_another_workspace_project(): void
    {
        $user = $this->createUserWithWorkspace('member@example.com');
        $other = $this->createUserWithWorkspace('other@example.com');
        $project = $this->createProject($other);

        $this->actingAs($user)->postJson("/api/v1/projects/{$project->id}/messages", ['body' => 'Sneaky'])->assertNotFound();
        $this->assertDatabaseMissing('project_messages', ['project_id' => $project->id, 'body' => 'Sneaky']);
    }

    public function test_only_the_author_or_project_owner_can_delete_a_message(): void
    {
        $owner = $this->createUserWithWorkspace('owner@example.com');
        $project = $this->createProject($owner);
        $created = $this->actingAs($owner)->postJson("/api/v1/projects/{$project->id}/messages", ['body' => 'Owner note']);
        $messageId = $created->json('data.id');

        $this->actingAs($owner)->deleteJson("/api/v1/projects/{$project->id}/messages/{$messageId}")->assertNoContent();
        $this->assertDatabaseMissing('project_messages', ['id' => $messageId]);
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
