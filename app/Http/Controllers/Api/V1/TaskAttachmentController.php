<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttachmentRequest;
use App\Models\Attachment;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskAttachmentController extends Controller
{
    public function store(StoreAttachmentRequest $request, Task $task): JsonResponse
    {
        $this->authorizeTask($request, $task, 'update');
        $file = $request->file('file');
        $path = $file->store('workspaces/'.$task->workspace_id.'/tasks/'.$task->id, 'local');
        $attachment = $task->attachments()->create([
            'workspace_id' => $task->workspace_id,
            'uploader_id' => $request->user()->id,
            'disk' => 'local',
            'path' => $path,
            'name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize(),
        ]);
        $task->activities()->create(['workspace_id' => $task->workspace_id, 'actor_id' => $request->user()->id, 'event' => 'attachment.created', 'metadata' => ['attachment_id' => $attachment->id, 'name' => $attachment->name]]);

        return response()->json(['data' => $attachment], 201);
    }

    public function show(Request $request, Attachment $attachment): StreamedResponse
    {
        $this->authorizeTask($request, $attachment->task, 'view');

        return Storage::disk($attachment->disk)->download($attachment->path, $attachment->name);
    }

    public function destroy(Request $request, Attachment $attachment): JsonResponse
    {
        $this->authorizeTask($request, $attachment->task, 'update');
        Storage::disk($attachment->disk)->delete($attachment->path);
        $attachment->delete();

        return response()->json(status: 204);
    }

    private function authorizeTask(Request $request, Task $task, string $ability): void
    {
        abort_unless($request->user()->current_workspace_id === $task->workspace_id, 404);
        Gate::authorize($ability, $task->project);
    }
}
