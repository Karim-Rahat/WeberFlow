<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'start_date' => $this->start_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'is_milestone' => $this->is_milestone,
            'recurrence' => $this->recurrence,
            'recurrence_interval' => $this->recurrence_interval,
            'completed_at' => $this->completed_at?->toISOString(),
            'section_id' => $this->section_id,
            'project' => $this->whenLoaded('project', fn (): array => ['id' => $this->project->id, 'name' => $this->project->name]),
            'assignee' => $this->whenLoaded('assignee', fn (): ?array => $this->assignee ? ['id' => $this->assignee->id, 'name' => $this->assignee->name] : null),
            'predecessors' => TaskResource::collection($this->whenLoaded('predecessors')),
            'subtasks' => TaskResource::collection($this->whenLoaded('subtasks')),
            'custom_fields' => $this->whenLoaded('customFields', fn () => $this->customFields->map(fn ($field): array => ['id' => $field->id, 'name' => $field->name, 'type' => $field->type, 'value' => $field->pivot->value])),
            'blocked_by_dependency' => $this->whenLoaded('predecessors', fn (): bool => $this->predecessors->contains(fn ($task): bool => $task->status !== 'complete')),
            'comments' => $this->whenLoaded('comments', fn () => $this->comments->map(fn ($comment): array => ['id' => $comment->id, 'body' => $comment->body, 'author' => ['id' => $comment->author->id, 'name' => $comment->author->name], 'created_at' => $comment->created_at->toISOString()])),
            'attachments' => $this->whenLoaded('attachments', fn () => $this->attachments->map(fn ($attachment): array => ['id' => $attachment->id, 'name' => $attachment->name, 'size' => $attachment->size, 'url' => route('api.attachments.show', $attachment)])),
            'activity' => $this->whenLoaded('activities', fn () => $this->activities->map(fn ($activity): array => ['id' => $activity->id, 'event' => $activity->event, 'actor' => $activity->actor?->name, 'created_at' => $activity->created_at->toISOString()])),
        ];
    }
}
