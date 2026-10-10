<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_registration_creates_an_authenticated_user_and_workspace(): void
    {
        Notification::fake([VerifyEmail::class]);

        $response = $this->withHeader('Origin', config('app.url'))->postJson('/api/v1/auth/register', [
            'name' => 'Karim Rahat',
            'email' => 'karim@example.com',
            'password' => 'Secure123',
            'password_confirmation' => 'Secure123',
            'workspace_name' => 'Weber Studio',
            'timezone' => 'Asia/Dhaka',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.email', 'karim@example.com')
            ->assertJsonPath('data.current_workspace.name', 'Weber Studio');

        $user = User::where('email', 'karim@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('workspace_members', [
            'user_id' => $user->id,
            'workspace_id' => $user->current_workspace_id,
            'role' => 'owner',
        ]);
        $this->assertDatabaseHas('notification_preferences', ['user_id' => $user->id]);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_registration_rejects_an_invalid_payload(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => 'weak',
            'password_confirmation' => 'different',
            'workspace_name' => '',
            'timezone' => 'not-a-timezone',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password', 'workspace_name', 'timezone']);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_valid_credentials_create_a_session_and_logout_destroys_it(): void
    {
        $user = $this->createUserWithWorkspace('owner@example.com');

        $this->withHeader('Origin', config('app.url'))->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk()->assertJsonPath('data.email', $user->email);

        $this->assertAuthenticatedAs($user);

        $this->withHeader('Origin', config('app.url'))->deleteJson('/api/v1/auth/session')
            ->assertOk()
            ->assertJsonPath('message', 'Signed out successfully.');

        Auth::forgetGuards();

        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_invalid_credentials_return_a_validation_error(): void
    {
        User::factory()->create(['email' => 'owner@example.com']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'owner@example.com',
            'password' => 'incorrect',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    public function test_password_reset_request_is_generic_and_sends_a_notification_for_an_account(): void
    {
        Notification::fake([ResetPassword::class]);
        $user = User::factory()->create();

        $response = $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'If an account exists for that email, a reset link has been sent.');
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_profile_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    private function createUserWithWorkspace(string $email): User
    {
        return app(CreateUserWithWorkspace::class)->handle([
            'name' => 'Workspace Owner',
            'email' => $email,
            'password' => 'password',
            'workspace_name' => 'Example Workspace',
            'timezone' => 'UTC',
        ]);
    }
}
