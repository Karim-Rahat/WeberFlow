<?php

namespace App\Actions;

use App\Models\User;
use App\Models\Workspace;
use App\WorkspaceRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateUserWithWorkspace
{
    /**
     * @param  array{name: string, email: string, password: string, workspace_name: string, timezone: string}  $attributes
     */
    public function handle(array $attributes): User
    {
        return DB::transaction(function () use ($attributes): User {
            $user = User::create([
                'name' => $attributes['name'],
                'email' => $attributes['email'],
                'password' => $attributes['password'],
                'timezone' => $attributes['timezone'],
            ]);

            $workspace = Workspace::create([
                'owner_id' => $user->id,
                'name' => $attributes['workspace_name'],
                'slug' => $this->uniqueSlug($attributes['workspace_name']),
                'timezone' => $attributes['timezone'],
            ]);

            $workspace->members()->attach($user->id, [
                'role' => WorkspaceRole::Owner->value,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            $user->notificationPreference()->create();
            $user->update(['current_workspace_id' => $workspace->id]);

            return $user->load(['currentWorkspace', 'workspaces', 'notificationPreference']);
        });
    }

    private function uniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name) ?: 'workspace';
        $slug = $baseSlug;
        $suffix = 2;

        while (Workspace::where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
