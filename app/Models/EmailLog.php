<?php

namespace App\Models;

use Database\Factories\EmailLogFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'recipient', 'notification', 'subject', 'status', 'error', 'sent_at'])]
class EmailLog extends Model
{
    /** @use HasFactory<EmailLogFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return ['sent_at' => 'datetime'];
    }
}
