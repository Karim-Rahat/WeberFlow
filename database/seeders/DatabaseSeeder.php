<?php

namespace Database\Seeders;

use App\Actions\CreateUserWithWorkspace;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $owner = app(CreateUserWithWorkspace::class)->handle([
            'name' => 'Karim Rahat',
            'email' => 'karim@weberflow.local',
            'password' => 'password',
            'workspace_name' => 'WeberFlow Demo',
            'timezone' => 'Asia/Dhaka',
        ]);

        $owner->markEmailAsVerified();

        User::factory()->count(4)->create()->each(function (User $user) use ($owner): void {
            $owner->currentWorkspace?->members()->attach($user->id, [
                'role' => 'member',
                'status' => 'active',
                'joined_at' => now(),
            ]);
            $user->notificationPreference()->create();
            $user->update(['current_workspace_id' => $owner->current_workspace_id]);
        });
    }
}
