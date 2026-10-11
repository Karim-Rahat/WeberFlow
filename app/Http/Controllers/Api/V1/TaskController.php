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

        return new TaskResource($task->load(['assignee', 'predecessors', 'customFields', 'comments.author', 'attachments', 'activities.actor']));
    }

    public function update(UpdateTaskRequest $request, Task $task): TaskResource
    {
        $this->authorizeTask($request, $task, 'update');
        $before = $task->only(['title', 'status', 'priority', 'assignee_id', 'start_date', 'due_date', 'completed_at']);
        $data = $request->safe()->only(['section_id', 'assignee_id', 'title', 'description', 'status', 'priority', 'start_date', 'due_date', 'is_milestone', 'recurrence', 'recurrence_interval']);

        if (($data['status'] ?? null) === 'complete') {
            $data['completed_at'] = now();
        } elseif (array_key_exists('status', $data)) {
            $data['completed_at'] = null;
        }

        $oldAssigneeId = $task->assignee_id;
        $task->update($data);
        if ($request->has('custom_fields')) {
            $customFields = collect($request->validated('custom_fields', []))
                ->only($task->project->customFields()->pluck('id')->map(fn (int $id): string => (string) $id)->all())
                ->map(fn (?string $value): array => ['value' => $value]);
            $task->customFields()->sync($customFields);
        }

        if (($data['status'] ?? null) === 'complete' && $task->recurrence && ! $task->recurringChildren()->exists()) {
            $nextTask = $task->replicate(['completed_at']);
            $nextTask->status = 'not_started';
            $nextTask->completed_at = null;
            $nextTask->recurring_parent_id = $task->id;
            $nextTask->start_date = $this->nextOccurrence($task->start_date, $task->recurrence, $task->recurrence_interval);
            $nextTask->due_date = $this->nextOccurrence($task->due_date, $task->recurrence, $task->recurrence_interval);
            $nextTask->position = ((int) $task->project->tasks()->max('position')) + 1;
            $nextTask->save();
            $nextTask->customFields()->sync($task->customFields()->pluck('custom_field_values.value', 'custom_fields.id')->map(fn (?string $value): array => ['value' => $value]));
        }
        $task->activities()->create(['workspace_id' => $task->workspace_id, 'actor_id' => $request->user()->id, 'event' => 'task.updated', 'metadata' => ['before' => $before, 'after' => $task->only(array_keys($before))]]);

        if ($task->assignee_id && $task->assignee_id !== $oldAssigneeId && $task->assignee_id !== $request->user()->id) {
            $task->assignee->notify((new TaskAssigned($task))->afterCommit());
        }

        TaskChanged::dispatch($task, 'updated');

        return new TaskResource($task->load(['assignee', 'predecessors', 'customFields']));
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

    private function nextOccurrence(mixed $date, string $recurrence, int $interval): mixed
    {
        if ($date === null) {
            return null;
        }

        return match ($recurrence) {
            'daily' => $date->copy()->addDays($interval),
            'weekly' => $date->copy()->addWeeks($interval),
            'monthly' => $date->copy()->addMonthsNoOverflow($interval),
        };
    }
}
