<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectTemplateRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProjectTemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        $this->ensureWorkspaceMember($request, $workspace);

        return response()->json(['data' => ProjectTemplate::query()->whereBelongsTo($workspace)->latest()->get()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProjectTemplateRequest $request, Project $project): JsonResponse
    {
        abort_unless($request->user()->current_workspace_id === $project->workspace_id, 404);
        Gate::authorize('update', $project);
        $project->load(['sections', 'tasks', 'customFields']);

        $template = ProjectTemplate::query()->create([
            'workspace_id' => $project->workspace_id,
            'creator_id' => $request->user()->id,
            ...$request->validated(),
            'blueprint' => [
                'project' => $project->only(['description', 'status']),
                'sections' => $project->sections->map->only(['name', 'position'])->all(),
                'tasks' => $project->tasks->map->only(['title', 'description', 'status', 'priority', 'start_date', 'due_date', 'is_milestone', 'position', 'recurrence', 'recurrence_interval'])->all(),
                'custom_fields' => $project->customFields->map->only(['name', 'type', 'options', 'is_required', 'position'])->all(),
            ],
        ]);

        return response()->json(['data' => $template], 201);
    }

    /**
     * Display the specified resource.
     */
    public function apply(StoreProjectTemplateRequest $request, Workspace $workspace, ProjectTemplate $projectTemplate): ProjectResource
    {
        $this->ensureWorkspaceMember($request, $workspace);
        Gate::authorize('create', [Project::class, $workspace->id]);
        abort_unless($projectTemplate->workspace_id === $workspace->id, 404);

        $project = DB::transaction(function () use ($request, $workspace, $projectTemplate): Project {
            $blueprint = $projectTemplate->blueprint;
            $project = $workspace->projects()->create([
                'owner_id' => $request->user()->id,
                'name' => $request->validated('name'),
                'description' => $blueprint['project']['description'] ?? $projectTemplate->description,
                'status' => $blueprint['project']['status'] ?? 'on_track',
            ]);
            foreach ($blueprint['sections'] as $section) {
                $project->sections()->create($section);
            }
            foreach ($blueprint['tasks'] as $task) {
                $project->tasks()->create([...$task, 'workspace_id' => $workspace->id, 'creator_id' => $request->user()->id]);
            }
            foreach ($blueprint['custom_fields'] as $field) {
                $project->customFields()->create($field);
            }

            return $project;
        });

        return new ProjectResource($project->load(['tasks.assignee', 'customFields', 'forms'])->loadCount('tasks'));
    }

    /**
     * Update the specified resource in storage.
     */
    private function ensureWorkspaceMember(Request $request, Workspace $workspace): void
    {
        abort_unless($request->user()->workspaces()->whereKey($workspace->getKey())->exists(), 404);
    }
}
