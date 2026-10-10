<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Task $task) {}

    public function via(object $notifiable): array
    {
        $preference = $notifiable->notificationPreference;
        $channels = ($preference?->in_app_notifications ?? true) ? ['database'] : [];

        if ($preference?->assignments_email ?? true) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New task: '.$this->task->title)
            ->greeting('Hello '.$notifiable->name.',')
            ->line('You were assigned a task in WeberFlow.')
            ->line($this->task->title)
            ->action('Open task', url('/app?task='.$this->task->id));
    }

    public function toArray(object $notifiable): array
    {
        return ['task_id' => $this->task->id, 'title' => $this->task->title, 'message' => 'You were assigned a task.'];
    }
}
