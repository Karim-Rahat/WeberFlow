<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Events\MessageSent;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MessageInboxTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_member_can_search_workspace_members_by_name_or_email(): void
    {
        [$owner, $member] = $this->workspaceTeam('amina@example.com', 'Amina Rahman');
        $this->createMember($owner, 'robert@example.com', 'Robert Chen');

        $response = $this->actingAs($owner)->getJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/members?search=amina');

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $member->id);
    }

    public function test_member_can_send_message_and_it_appears_in_the_recipients_inbox(): void
    {
        [$owner, $member] = $this->workspaceTeam();
        Event::fake([MessageSent::class]);

        $response = $this->actingAs($owner)->postJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/messages', [
            'recipient_id' => $member->id,
            'body' => 'Can you review the launch checklist today?',
        ]);

        $response->assertCreated()->assertJsonPath('data.body', 'Can you review the launch checklist today?');
        $this->assertDatabaseHas('messages', [
            'workspace_id' => $owner->current_workspace_id,
            'sender_id' => $owner->id,
            'recipient_id' => $member->id,
        ]);
        Event::assertDispatched(MessageSent::class, fn (MessageSent $event): bool => $event->message->recipient_id === $member->id);

        $this->actingAs($member)
            ->getJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/messages')
            ->assertOk()
            ->assertJsonPath('data.0.user.id', $owner->id)
            ->assertJsonPath('data.0.unread_count', 1);
    }

    public function test_opening_a_thread_marks_incoming_messages_as_read(): void
    {
        [$owner, $member] = $this->workspaceTeam();

        $this->actingAs($owner)->postJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/messages', [
            'recipient_id' => $member->id,
            'body' => 'Ping',
        ])->assertCreated();

        $this->actingAs($member)
            ->getJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/messages/'.$owner->id)
            ->assertOk()
            ->assertJsonPath('data.0.from_me', false);

        $this->assertDatabaseMissing('messages', ['recipient_id' => $member->id, 'read_at' => null]);
    }

    public function test_message_recipient_must_belong_to_the_workspace(): void
    {
        [$owner] = $this->workspaceTeam();
        $outsider = $this->createUserWithWorkspace('outsider@example.com');

        $this->actingAs($owner)->postJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/messages', [
            'recipient_id' => $outsider->id,
            'body' => 'Hello?',
        ])->assertStatus(422)->assertJsonValidationErrors('recipient_id');
    }

    public function test_cross_workspace_members_cannot_read_a_thread(): void
    {
        [$owner, $member] = $this->workspaceTeam();
        $other = $this->createUserWithWorkspace('other@example.com');

        $this->actingAs($other)
            ->getJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/messages/'.$member->id)
            ->assertNotFound();
    }

    public function test_member_can_store_personal_notes_in_their_own_inbox(): void
    {
        $owner = $this->createUserWithWorkspace('owner@example.com');

        $this->actingAs($owner)->postJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/messages', [
            'recipient_id' => $owner->id,
            'body' => 'Remember to prepare the Q4 report',
        ])->assertCreated()->assertJsonPath('data.from_me', true);

        $this->assertDatabaseHas('messages', [
            'workspace_id' => $owner->current_workspace_id,
            'sender_id' => $owner->id,
            'recipient_id' => $owner->id,
        ]);

        $this->actingAs($owner)
            ->getJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/messages/'.$owner->id)
            ->assertOk()
            ->assertJsonPath('data.0.body', 'Remember to prepare the Q4 report');
    }

    public function test_member_can_send_an_image_message_and_participants_can_view_it(): void
    {
        Storage::fake('local');
        [$owner, $member] = $this->workspaceTeam();

        $response = $this->actingAs($owner)->post(
            '/api/v1/workspaces/'.$owner->current_workspace_id.'/messages',
            [
                'recipient_id' => $member->id,
                'body' => 'Here is the mockup',
                'image' => UploadedFile::fake()->image('mockup.jpg', 640, 480),
            ],
            ['Accept' => 'application/json'],
        );

        $response->assertCreated()->assertJsonPath('data.image_name', 'mockup.jpg');

        $message = Message::query()->firstOrFail();
        Storage::disk('local')->assertExists($message->image_path);

        $this->actingAs($member)
            ->get('/api/v1/messages/'.$message->id.'/image')
            ->assertOk();

        $outsider = $this->createUserWithWorkspace('other@example.com');
        $this->actingAs($outsider)
            ->get('/api/v1/messages/'.$message->id.'/image')
            ->assertNotFound();
    }

    public function test_message_requires_body_or_image(): void
    {
        [$owner, $member] = $this->workspaceTeam();

        $this->actingAs($owner)->postJson('/api/v1/workspaces/'.$owner->current_workspace_id.'/messages', [
            'recipient_id' => $member->id,
        ])->assertStatus(422)->assertJsonValidationErrors('body');
    }

    /**
     * @return array{0: User, 1: User}
     */
    private function workspaceTeam(string $memberEmail = 'member@example.com', string $memberName = 'Workspace Member'): array
    {
        $owner = $this->createUserWithWorkspace('owner@example.com');

        return [$owner, $this->createMember($owner, $memberEmail, $memberName)];
    }

    private function createMember(User $owner, string $email, string $name): User
    {
        $member = User::factory()->create(['name' => $name, 'email' => $email]);
        $owner->currentWorkspace->members()->attach($member->id, ['role' => 'member', 'status' => 'active', 'joined_at' => now()]);
        $member->update(['current_workspace_id' => $owner->current_workspace_id]);

        return $member;
    }

    private function createUserWithWorkspace(string $email): User
    {
        return app(CreateUserWithWorkspace::class)->handle([
            'name' => 'Inbox User',
            'email' => $email,
            'password' => 'password',
            'workspace_name' => 'Inbox Workspace',
            'timezone' => 'UTC',
        ]);
    }
}
