<?php

namespace App\Events;

use App\Models\ProjectMessage;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectMessagePosted implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    public function __construct(public ProjectMessage $projectMessage) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('workspace.'.$this->projectMessage->project->workspace_id)];
    }

    public function broadcastAs(): string
    {
        return 'project.message.posted';
    }

    public function broadcastWith(): array
    {
        return ['id' => $this->projectMessage->id, 'project_id' => $this->projectMessage->project_id, 'body' => $this->projectMessage->body];
    }
}
