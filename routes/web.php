<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/', '/flowchart.html')->name('project-flow');

Route::view('/app', 'app')->name('app');

Route::get('/implementation-plan', function () {
    return response()->file(base_path('IMPLEMENTATION_PLAN.md'), [
        'Content-Type' => 'text/markdown; charset=UTF-8',
    ]);
})->name('implementation-plan');
