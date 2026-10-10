<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('on_track');
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamps();
            $table->index(['workspace_id', 'status']);
        });

        Schema::create('project_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->index(['project_id', 'position']);
        });

        Schema::create('tasks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('project_sections')->nullOnDelete();
            $table->foreignId('creator_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('tasks')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('not_started');
            $table->string('priority')->default('medium');
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->boolean('is_milestone')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->index(['project_id', 'status', 'position']);
            $table->index(['workspace_id', 'assignee_id', 'due_date']);
        });

        Schema::create('task_dependencies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('predecessor_task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('dependent_task_id')->constrained('tasks')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['predecessor_task_id', 'dependent_task_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_dependencies');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('project_sections');
        Schema::dropIfExists('projects');
    }
};
