<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskCommented;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TaskCommentController extends Controller
{
    public function index(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTask($request, $task);

        return response()->json(['data' => $task->comments()->with('author:id,name')->get()]);
    }

    public function store(StoreCommentRequest $request, Task $task): JsonResponse
    {
        $this->authorizeTask($request, $task);
        $comment = $task->comments()->create(['workspace_id' => $task->workspace_id, 'author_id' => $request->user()->id, 'body' => $request->string('body')->toString()]);
        $task->activities()->create(['workspace_id' => $task->workspace_id, 'actor_id' => $request->user()->id, 'event' => 'comment.created', 'metadata' => ['comment_id' => $comment->id]]);

        preg_match_all('/@([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})/i', $comment->body, $matches);
        $mentioned = User::query()
            ->whereIn('email', array_unique($matches[1] ?? []))
            ->whereHas('workspaces', fn ($query) => $query->whereKey($task->workspace_id))
            ->get();
        $recipients = $mentioned;

        if ($task->assignee && $task->assignee_id !== $request->user()->id && ! $mentioned->contains($task->assignee)) {
            $recipients->push($task->assignee);
        }

        $recipients->each(function (User $recipient) use ($comment, $mentioned): void {
            $recipient->notify((new TaskCommented($comment->loadMissing(['task', 'author']), $mentioned->contains($recipient)))->afterCommit());
        });

        return response()->json(['data' => $comment->load('author:id,name')], 201);
    }

    private function authorizeTask(Request $request, Task $task): void
    {
        abort_unless($request->user()->current_workspace_id === $task->workspace_id, 404);
        Gate::authorize('view', $task->project);
    }
}
