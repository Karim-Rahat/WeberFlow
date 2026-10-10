<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSectionRequest extends FormRequest
{
    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:120']];
    }
}
