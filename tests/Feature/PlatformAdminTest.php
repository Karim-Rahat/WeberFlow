<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class PlatformAdminTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_regular_user_cannot_access_platform_admin_dashboard(): void
    {
        $user = $this->userWithWorkspace('member@example.com');

        $this->actingAs($user)->getJson('/api/v1/admin/dashboard')->assertForbidden();
    }

    public function test_platform_admin_lists_all_workspaces_and_accounts(): void
    {
        $admin = $this->userWithWorkspace('admin@example.com');
        $admin->update(['is_platform_admin' => true]);
        $this->userWithWorkspace('other@example.com');

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/dashboard');

        $response->assertOk()->assertJsonPath('data.metrics.users', 2)->assertJsonPath('data.metrics.workspaces', 2)->assertJsonCount(2, 'data.users')->assertJsonCount(2, 'data.workspaces');
    }

    public function test_platform_admin_changes_verification_and_account_status(): void
    {
        $admin = $this->userWithWorkspace('admin@example.com');
        $admin->update(['is_platform_admin' => true]);
        $user = $this->userWithWorkspace('user@example.com');

        $response = $this->actingAs($admin)->patchJson('/api/v1/admin/users/'.$user->id, ['email_verified' => true, 'status' => 'suspended']);

        $response->assertOk()->assertJsonPath('data.status', 'suspended');
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertNotNull($user->fresh()->suspended_at);
    }

    public function test_platform_admin_transfers_workspace_ownership(): void
    {
        $admin = $this->userWithWorkspace('admin@example.com');
        $admin->update(['is_platform_admin' => true]);
        $newOwner = User::factory()->create();
        $workspace = $admin->currentWorkspace;

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/workspaces/'.$workspace->id.'/owner', ['owner_id' => $newOwner->id]);

        $response->assertOk()->assertJsonPath('data.owner.id', $newOwner->id);
        $this->assertSame($newOwner->id, $workspace->fresh()->owner_id);
        $this->assertDatabaseHas('workspace_members', ['workspace_id' => $workspace->id, 'user_id' => $newOwner->id, 'role' => 'owner']);
        $this->assertDatabaseHas('workspace_members', ['workspace_id' => $workspace->id, 'user_id' => $admin->id, 'role' => 'admin']);
    }

    private function userWithWorkspace(string $email): User
    {
        return app(CreateUserWithWorkspace::class)->handle(['name' => 'Admin Test', 'email' => $email, 'password' => 'Password1', 'workspace_name' => $email, 'timezone' => 'UTC']);
    }
}
