<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_photo')->nullable()->after('password');
            $table->string('currency', 10)->default('IDR')->after('profile_photo');
            $table->string('timezone', 50)->default('Asia/Jakarta')->after('currency');
            $table->string('date_format', 20)->default('DD/MM/YYYY')->after('timezone');
            $table->string('theme', 10)->default('dark')->after('date_format');
            $table->boolean('notify_bills')->default(true)->after('theme');
            $table->boolean('notify_budget_alerts')->default(true)->after('notify_bills');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'profile_photo',
                'currency',
                'timezone',
                'date_format',
                'theme',
                'notify_bills',
                'notify_budget_alerts',
            ]);
        });
    }
};
