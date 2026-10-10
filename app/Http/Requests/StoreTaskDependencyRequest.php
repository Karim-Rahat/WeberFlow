<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskDependencyRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'predecessor_task_id' => [
                'required',
                'integer',
                Rule::exists('tasks', 'id')->where('project_id', $this->route('task')?->project_id),
                Rule::notIn([$this->route('task')?->getKey()]),
            ],
        ];
    }
}
