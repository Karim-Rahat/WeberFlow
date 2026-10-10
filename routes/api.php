<?php

use App\Http\Controllers\Api\V1\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Api\V1\Auth\NewPasswordController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetLinkController;
use App\Http\Controllers\Api\V1\Auth\RegisteredUserController;
use App\Http\Controllers\Api\V1\Auth\SessionController;
use App\Http\Controllers\Api\V1\Auth\VerifyEmailController;
use App\Http\Controllers\Api\V1\CurrentWorkspaceController;
use App\Http\Controllers\Api\V1\NotificationPreferenceController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::middleware('guest')->group(function (): void {
        Route::post('/auth/register', RegisteredUserController::class)->name('api.auth.register');
        Route::post('/auth/login', [SessionController::class, 'store'])->middleware('throttle:login')->name('api.auth.login');
        Route::post('/auth/forgot-password', PasswordResetLinkController::class)->middleware('throttle:auth-email')->name('password.email');
        Route::post('/auth/reset-password', NewPasswordController::class)->name('password.store');
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::delete('/auth/session', [SessionController::class, 'destroy'])->name('api.auth.logout');
        Route::get('/me', [ProfileController::class, 'show'])->name('api.profile.show');
        Route::patch('/me', [ProfileController::class, 'update'])->name('api.profile.update');

        Route::get('/email/verify/{id}/{hash}', VerifyEmailController::class)
            ->middleware('signed')
            ->name('verification.verify');
        Route::post('/email/verification-notification', EmailVerificationNotificationController::class)
            ->middleware('throttle:auth-email')
            ->name('verification.send');

        Route::get('/workspaces', [WorkspaceController::class, 'index'])->name('api.workspaces.index');
        Route::post('/workspaces', [WorkspaceController::class, 'store'])->name('api.workspaces.store');
        Route::get('/workspaces/{workspace}', [WorkspaceController::class, 'show'])->name('api.workspaces.show');
        Route::put('/current-workspace', CurrentWorkspaceController::class)->name('api.current-workspace.update');

        Route::get('/notification-preferences', [NotificationPreferenceController::class, 'show'])->name('api.notification-preferences.show');
        Route::put('/notification-preferences', [NotificationPreferenceController::class, 'update'])->name('api.notification-preferences.update');
    });
});
