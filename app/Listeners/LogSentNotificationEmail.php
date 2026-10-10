<?php

namespace App\Listeners;

use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Notifications\Events\NotificationSent;

class LogSentNotificationEmail
{
    public function handle(NotificationSent $event): void
    {
        if ($event->channel !== 'mail') {
            return;
        }

        EmailLog::create([
            'user_id' => $event->notifiable instanceof User ? $event->notifiable->id : null,
            'recipient' => (string) $event->notifiable->routeNotificationFor('mail', $event->notification),
            'notification' => $event->notification::class,
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }
}
