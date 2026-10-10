<?php

namespace App\Notifications;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskCommented extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Comment $comment, public bool $mentioned = false) {}

    public function via(object $notifiable): array
    {
        $preference = $notifiable->notificationPreference;
        $channels = ($preference?->in_app_notifications ?? true) ? ['database'] : [];
        $emailEnabled = $this->mentioned ? ($preference?->mentions_email ?? true) : ($preference?->comments_email ?? true);

        return $emailEnabled ? [...$channels, 'mail'] : $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(($this->mentioned ? 'You were mentioned: ' : 'New comment: ').$this->comment->task->title)
            ->line($this->comment->author->name.' commented on '.$this->comment->task->title.'.')
            ->line($this->comment->body)
            ->action('Open task', url('/app?task='.$this->comment->task_id));
    }

    public function toArray(object $notifiable): array
    {
        return ['task_id' => $this->comment->task_id, 'comment_id' => $this->comment->id, 'mentioned' => $this->mentioned, 'message' => $this->mentioned ? 'You were mentioned in a comment.' : 'A task has a new comment.'];
    }
}
