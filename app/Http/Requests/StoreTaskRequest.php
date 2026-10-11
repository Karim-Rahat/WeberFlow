<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function rules(): array
    {
        $project = $this->route('project') ?? $this->route('task')?->project;
        $projectId = $project?->getKey();

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'section_id' => ['nullable', Rule::exists('project_sections', 'id')->where('project_id', $projectId)],
            'parent_id' => ['nullable', Rule::exists('tasks', 'id')->where('project_id', $projectId)],
            'assignee_id' => ['nullable', Rule::exists('workspace_members', 'user_id')->where('workspace_id', $project?->workspace_id)->where('status', 'active')],
            'status' => ['nullable', Rule::in(['not_started', 'in_progress', 'blocked', 'complete'])],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_milestone' => ['nullable', 'boolean'],
            'recurrence' => ['nullable', Rule::in(['daily', 'weekly', 'monthly'])],
            'recurrence_interval' => ['nullable', 'integer', 'min:1', 'max:52'],
            'custom_fields' => ['nullable', 'array'],
            'custom_fields.*' => ['nullable', 'string', 'max:10000'],
        ];
    }
}
