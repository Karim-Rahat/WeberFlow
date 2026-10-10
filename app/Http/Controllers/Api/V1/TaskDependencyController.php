<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TaskChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskDependencyRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class TaskDependencyController extends Controller
{
    public function store(StoreTaskDependencyRequest $request, Task $task): TaskResource
    {
        abort_unless($request->user()->current_workspace_id === $task->workspace_id, 404);
        Gate::authorize('update', $task->project);

        $predecessorId = $request->integer('predecessor_task_id');

        if ($this->createsCycle($task, $predecessorId)) {
            throw ValidationException::withMessages([
                'predecessor_task_id' => 'This dependency would create a cycle.',
            ]);
        }

        $task->predecessors()->syncWithoutDetaching([$predecessorId]);
        $task->activities()->create(['workspace_id' => $task->workspace_id, 'actor_id' => $request->user()->id, 'event' => 'dependency.created', 'metadata' => ['predecessor_task_id' => $predecessorId]]);
        TaskChanged::dispatch($task, 'dependency.updated');

        return new TaskResource($task->load(['assignee', 'predecessors']));
    }

    public function destroy(StoreTaskDependencyRequest $request, Task $task): JsonResponse
    {
        abort_unless($request->user()->current_workspace_id === $task->workspace_id, 404);
        Gate::authorize('update', $task->project);
        $task->predecessors()->detach($request->integer('predecessor_task_id'));
        $task->activities()->create(['workspace_id' => $task->workspace_id, 'actor_id' => $request->user()->id, 'event' => 'dependency.deleted', 'metadata' => ['predecessor_task_id' => $request->integer('predecessor_task_id')]]);
        TaskChanged::dispatch($task, 'dependency.updated');

        return response()->json(status: 204);
    }

    private function createsCycle(Task $dependent, int $predecessorId): bool
    {
        $visited = [];
        $pending = [$dependent->id];

        while ($pending !== []) {
            $taskId = array_pop($pending);
            if ($taskId === $predecessorId) {
                return true;
            }
            if (isset($visited[$taskId])) {
                continue;
            }
            $visited[$taskId] = true;
            array_push($pending, ...Task::query()->findOrFail($taskId)->dependents()->pluck('tasks.id')->all());
        }

        return false;
    }
}
