<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSavedSearchRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'filters' => ['required', 'array'],
            'filters.status' => ['nullable', 'string', 'max:40'],
            'filters.priority' => ['nullable', 'string', 'max:40'],
            'filters.assignee' => ['nullable', 'string', 'max:40'],
            'filters.due' => ['nullable', 'string', 'max:40'],
            'filters.sortBy' => ['nullable', 'string', 'max:40'],
            'filters.sortDirection' => ['nullable', 'string', 'max:4'],
            'filters.groupBy' => ['nullable', 'string', 'max:40'],
        ];
    }
}
