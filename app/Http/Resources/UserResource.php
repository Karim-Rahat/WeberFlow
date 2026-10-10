<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'email' => $this->email,
            'email_verified' => $this->email_verified_at !== null,
            'is_platform_admin' => $this->is_platform_admin,
            'status' => $this->status,
            'avatar_url' => $this->avatar_path ? asset('storage/'.$this->avatar_path) : null,
            'timezone' => $this->timezone,
            'locale' => $this->locale,
            'current_workspace' => new WorkspaceResource($this->whenLoaded('currentWorkspace')),
            'workspaces' => WorkspaceResource::collection($this->whenLoaded('workspaces')),
            'notification_preferences' => $this->whenLoaded('notificationPreference'),
        ];
    }
}
