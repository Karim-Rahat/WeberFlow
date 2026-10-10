<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Project;
use Illuminate\Support\Facades\Gate;

class ProjectTaskController extends Controller
{
    public function store(StoreTaskRequest $request, Project $project): TaskResource
    {
        abort_unless($request->user()->current_workspace_id === $project->workspace_id, 404);
        Gate::authorize('update', $project);

        $task = $project->tasks()->create([
            ...$request->safe()->only(['section_id', 'assignee_id', 'title', 'description', 'status', 'priority', 'start_date', 'due_date', 'is_milestone']),
            'workspace_id' => $project->workspace_id,
            'creator_id' => $request->user()->id,
            'position' => ((int) $project->tasks()->max('position')) + 1,
        ]);

        return new TaskResource($task->load(['assignee', 'predecessors']));
    }
}
