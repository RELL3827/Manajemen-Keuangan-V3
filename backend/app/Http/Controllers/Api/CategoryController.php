<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $type = $request->query('type'); // 'income', 'expense', or null
        $includeArchived = $request->boolean('include_archived', false);

        $query = Category::where(function ($q) use ($user) {
            $q->whereNull('user_id')->orWhere('user_id', $user->id);
        });

        if ($type) {
            $query->where('type', $type);
        }

        if (!$includeArchived) {
            $query->where('is_archived', false);
        }

        $categories = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'categories' => $categories,
            'income_categories' => $categories->where('type', 'income')->values(),
            'expense_categories' => $categories->where('type', 'expense')->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:income,expense',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:30',
        ]);

        $category = Category::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'icon' => $validated['icon'] ?? 'tag',
            'color' => $validated['color'] ?? ($validated['type'] === 'income' ? '#10B981' : '#F43F5E'),
            'is_archived' => false,
        ]);

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan.',
            'category' => $category,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $category = Category::where('user_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:30',
            'is_archived' => 'sometimes|boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Kategori berhasil diperbarui.',
            'category' => $category->fresh(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $category = Category::where('user_id', $user->id)->findOrFail($id);

        $hasTransactions = $category->transactions()->exists();

        if ($hasTransactions) {
            // Archive to preserve transaction history
            $category->update(['is_archived' => true]);
            return response()->json([
                'message' => 'Kategori sudah memiliki riwayat transaksi sehingga diarsipkan agar data tetap akurat.',
                'category' => $category,
                'archived' => true,
            ]);
        }

        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus.',
            'deleted' => true,
        ]);
    }
}
