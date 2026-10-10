<?php

namespace App\Models;

use App\WorkspaceRole;
use Database\Factories\WorkspaceMemberFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

#[Fillable(['workspace_id', 'user_id', 'role', 'status', 'joined_at'])]
class WorkspaceMember extends Pivot
{
    /** @use HasFactory<WorkspaceMemberFactory> */
    use HasFactory;

    public $incrementing = true;

    protected $table = 'workspace_members';

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'role' => WorkspaceRole::class,
            'joined_at' => 'datetime',
        ];
    }
}
