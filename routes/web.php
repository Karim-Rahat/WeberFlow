<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/', '/flowchart.html')->name('project-flow');

Route::view('/app', 'app')->name('app');

Route::view('/app/reset-password/{token}', 'app')->name('password.reset');

Route::view('/app/{workspace}/{project}', 'app')
    ->whereNumber('project')
    ->name('projects.open');

Route::get('/implementation-plan', function () {
    return response()->file(base_path('IMPLEMENTATION_PLAN.md'), [
        'Content-Type' => 'text/markdown; charset=UTF-8',
    ]);
})->name('implementation-plan');
