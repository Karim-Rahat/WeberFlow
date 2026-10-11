<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class WorkspaceManagementTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_member_lists_only_their_workspaces(): void
    {
        $user = $this->createUserWithWorkspace('member@example.com', 'Member Workspace');
        $this->createUserWithWorkspace('other@example.com', 'Hidden Workspace');

        $response = $this->actingAs($user)->getJson('/api/v1/workspaces');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Member Workspace');
    }

    public function test_authenticated_user_can_create_a_workspace_and_becomes_its_owner(): void
    {
        $user = $this->createUserWithWorkspace('owner@example.com', 'First Workspace');

        $response = $this->actingAs($user)->postJson('/api/v1/workspaces', [
            'name' => 'Second Workspace',
            'timezone' => 'Asia/Dhaka',
        ]);

        $response->assertCreated()->assertJsonPath('data.name', 'Second Workspace');
        $workspaceId = $response->json('data.id');
        $this->assertDatabaseHas('workspace_members', [
            'workspace_id' => $workspaceId,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);
        $this->assertSame($workspaceId, $user->fresh()->current_workspace_id);
    }

    public function test_member_can_switch_to_their_workspace(): void
    {
        $user = $this->createUserWithWorkspace('owner@example.com', 'First Workspace');
        $second = $this->actingAs($user)->postJson('/api/v1/workspaces', ['name' => 'Second Workspace'])->json('data');
        $firstWorkspaceId = $user->current_workspace_id;
        $user->update(['current_workspace_id' => $firstWorkspaceId]);

        $response = $this->actingAs($user)->putJson('/api/v1/current-workspace', [
            'workspace_id' => $second['id'],
        ]);

        $response->assertOk()->assertJsonPath('data.id', $second['id']);
        $this->assertSame($second['id'], $user->fresh()->current_workspace_id);
    }

    public function test_member_cannot_discover_or_switch_to_another_users_workspace(): void
    {
        $user = $this->createUserWithWorkspace('member@example.com', 'Member Workspace');
        $other = $this->createUserWithWorkspace('other@example.com', 'Hidden Workspace');

        $this->actingAs($user)
            ->getJson('/api/v1/workspaces/'.$other->current_workspace_id)
            ->assertNotFound();

        $this->actingAs($user)
            ->putJson('/api/v1/current-workspace', ['workspace_id' => $other->current_workspace_id])
            ->assertNotFound();

        $this->assertNotSame($other->current_workspace_id, $user->fresh()->current_workspace_id);
    }

    public function test_owner_can_add_an_existing_user_to_the_workspace(): void
    {
        $owner = $this->createUserWithWorkspace('owner@example.com', 'Owner Workspace');
        $member = $this->createUserWithWorkspace('member@example.com', 'Member Workspace');

        $response = $this->actingAs($owner)->postJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/members', [
            'email' => $member->email,
            'role' => 'member',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.email', $member->email)
            ->assertJsonPath('data.role', 'member');
        $this->assertDatabaseHas('workspace_members', [
            'workspace_id' => $owner->current_workspace_id,
            'user_id' => $member->id,
            'role' => 'member',
            'status' => 'active',
        ]);
    }

    public function test_regular_member_cannot_manage_workspace_members(): void
    {
        $owner = $this->createUserWithWorkspace('owner@example.com', 'Owner Workspace');
        $member = $this->createUserWithWorkspace('member@example.com', 'Member Workspace');
        $target = $this->createUserWithWorkspace('target@example.com', 'Target Workspace');
        $owner->currentWorkspace->members()->attach($member->id, ['role' => 'member', 'status' => 'active', 'joined_at' => now()]);

        $this->actingAs($member)
            ->postJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/members', ['email' => $target->email, 'role' => 'member'])
            ->assertForbidden();
    }

    private function createUserWithWorkspace(string $email, string $workspaceName): User
    {
        return app(CreateUserWithWorkspace::class)->handle([
            'name' => 'Workspace Owner',
            'email' => $email,
            'password' => 'password',
            'workspace_name' => $workspaceName,
            'timezone' => 'UTC',
        ]);
    }
}
