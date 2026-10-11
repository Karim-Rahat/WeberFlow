<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace;
use App\WorkspaceRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class WorkspaceMemberController extends Controller
{
    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('update', $workspace);

        $validated = $request->validate([
            'email' => ['required', 'email', Rule::exists('users', 'email')],
            'role' => ['required', Rule::in($this->manageableRoles())],
        ]);
        $member = User::query()->where('email', $validated['email'])->firstOrFail();

        abort_if($member->id === $workspace->owner_id, 422, 'The workspace owner is already a member.');

        $workspace->members()->syncWithoutDetaching([
            $member->id => ['role' => $validated['role'], 'status' => 'active', 'joined_at' => now()],
        ]);
        $workspace->members()->updateExistingPivot($member->id, [
            'role' => $validated['role'],
            'status' => 'active',
            'joined_at' => now(),
        ]);

        return response()->json(['data' => $this->memberData($workspace, $member)], 201);
    }

    public function update(Request $request, Workspace $workspace, User $member): JsonResponse
    {
        Gate::authorize('update', $workspace);
        $this->ensureManageableMember($workspace, $member);

        $validated = $request->validate([
            'role' => ['required', Rule::in($this->manageableRoles())],
        ]);
        $workspace->members()->updateExistingPivot($member->id, ['role' => $validated['role']]);

        return response()->json(['data' => $this->memberData($workspace, $member)]);
    }

    public function destroy(Request $request, Workspace $workspace, User $member): JsonResponse
    {
        Gate::authorize('update', $workspace);
        $this->ensureManageableMember($workspace, $member);
        $workspace->members()->detach($member->id);

        return response()->json(status: 204);
    }

    /** @return list<string> */
    private function manageableRoles(): array
    {
        return [WorkspaceRole::Admin->value, WorkspaceRole::Member->value, WorkspaceRole::Guest->value];
    }

    private function ensureManageableMember(Workspace $workspace, User $member): void
    {
        abort_if($member->id === $workspace->owner_id, 422, 'The workspace owner cannot be changed or removed.');
        abort_unless($workspace->members()->whereKey($member->id)->exists(), 404);
    }

    /** @return array{id: int, name: string, email: string, role: string} */
    private function memberData(Workspace $workspace, User $member): array
    {
        $role = $workspace->members()->whereKey($member->id)->firstOrFail()->pivot->role;

        return [
            'id' => $member->id,
            'name' => $member->name,
            'email' => $member->email,
            'role' => $role instanceof WorkspaceRole ? $role->value : $role,
        ];
    }
}
