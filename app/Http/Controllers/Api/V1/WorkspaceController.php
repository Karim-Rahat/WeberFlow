<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use App\WorkspaceRole;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class WorkspaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return WorkspaceResource::collection($request->user()->workspaces()->orderBy('name')->get());
    }

    public function store(StoreWorkspaceRequest $request): WorkspaceResource
    {
        Gate::authorize('create', Workspace::class);

        $workspace = DB::transaction(function () use ($request): Workspace {
            $workspace = Workspace::create([
                'owner_id' => $request->user()->id,
                'name' => $request->string('name')->toString(),
                'slug' => Str::slug($request->string('name')->toString()).'-'.Str::lower(Str::random(6)),
                'timezone' => $request->input('timezone', $request->user()->timezone),
                'locale' => $request->user()->locale ?? 'en',
            ]);

            $workspace->members()->attach($request->user()->id, [
                'role' => WorkspaceRole::Owner->value,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            $request->user()->update(['current_workspace_id' => $workspace->id]);

            return $workspace;
        });

        return new WorkspaceResource($workspace);
    }

    public function show(Request $request, Workspace $workspace): WorkspaceResource
    {
        abort_unless($request->user()->workspaces()->whereKey($workspace->getKey())->exists(), 404);

        return new WorkspaceResource($workspace->loadCount('members'));
    }
}
