<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MessageController extends Controller
{
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        $this->ensureWorkspaceMember($request, $workspace);

        $userId = $request->user()->id;

        $messages = Message::query()
            ->where('workspace_id', $workspace->id)
            ->where(fn ($query) => $query->where('sender_id', $userId)->orWhere('recipient_id', $userId))
            ->with(['sender:id,name', 'recipient:id,name'])
            ->latest()
            ->get();

        $conversations = $messages
            ->groupBy(fn (Message $message): int => $message->sender_id === $userId ? $message->recipient_id : $message->sender_id)
            ->map(function ($thread) use ($userId): array {
                $latest = $thread->first();
                $counterpart = $latest->sender_id === $userId ? $latest->recipient : $latest->sender;

                return [
                    'user' => ['id' => $counterpart->id, 'name' => $counterpart->name],
                    'last_message' => [
                        'body' => $latest->body,
                        'created_at' => $latest->created_at?->toISOString(),
                        'from_me' => $latest->sender_id === $userId,
                    ],
                    'unread_count' => $thread
                        ->where('recipient_id', $userId)
                        ->whereNull('read_at')
                        ->count(),
                ];
            })
            ->sortByDesc(fn (array $conversation): string => $conversation['last_message']['created_at'])
            ->values();

        return response()->json(['data' => $conversations]);
    }

    public function thread(Request $request, Workspace $workspace, User $user): AnonymousResourceCollection
    {
        $this->ensureWorkspaceMember($request, $workspace);
        $this->ensureActiveMember($workspace, $user);

        $currentId = $request->user()->id;

        Message::query()
            ->where('workspace_id', $workspace->id)
            ->where('sender_id', $user->id)
            ->where('recipient_id', $currentId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = Message::query()
            ->where('workspace_id', $workspace->id)
            ->where(function ($query) use ($currentId, $user): void {
                $query->where(fn ($pair) => $pair->where('sender_id', $currentId)->where('recipient_id', $user->id))
                    ->orWhere(fn ($pair) => $pair->where('sender_id', $user->id)->where('recipient_id', $currentId));
            })
            ->with(['sender:id,name', 'recipient:id,name'])
            ->latest()
            ->limit(200)
            ->get()
            ->sortBy('created_at')
            ->values();

        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request, Workspace $workspace): MessageResource
    {
        $this->ensureWorkspaceMember($request, $workspace);

        $image = $request->file('image');

        $attributes = [
            'workspace_id' => $workspace->id,
            'sender_id' => $request->user()->id,
            'recipient_id' => $request->integer('recipient_id'),
            'body' => $request->string('body')->toString(),
        ];

        if ($image) {
            $attributes['image_path'] = $image->store('workspaces/'.$workspace->id.'/messages', 'local');
            $attributes['image_name'] = $image->getClientOriginalName();
            $attributes['image_mime'] = $image->getMimeType() ?? 'application/octet-stream';
            $attributes['image_size'] = $image->getSize();
        }

        $message = Message::create($attributes);

        $message->load(['sender:id,name', 'recipient:id,name']);

        MessageSent::dispatch($message);

        return new MessageResource($message);
    }

    public function image(Request $request, Message $message): StreamedResponse
    {
        $userId = $request->user()->id;

        abort_unless($message->sender_id === $userId || $message->recipient_id === $userId, 404);
        abort_unless($message->image_path, 404);

        return Storage::disk('local')->response($message->image_path, $message->image_name ?? 'image');
    }

    private function ensureWorkspaceMember(Request $request, Workspace $workspace): void
    {
        abort_unless($request->user()->workspaces()->whereKey($workspace->getKey())->exists(), 404);
    }

    private function ensureActiveMember(Workspace $workspace, User $user): void
    {
        abort_unless(
            $workspace->members()->whereKey($user->getKey())->wherePivot('status', 'active')->exists(),
            404,
        );
    }
}
