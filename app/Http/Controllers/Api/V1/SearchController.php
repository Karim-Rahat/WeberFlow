<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));
        $workspaceId = $request->user()->current_workspace_id;

        if ($workspaceId === null || mb_strlen($query) < 2) {
            return response()->json(['data' => ['tasks' => [], 'projects' => [], 'comments' => [], 'people' => []]]);
        }

        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $query).'%';

        $tasks = Task::query()
            ->where('workspace_id', $workspaceId)
            ->where(fn ($builder) => $builder->where('title', 'like', $like)->orWhere('description', 'like', $like))
            ->with('project:id,name')
            ->orderBy('title')
            ->limit(8)
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'status' => $task->status,
                'project' => $task->project ? ['id' => $task->project->id, 'name' => $task->project->name] : null,
            ]);

        $projects = Project::query()
            ->where('workspace_id', $workspaceId)
            ->where(fn ($builder) => $builder->where('name', 'like', $like)->orWhere('description', 'like', $like))
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
            ]);

        $comments = Comment::query()
            ->where('workspace_id', $workspaceId)
            ->where('body', 'like', $like)
            ->with(['task:id,project_id,title', 'author:id,name'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Comment $comment): array => [
                'id' => $comment->id,
                'body' => Str::limit($comment->body, 120),
                'task' => $comment->task ? ['id' => $comment->task->id, 'project_id' => $comment->task->project_id, 'title' => $comment->task->title] : null,
                'author' => $comment->author?->name,
            ]);

        $people = User::query()
            ->whereHas('workspaceMemberships', fn ($builder) => $builder->where('workspace_id', $workspaceId)->where('status', 'active'))
            ->where(fn ($builder) => $builder->where('name', 'like', $like)->orWhere('email', 'like', $like))
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);

        return response()->json([
            'data' => [
                'tasks' => $tasks,
                'projects' => $projects,
                'comments' => $comments,
                'people' => $people,
            ],
        ]);
    }
}
