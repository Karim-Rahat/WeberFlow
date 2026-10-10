<?php

namespace App\Models;

use Database\Factories\NotificationPreferenceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'assignments_email', 'mentions_email', 'comments_email', 'deadlines_email', 'daily_digest_email', 'in_app_notifications'])]
class NotificationPreference extends Model
{
    /** @use HasFactory<NotificationPreferenceFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'assignments_email' => 'boolean',
            'mentions_email' => 'boolean',
            'comments_email' => 'boolean',
            'deadlines_email' => 'boolean',
            'daily_digest_email' => 'boolean',
            'in_app_notifications' => 'boolean',
        ];
    }
}
