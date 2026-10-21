<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saving_goal_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('saving_goal_id')->constrained('saving_goals')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->enum('type', ['deposit', 'withdraw'])->default('deposit');
            $table->text('notes')->nullable();
            $table->date('date');
            $table->timestamps();

            $table->index(['saving_goal_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saving_goal_contributions');
    }
};
