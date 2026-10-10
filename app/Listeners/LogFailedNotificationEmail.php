<?php

namespace App\Listeners;

use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Notifications\Events\NotificationFailed;

class LogFailedNotificationEmail
{
    public function handle(NotificationFailed $event): void
    {
        if ($event->channel !== 'mail') {
            return;
        }

        EmailLog::create([
            'user_id' => $event->notifiable instanceof User ? $event->notifiable->id : null,
            'recipient' => (string) $event->notifiable->routeNotificationFor('mail', $event->notification),
            'notification' => $event->notification::class,
            'status' => 'failed',
            'error' => isset($event->data['exception']) ? $event->data['exception']->getMessage() : null,
        ]);
    }
}
