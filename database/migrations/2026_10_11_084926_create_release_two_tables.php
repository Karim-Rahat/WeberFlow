<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('custom_fields', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type');
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->index(['project_id', 'position']);
        });

        Schema::create('custom_field_values', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('custom_field_id')->constrained()->cascadeOnDelete();
            $table->text('value')->nullable();
            $table->timestamps();
            $table->unique(['task_id', 'custom_field_id']);
        });

        Schema::create('project_forms', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('fields');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('project_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained('users')->restrictOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('blueprint');
            $table->timestamps();
            $table->index(['workspace_id', 'created_at']);
        });

        Schema::table('tasks', function (Blueprint $table): void {
            $table->string('recurrence')->nullable()->after('is_milestone');
            $table->unsignedSmallInteger('recurrence_interval')->default(1)->after('recurrence');
            $table->foreignId('recurring_parent_id')->nullable()->after('parent_id')->constrained('tasks')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('recurring_parent_id');
            $table->dropColumn(['recurrence', 'recurrence_interval']);
        });
        Schema::dropIfExists('project_templates');
        Schema::dropIfExists('project_forms');
        Schema::dropIfExists('custom_field_values');
        Schema::dropIfExists('custom_fields');
    }
};
