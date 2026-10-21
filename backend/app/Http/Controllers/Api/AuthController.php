<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'currency' => 'IDR',
            'timezone' => 'Asia/Jakarta',
            'date_format' => 'DD/MM/YYYY',
            'theme' => 'dark',
            'notify_bills' => true,
            'notify_budget_alerts' => true,
        ]);

        // Create default starter accounts for new user
        Account::create([
            'user_id' => $user->id,
            'name' => 'Dompet Tunai',
            'type' => 'cash',
            'balance' => 0,
            'initial_balance' => 0,
            'color' => '#10B981',
            'icon' => 'wallet',
        ]);

        Account::create([
            'user_id' => $user->id,
            'name' => 'Rekening Utama',
            'type' => 'bank',
            'balance' => 0,
            'initial_balance' => 0,
            'color' => '#3B82F6',
            'icon' => 'landmark',
        ]);

        // Copy default categories to this user if not using global categories
        $this->seedUserDefaultCategories($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password yang Anda masukkan salah.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'currency' => 'sometimes|string|max:10',
            'timezone' => 'sometimes|string|max:50',
            'date_format' => 'sometimes|string|max:20',
            'theme' => 'sometimes|in:dark,light',
            'notify_bills' => 'sometimes|boolean',
            'notify_budget_alerts' => 'sometimes|boolean',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $user->fresh(),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini tidak sesuai.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password berhasil diubah.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->firstOrFail();
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password berhasil direset. Silakan login kembali.',
        ]);
    }

    public function exportData(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = [
            'user' => $user,
            'accounts' => $user->accounts()->get(),
            'categories' => $user->categories()->get(),
            'transactions' => $user->transactions()->with(['account', 'toAccount', 'category'])->get(),
            'budgets' => $user->budgets()->with('budgetCategories.category')->get(),
            'saving_goals' => $user->savingGoals()->with('contributions')->get(),
            'bills' => $user->bills()->get(),
            'recurring_transactions' => $user->recurringTransactions()->get(),
            'exported_at' => now()->toIso8601String(),
        ];

        return response()->json($data);
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Password tidak valid untuk konfirmasi penghapusan akun.'],
            ]);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'Akun FinTrack Anda berhasil dihapus.',
        ]);
    }

    private function seedUserDefaultCategories(User $user): void
    {
        $defaults = [
            // Income
            ['name' => 'Gaji', 'type' => 'income', 'icon' => 'banknote', 'color' => '#10B981'],
            ['name' => 'Freelance', 'type' => 'income', 'icon' => 'laptop', 'color' => '#06B6D4'],
            ['name' => 'Bisnis', 'type' => 'income', 'icon' => 'briefcase', 'color' => '#3B82F6'],
            ['name' => 'Bonus', 'type' => 'income', 'icon' => 'gift', 'color' => '#8B5CF6'],
            ['name' => 'Hasil Investasi', 'type' => 'income', 'icon' => 'trending-up', 'color' => '#EC4899'],
            ['name' => 'Pendapatan Lainnya', 'type' => 'income', 'icon' => 'plus-circle', 'color' => '#14B8A6'],
            // Expense
            ['name' => 'Makanan', 'type' => 'expense', 'icon' => 'utensils', 'color' => '#F43F5E'],
            ['name' => 'Transportasi', 'type' => 'expense', 'icon' => 'car', 'color' => '#FB923C'],
            ['name' => 'Tagihan', 'type' => 'expense', 'icon' => 'receipt', 'color' => '#EAB308'],
            ['name' => 'Belanja', 'type' => 'expense', 'icon' => 'shopping-bag', 'color' => '#A855F7'],
            ['name' => 'Skincare dan perawatan', 'type' => 'expense', 'icon' => 'sparkles', 'color' => '#EC4899'],
            ['name' => 'Hiburan', 'type' => 'expense', 'icon' => 'gamepad-2', 'color' => '#6366F1'],
            ['name' => 'Pendidikan', 'type' => 'expense', 'icon' => 'graduation-cap', 'color' => '#0EA5E9'],
            ['name' => 'Kesehatan', 'type' => 'expense', 'icon' => 'heart-pulse', 'color' => '#EF4444'],
            ['name' => 'Keluarga', 'type' => 'expense', 'icon' => 'home', 'color' => '#F97316'],
            ['name' => 'Investasi', 'type' => 'expense', 'icon' => 'line-chart', 'color' => '#10B981'],
            ['name' => 'Tabungan', 'type' => 'expense', 'icon' => 'piggy-bank', 'color' => '#14B8A6'],
            ['name' => 'Pengeluaran Lainnya', 'type' => 'expense', 'icon' => 'more-horizontal', 'color' => '#64748B'],
        ];

        foreach ($defaults as $cat) {
            Category::create(array_merge($cat, ['user_id' => $user->id]));
        }
    }
}
