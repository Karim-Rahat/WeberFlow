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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('current_workspace_id')->nullable()->after('id')->constrained('workspaces')->nullOnDelete();
            $table->string('avatar_path')->nullable()->after('password');
            $table->string('timezone')->default('UTC')->after('avatar_path');
            $table->string('locale', 10)->default('en')->after('timezone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('current_workspace_id');
            $table->dropColumn(['avatar_path', 'timezone', 'locale']);
        });
    }
};
