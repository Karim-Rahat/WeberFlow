<?php

namespace App\Models;

use App\WorkspaceRole;
use Database\Factories\WorkspaceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['owner_id', 'name', 'slug', 'timezone', 'locale', 'settings'])]
class Workspace extends Model
{
    /** @use HasFactory<WorkspaceFactory> */
    use HasFactory;

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workspace_members')
            ->using(WorkspaceMember::class)
            ->withPivot(['role', 'status', 'joined_at'])
            ->withTimestamps();
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function roleFor(User $user): ?WorkspaceRole
    {
        $membership = $this->members()->whereKey($user->getKey())->first()?->pivot;

        if (! $membership) {
            return null;
        }

        return $membership->role instanceof WorkspaceRole
            ? $membership->role
            : WorkspaceRole::tryFrom($membership->role);
    }

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }
}
