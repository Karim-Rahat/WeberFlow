<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ProfileManagementTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_user_can_update_profile_and_changed_email_requires_verification(): void
    {
        Notification::fake([VerifyEmail::class]);
        $user = $this->createUserWithWorkspace();
        $user->markEmailAsVerified();

        $response = $this->actingAs($user)->patchJson('/api/v1/me', [
            'name' => 'Updated Owner',
            'email' => 'updated@example.com',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'bn',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Owner')
            ->assertJsonPath('data.email_verified', false);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'updated@example.com',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'bn',
            'email_verified_at' => null,
        ]);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_user_can_update_notification_preferences(): void
    {
        $user = $this->createUserWithWorkspace();

        $response = $this->actingAs($user)->putJson('/api/v1/notification-preferences', [
            'assignments_email' => false,
            'mentions_email' => true,
            'comments_email' => false,
            'deadlines_email' => true,
            'daily_digest_email' => true,
            'in_app_notifications' => true,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.assignments_email', false)
            ->assertJsonPath('data.daily_digest_email', true);
        $this->assertDatabaseHas('notification_preferences', [
            'user_id' => $user->id,
            'assignments_email' => false,
            'daily_digest_email' => true,
        ]);
    }

    public function test_profile_rejects_an_unsupported_locale(): void
    {
        $user = $this->createUserWithWorkspace();

        $this->actingAs($user)->patchJson('/api/v1/me', [
            'name' => $user->name,
            'email' => $user->email,
            'timezone' => 'UTC',
            'locale' => 'fr',
        ])->assertUnprocessable()->assertJsonValidationErrors('locale');
    }

    private function createUserWithWorkspace(): User
    {
        return app(CreateUserWithWorkspace::class)->handle([
            'name' => 'Workspace Owner',
            'email' => 'owner@example.com',
            'password' => 'password',
            'workspace_name' => 'Example Workspace',
            'timezone' => 'UTC',
        ]);
    }
}
