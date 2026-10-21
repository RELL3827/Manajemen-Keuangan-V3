<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['cash', 'bank', 'ewallet', 'savings', 'investment', 'other'])->default('bank');
            $table->string('account_number')->nullable();
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('initial_balance', 15, 2)->default(0);
            $table->string('color', 30)->nullable()->default('#10B981');
            $table->string('icon', 50)->nullable()->default('wallet');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_archived')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_archived']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
