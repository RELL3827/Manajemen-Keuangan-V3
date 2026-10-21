<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\InsightController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RecurringTransactionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SavingGoalController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

// Public Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Protected routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/password', [AuthController::class, 'changePassword']);
    Route::get('/export-data', [AuthController::class, 'exportData']);
    Route::delete('/account-delete', [AuthController::class, 'deleteAccount']);

    // Accounts
    Route::get('/accounts', [AccountController::class, 'index']);
    Route::post('/accounts', [AccountController::class, 'store']);
    Route::post('/accounts/transfer', [AccountController::class, 'transfer']);
    Route::get('/accounts/{id}', [AccountController::class, 'show']);
    Route::put('/accounts/{id}', [AccountController::class, 'update']);
    Route::delete('/accounts/{id}', [AccountController::class, 'destroy']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::post('/transactions/voice-interpret', [TransactionController::class, 'interpretVoice']);
    Route::get('/transactions/export-csv', [TransactionController::class, 'exportCsv']);
    Route::post('/transactions/import-csv', [TransactionController::class, 'importCsv']);
    Route::get('/transactions/{id}', [TransactionController::class, 'show']);
    Route::put('/transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);
    Route::post('/transactions/{id}/duplicate', [TransactionController::class, 'duplicate']);

    // Budgets
    Route::get('/budgets', [BudgetController::class, 'index']);
    Route::post('/budgets', [BudgetController::class, 'storeOrUpdate']);
    Route::post('/budgets/copy-previous', [BudgetController::class, 'copyPreviousMonth']);

    // Saving Goals
    Route::get('/saving-goals', [SavingGoalController::class, 'index']);
    Route::post('/saving-goals', [SavingGoalController::class, 'store']);
    Route::get('/saving-goals/{id}', [SavingGoalController::class, 'show']);
    Route::put('/saving-goals/{id}', [SavingGoalController::class, 'update']);
    Route::delete('/saving-goals/{id}', [SavingGoalController::class, 'destroy']);
    Route::post('/saving-goals/{id}/contribute', [SavingGoalController::class, 'contribute']);

    // Bills
    Route::get('/bills', [BillController::class, 'index']);
    Route::post('/bills', [BillController::class, 'store']);
    Route::get('/bills/{id}', [BillController::class, 'show']);
    Route::put('/bills/{id}', [BillController::class, 'update']);
    Route::delete('/bills/{id}', [BillController::class, 'destroy']);
    Route::post('/bills/{id}/mark-paid', [BillController::class, 'markAsPaid']);
    Route::post('/bills/{id}/mark-unpaid', [BillController::class, 'markAsUnpaid']);

    // Recurring Transactions
    Route::get('/recurring-transactions', [RecurringTransactionController::class, 'index']);
    Route::post('/recurring-transactions', [RecurringTransactionController::class, 'store']);
    Route::put('/recurring-transactions/{id}', [RecurringTransactionController::class, 'update']);
    Route::delete('/recurring-transactions/{id}', [RecurringTransactionController::class, 'destroy']);
    Route::post('/recurring-transactions/{id}/process-now', [RecurringTransactionController::class, 'processNow']);

    // Reports & Analytics
    Route::get('/reports/summary', [ReportController::class, 'summary']);

    // Insights
    Route::get('/insights', [InsightController::class, 'index']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});
