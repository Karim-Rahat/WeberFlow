<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'fields' => ['required', 'array', 'min:1', 'max:25'],
            'fields.*.label' => ['required', 'string', 'max:100'],
            'fields.*.type' => ['required', 'in:text,textarea,date,number'],
            'fields.*.required' => ['required', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
