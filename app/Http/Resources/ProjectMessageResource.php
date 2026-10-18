<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'user_id' => $this->user_id,
            'author' => $this->whenLoaded('user', fn (): array => ['id' => $this->user->id, 'name' => $this->user->name]),
            'can_delete' => $request->user()?->id === $this->user_id,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
