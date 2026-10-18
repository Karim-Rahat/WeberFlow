<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $workspace = $this->route('workspace');

        return [
            'recipient_id' => [
                'required',
                'integer',
                Rule::exists('workspace_members', 'user_id')
                    ->where('workspace_id', $workspace?->id)
                    ->where('status', 'active'),
            ],
            'body' => ['nullable', 'string', 'max:10000', 'required_without:image'],
            'image' => ['nullable', 'image', 'max:5120', 'mimes:jpg,jpeg,png,webp,gif'],
        ];
    }
}
