<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user()->load(['currentWorkspace', 'workspaces', 'notificationPreference']));
    }

    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $emailChanged = $user->email !== $request->string('email')->toString();

        $user->update($request->validated());

        if ($emailChanged) {
            $user->forceFill(['email_verified_at' => null])->save();
            $user->sendEmailVerificationNotification();
        }

        return new UserResource($user->load(['currentWorkspace', 'workspaces', 'notificationPreference']));
    }
}
