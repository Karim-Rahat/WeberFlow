<?php

namespace App\Http\Requests;

class UpdateTaskRequest extends StoreTaskRequest
{
    public function rules(): array
    {
        return collect(parent::rules())
            ->map(fn (array $rules): array => array_map(fn (mixed $rule): mixed => $rule === 'required' ? 'sometimes' : $rule, $rules))
            ->all();
    }
}
