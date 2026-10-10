<?php

use App\Http\Controllers\Api\V1\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Api\V1\Auth\NewPasswordController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetLinkController;
use App\Http\Controllers\Api\V1\Auth\RegisteredUserController;
use App\Http\Controllers\Api\V1\Auth\SessionController;
use App\Http\Controllers\Api\V1\Auth\VerifyEmailController;
use App\Http\Controllers\Api\V1\CurrentWorkspaceController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\NotificationPreferenceController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProjectSectionController;
use App\Http\Controllers\Api\V1\ProjectTaskController;
use App\Http\Controllers\Api\V1\TaskAttachmentController;
use App\Http\Controllers\Api\V1\TaskCommentController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\TaskDependencyController;
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

        Route::get('/workspaces/{workspace}/projects', [ProjectController::class, 'index'])->name('api.projects.index');
        Route::post('/workspaces/{workspace}/projects', [ProjectController::class, 'store'])->name('api.projects.store');
        Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('api.projects.show');
        Route::post('/projects/{project}/sections', [ProjectSectionController::class, 'store'])->name('api.project-sections.store');
        Route::post('/projects/{project}/tasks', [ProjectTaskController::class, 'store'])->name('api.project-tasks.store');
        Route::get('/tasks/{task}', [TaskController::class, 'show'])->name('api.tasks.show');
        Route::patch('/tasks/{task}', [TaskController::class, 'update'])->name('api.tasks.update');
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('api.tasks.destroy');
        Route::get('/tasks/{task}/comments', [TaskCommentController::class, 'index'])->name('api.task-comments.index');
        Route::post('/tasks/{task}/comments', [TaskCommentController::class, 'store'])->name('api.task-comments.store');
        Route::post('/tasks/{task}/attachments', [TaskAttachmentController::class, 'store'])->name('api.task-attachments.store');
        Route::get('/attachments/{attachment}', [TaskAttachmentController::class, 'show'])->name('api.attachments.show');
        Route::delete('/attachments/{attachment}', [TaskAttachmentController::class, 'destroy'])->name('api.attachments.destroy');
        Route::post('/tasks/{task}/dependencies', [TaskDependencyController::class, 'store'])->name('api.task-dependencies.store');
        Route::delete('/tasks/{task}/dependencies', [TaskDependencyController::class, 'destroy'])->name('api.task-dependencies.destroy');
        Route::get('/notifications', [NotificationController::class, 'index'])->name('api.notifications.index');
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('api.notifications.read');

        Route::get('/notification-preferences', [NotificationPreferenceController::class, 'show'])->name('api.notification-preferences.show');
        Route::put('/notification-preferences', [NotificationPreferenceController::class, 'update'])->name('api.notification-preferences.update');
    });
});
