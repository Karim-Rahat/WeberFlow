<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferencesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'assignments_email' => ['required', 'boolean'],
            'mentions_email' => ['required', 'boolean'],
            'comments_email' => ['required', 'boolean'],
            'deadlines_email' => ['required', 'boolean'],
            'daily_digest_email' => ['required', 'boolean'],
            'in_app_notifications' => ['required', 'boolean'],
        ];
    }
}
