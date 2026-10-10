<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class ProjectController extends Controller
{
    public function index(Request $request, Workspace $workspace): AnonymousResourceCollection
    {
        $this->ensureWorkspaceMember($request, $workspace);

        return ProjectResource::collection(
            $workspace->projects()->withCount('tasks')->latest()->get(),
        );
    }

    public function store(StoreProjectRequest $request, Workspace $workspace): ProjectResource
    {
        $this->ensureWorkspaceMember($request, $workspace);
        Gate::authorize('create', [Project::class, $workspace->id]);

        $project = $workspace->projects()->create([
            ...$request->safe()->only(['name', 'description', 'status', 'start_date', 'due_date']),
            'owner_id' => $request->user()->id,
        ]);

        $project->sections()->create(['name' => 'General', 'position' => 0]);

        return new ProjectResource($project->loadCount('tasks'));
    }

    public function show(Request $request, Project $project): ProjectResource
    {
        $this->ensureCurrentWorkspace($request, $project);
        Gate::authorize('view', $project);

        return new ProjectResource($project->load([
            'tasks' => fn ($query) => $query->with(['assignee', 'predecessors.assignee']),
        ])->loadCount('tasks'));
    }

    private function ensureWorkspaceMember(Request $request, Workspace $workspace): void
    {
        abort_unless($request->user()->workspaces()->whereKey($workspace->getKey())->exists(), 404);
    }

    private function ensureCurrentWorkspace(Request $request, Project $project): void
    {
        abort_unless($request->user()->current_workspace_id === $project->workspace_id, 404);
    }
}
