<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('to_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('name');
            $table->enum('type', ['income', 'expense', 'transfer']);
            $table->decimal('amount', 15, 2);
            $table->date('date');
            $table->string('time', 10)->nullable();
            $table->string('payment_method', 50)->nullable()->default('transfer');
            $table->text('notes')->nullable();
            $table->string('attachment_url')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->unsignedBigInteger('recurring_id')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'date']);
            $table->index(['account_id']);
            $table->index(['to_account_id']);
            $table->index(['category_id']);
            $table->index(['type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
