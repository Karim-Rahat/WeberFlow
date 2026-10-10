<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkspaceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'timezone' => $this->timezone,
            'locale' => $this->locale,
            'role' => $request->user() ? $this->roleFor($request->user())?->value : null,
            'members_count' => $this->whenCounted('members'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
