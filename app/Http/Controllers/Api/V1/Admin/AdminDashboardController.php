<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => [
            'metrics' => ['users' => User::count(), 'verified_users' => User::whereNotNull('email_verified_at')->count(), 'workspaces' => Workspace::count(), 'failed_emails' => EmailLog::where('status', 'failed')->count()],
            'workspaces' => Workspace::query()->with('owner:id,name,email,email_verified_at,status')->withCount(['members', 'projects'])->latest()->get(),
            'users' => User::query()->select(['id', 'name', 'email', 'email_verified_at', 'status', 'is_platform_admin', 'created_at'])->withCount('workspaces')->latest()->get(),
            'email_logs' => EmailLog::query()->with('user:id,name,email')->latest()->limit(100)->get(),
        ]]);
    }
}
