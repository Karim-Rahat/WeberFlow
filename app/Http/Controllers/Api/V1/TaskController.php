<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TaskChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Notifications\TaskAssigned;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    public function show(Request $request, Task $task): TaskResource
    {
        $this->authorizeTask($request, $task, 'view');

        return new TaskResource($task->load(['assignee', 'predecessors', 'comments.author', 'attachments', 'activities.actor']));
    }

    public function update(UpdateTaskRequest $request, Task $task): TaskResource
    {
        $this->authorizeTask($request, $task, 'update');
        $before = $task->only(['title', 'status', 'priority', 'assignee_id', 'start_date', 'due_date', 'completed_at']);
        $data = $request->safe()->only(['section_id', 'assignee_id', 'title', 'description', 'status', 'priority', 'start_date', 'due_date', 'is_milestone']);

        if (($data['status'] ?? null) === 'complete') {
            $data['completed_at'] = now();
        } elseif (array_key_exists('status', $data)) {
            $data['completed_at'] = null;
        }

        $oldAssigneeId = $task->assignee_id;
        $task->update($data);
        $task->activities()->create(['workspace_id' => $task->workspace_id, 'actor_id' => $request->user()->id, 'event' => 'task.updated', 'metadata' => ['before' => $before, 'after' => $task->only(array_keys($before))]]);

        if ($task->assignee_id && $task->assignee_id !== $oldAssigneeId && $task->assignee_id !== $request->user()->id) {
            $task->assignee->notify((new TaskAssigned($task))->afterCommit());
        }

        TaskChanged::dispatch($task, 'updated');

        return new TaskResource($task->load(['assignee', 'predecessors']));
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTask($request, $task, 'update');
        TaskChanged::dispatch($task, 'deleted');
        $task->delete();

        return response()->json(status: 204);
    }

    private function authorizeTask(Request $request, Task $task, string $ability): void
    {
        abort_unless($request->user()->current_workspace_id === $task->workspace_id, 404);
        Gate::authorize($ability, $task->project);
    }
}
