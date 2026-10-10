<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TransferWorkspaceOwnerRequest;
use App\Models\User;
use App\Models\Workspace;
use App\WorkspaceRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminWorkspaceController extends Controller
{
    public function transferOwner(TransferWorkspaceOwnerRequest $request, Workspace $workspace): JsonResponse
    {
        $newOwner = User::findOrFail($request->integer('owner_id'));
        DB::transaction(function () use ($workspace, $newOwner): void {
            $workspace->members()->syncWithoutDetaching([$newOwner->id => ['role' => WorkspaceRole::Owner->value, 'status' => 'active', 'joined_at' => now()]]);
            $workspace->members()->updateExistingPivot($workspace->owner_id, ['role' => WorkspaceRole::Admin->value]);
            $workspace->update(['owner_id' => $newOwner->id]);
            if (! $newOwner->current_workspace_id) {
                $newOwner->update(['current_workspace_id' => $workspace->id]);
            }
        });

        return response()->json(['data' => $workspace->fresh()->load('owner:id,name,email')]);
    }
}
