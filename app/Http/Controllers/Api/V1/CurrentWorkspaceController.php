<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SwitchWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;

class CurrentWorkspaceController extends Controller
{
    public function __invoke(SwitchWorkspaceRequest $request): WorkspaceResource
    {
        $workspace = $request->user()
            ->workspaces()
            ->whereKey($request->integer('workspace_id'))
            ->firstOrFail();

        $request->user()->update(['current_workspace_id' => $workspace->id]);

        return new WorkspaceResource($workspace);
    }
}
