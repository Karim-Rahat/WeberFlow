<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use App\WorkspaceRole;

class ProjectPolicy
{
    public function view(User $user, Project $project): bool
    {
        return $user->hasWorkspaceRole($project->workspace, ...WorkspaceRole::cases());
    }

    public function create(User $user, int $workspaceId): bool
    {
        return $user->workspaceMemberships()
            ->where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->whereIn('role', [WorkspaceRole::Owner->value, WorkspaceRole::Admin->value, WorkspaceRole::Member->value])
            ->exists();
    }

    public function update(User $user, Project $project): bool
    {
        return $user->hasWorkspaceRole($project->workspace, WorkspaceRole::Owner, WorkspaceRole::Admin)
            || $project->owner_id === $user->id;
    }
}
