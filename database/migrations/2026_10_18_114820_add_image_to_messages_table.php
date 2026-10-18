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
        Schema::table('messages', function (Blueprint $table): void {
            $table->string('image_path')->nullable()->after('body');
            $table->string('image_name')->nullable()->after('image_path');
            $table->string('image_mime', 150)->nullable()->after('image_name');
            $table->unsignedBigInteger('image_size')->nullable()->after('image_mime');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropColumn(['image_path', 'image_name', 'image_mime', 'image_size']);
        });
    }
};
