<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'read_at' => $this->read_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'from_me' => $request->user()?->id === $this->sender_id,
            'image_url' => $this->image_path ? route('api.messages.image', $this->id) : null,
            'image_name' => $this->image_name,
            'sender' => ['id' => $this->sender->id, 'name' => $this->sender->name],
            'recipient' => ['id' => $this->recipient->id, 'name' => $this->recipient->name],
        ];
    }
}
