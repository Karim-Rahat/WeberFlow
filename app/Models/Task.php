<?php

namespace App\Models;

use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workspace_id', 'project_id', 'section_id', 'creator_id', 'assignee_id', 'parent_id', 'recurring_parent_id', 'title', 'description', 'status', 'priority', 'start_date', 'due_date', 'is_milestone', 'recurrence', 'recurrence_interval', 'completed_at', 'position'])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(ProjectSection::class, 'section_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function recurringChildren(): HasMany
    {
        return $this->hasMany(self::class, 'recurring_parent_id');
    }

    public function customFields(): BelongsToMany
    {
        return $this->belongsToMany(CustomField::class, 'custom_field_values')->withPivot('value')->withTimestamps();
    }

    public function predecessors(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'task_dependencies', 'dependent_task_id', 'predecessor_task_id')->withTimestamps();
    }

    public function dependents(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'task_dependencies', 'predecessor_task_id', 'dependent_task_id')->withTimestamps();
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->oldest();
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class)->latest();
    }

    protected function casts(): array
    {
        return ['start_date' => 'date', 'due_date' => 'date', 'is_milestone' => 'boolean', 'recurrence_interval' => 'integer', 'completed_at' => 'datetime'];
    }
}
