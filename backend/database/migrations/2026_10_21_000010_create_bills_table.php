<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('title');
            $table->decimal('amount', 15, 2);
            $table->date('due_date');
            $table->unsignedSmallInteger('reminder_days_before')->default(3);
            $table->boolean('is_paid')->default(false);
            $table->dateTime('paid_at')->nullable();
            $table->foreignId('paid_transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->enum('frequency', ['one_time', 'weekly', 'monthly', 'yearly'])->default('one_time');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_paid', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
