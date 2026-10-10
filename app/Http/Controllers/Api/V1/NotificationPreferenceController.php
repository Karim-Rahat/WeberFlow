<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateNotificationPreferencesRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $preferences = $request->user()->notificationPreference()->firstOrCreate();

        return response()->json(['data' => $preferences]);
    }

    public function update(UpdateNotificationPreferencesRequest $request): JsonResponse
    {
        $preferences = $request->user()->notificationPreference()->firstOrCreate();
        $preferences->update($request->validated());

        return response()->json(['data' => $preferences->fresh()]);
    }
}
