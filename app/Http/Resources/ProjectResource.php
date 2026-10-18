<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'start_date' => $this->start_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'tasks_count' => $this->whenCounted('tasks'),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
            'sections' => $this->whenLoaded('sections', fn () => $this->sections->map(fn ($section): array => [
                'id' => $section->id,
                'name' => $section->name,
                'position' => $section->position,
            ])),
            'custom_fields' => $this->whenLoaded('customFields'),
            'forms' => $this->whenLoaded('forms'),
        ];
    }
}
