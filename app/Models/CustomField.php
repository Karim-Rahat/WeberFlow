<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['project_id', 'name', 'type', 'options', 'is_required', 'position'])]
class CustomField extends Model
{
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'custom_field_values')->withPivot('value')->withTimestamps();
    }

    protected function casts(): array
    {
        return ['options' => 'array', 'is_required' => 'boolean'];
    }
}
