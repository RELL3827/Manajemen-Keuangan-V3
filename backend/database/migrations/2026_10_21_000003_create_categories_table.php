<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['income', 'expense']);
            $table->string('icon', 50)->default('tag');
            $table->string('color', 30)->default('#3B82F6');
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'type', 'is_archived']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
