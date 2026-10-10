<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    public function update(UpdateAdminUserRequest $request, User $user): JsonResponse
    {
        $data = $request->safe()->only(['name', 'status']);
        if (array_key_exists('status', $data)) {
            $data['suspended_at'] = $data['status'] === 'suspended' ? now() : null;
        }
        if ($request->has('email_verified')) {
            $data['email_verified_at'] = $request->boolean('email_verified') ? ($user->email_verified_at ?? now()) : null;
        }
        $user->forceFill($data)->save();

        return response()->json(['data' => $user->fresh()]);
    }
}
