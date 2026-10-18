<?php

namespace Tests\Feature;

use App\Actions\CreateUserWithWorkspace;
use App\Models\SavedSearch;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class SavedSearchTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_user_saves_lists_and_deletes_a_reusable_search(): void
    {
        $user = $this->createUserWithWorkspace();

        $created = $this->actingAs($user)->postJson('/api/v1/saved-searches', [
            'name' => 'Blocked high priority',
            'filters' => ['status' => 'blocked', 'priority' => 'high', 'sortBy' => 'due_date'],
        ]);

        $created->assertCreated()->assertJsonPath('data.name', 'Blocked high priority')->assertJsonPath('data.filters.status', 'blocked');
        $searchId = $created->json('data.id');

        $this->actingAs($user)->getJson('/api/v1/saved-searches')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $searchId);

        $this->actingAs($user)->deleteJson("/api/v1/saved-searches/{$searchId}")->assertNoContent();
        $this->assertDatabaseMissing('saved_searches', ['id' => $searchId]);
    }

    public function test_user_cannot_read_or_delete_another_users_saved_search(): void
    {
        $user = $this->createUserWithWorkspace('member@example.com');
        $other = $this->createUserWithWorkspace('other@example.com');
        $foreign = SavedSearch::query()->create([
            'workspace_id' => $other->current_workspace_id,
            'user_id' => $other->id,
            'name' => 'Other filters',
            'filters' => ['status' => 'complete'],
        ]);

        $this->actingAs($user)->getJson('/api/v1/saved-searches')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($user)->deleteJson("/api/v1/saved-searches/{$foreign->id}")->assertNotFound();
        $this->assertDatabaseHas('saved_searches', ['id' => $foreign->id]);
    }

    public function test_storing_a_saved_search_requires_a_name_and_filters(): void
    {
        $user = $this->createUserWithWorkspace();

        $this->actingAs($user)->postJson('/api/v1/saved-searches', ['filters' => ['status' => 'all']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $this->actingAs($user)->postJson('/api/v1/saved-searches', ['name' => 'No filters'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('filters');
    }

    private function createUserWithWorkspace(string $email = 'planner@example.com'): User
    {
        return app(CreateUserWithWorkspace::class)->handle(['name' => 'Release Planner', 'email' => $email, 'password' => 'password', 'workspace_name' => 'Release Two', 'timezone' => 'UTC']);
    }
}
