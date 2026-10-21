<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Services\FinancialService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionController extends Controller
{
    public function __construct(
        protected FinancialService $financialService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Transaction::where('user_id', $user->id)
            ->with(['account', 'toAccount', 'category']);

        // Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Type filter
        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        // Account filter
        if ($accountId = $request->query('account_id')) {
            $query->where(function ($q) use ($accountId) {
                $q->where('account_id', $accountId)
                  ->orWhere('to_account_id', $accountId);
            });
        }

        // Category filter
        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        // Date Presets or Custom Range
        $period = $request->query('period');
        $now = Carbon::now();

        if ($period === 'today') {
            $query->whereDate('date', $now->toDateString());
        } elseif ($period === 'this_week') {
            $query->whereBetween('date', [$now->startOfWeek()->toDateString(), $now->endOfWeek()->toDateString()]);
        } elseif ($period === 'this_month') {
            $query->whereBetween('date', [$now->startOfMonth()->toDateString(), $now->endOfMonth()->toDateString()]);
        } elseif ($period === 'last_month') {
            $lastMonth = Carbon::now()->subMonth();
            $query->whereBetween('date', [$lastMonth->startOfMonth()->toDateString(), $lastMonth->endOfMonth()->toDateString()]);
        } elseif ($period === 'this_year') {
            $query->whereYear('date', $now->year);
        } else {
            if ($startDate = $request->query('start_date')) {
                $query->whereDate('date', '>=', $startDate);
            }
            if ($endDate = $request->query('end_date')) {
                $query->whereDate('date', '<=', $endDate);
            }
        }

        // Sorting
        $sortBy = $request->query('sort_by', 'date');
        $sortOrder = $request->query('sort_order', 'desc');

        if (in_array($sortBy, ['date', 'amount', 'name'])) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest('date');
        }
        $query->latest('id');

        // Stats calculation for the filtered set
        $statsQuery = clone $query;
        $totalIncome = (float) (clone $statsQuery)->where('type', 'income')->sum('amount');
        $totalExpense = (float) (clone $statsQuery)->where('type', 'expense')->sum('amount');
        $netCashflow = $totalIncome - $totalExpense;

        $perPage = (int) $request->query('per_page', 15);
        $transactions = $query->paginate($perPage);

        return response()->json([
            'transactions' => $transactions,
            'summary' => [
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'net_cashflow' => $netCashflow,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:income,expense,transfer',
            'amount' => 'required|numeric|min:1',
            'account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'nullable|required_if:type,transfer|different:account_id|exists:accounts,id',
            'category_id' => 'nullable|required_if:type,expense,income|exists:categories,id',
            'date' => 'required|date',
            'time' => 'nullable|string|max:10',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
            'attachment_url' => 'nullable|string|max:500',
            'is_recurring' => 'nullable|boolean',
        ]);

        $transaction = $this->financialService->createTransaction($user, $validated);

        return response()->json([
            'message' => 'Transaksi berhasil dicatat.',
            'transaction' => $transaction->load(['account', 'toAccount', 'category']),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $transaction = Transaction::where('user_id', $user->id)
            ->with(['account', 'toAccount', 'category'])
            ->findOrFail($id);

        return response()->json([
            'transaction' => $transaction,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $transaction = Transaction::where('user_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:income,expense,transfer',
            'amount' => 'sometimes|numeric|min:1',
            'account_id' => 'sometimes|exists:accounts,id',
            'to_account_id' => 'nullable|different:account_id|exists:accounts,id',
            'category_id' => 'nullable|exists:categories,id',
            'date' => 'sometimes|date',
            'time' => 'nullable|string|max:10',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
            'attachment_url' => 'nullable|string|max:500',
            'is_recurring' => 'nullable|boolean',
        ]);

        $updated = $this->financialService->updateTransaction($transaction, $validated);

        return response()->json([
            'message' => 'Transaksi berhasil diperbarui.',
            'transaction' => $updated->load(['account', 'toAccount', 'category']),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $transaction = Transaction::where('user_id', $user->id)->findOrFail($id);

        $this->financialService->deleteTransaction($transaction);

        return response()->json([
            'message' => 'Transaksi berhasil dihapus dan saldo telah dikembalikan.',
        ]);
    }

    public function duplicate(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $original = Transaction::where('user_id', $user->id)->findOrFail($id);

        $data = [
            'name' => $original->name . ' (Salinan)',
            'type' => $original->type,
            'amount' => $original->amount,
            'account_id' => $original->account_id,
            'to_account_id' => $original->to_account_id,
            'category_id' => $original->category_id,
            'date' => $request->input('date', now()->toDateString()),
            'time' => now()->format('H:i'),
            'payment_method' => $original->payment_method,
            'notes' => $original->notes,
            'is_recurring' => false,
        ];

        $copy = $this->financialService->createTransaction($user, $data);

        return response()->json([
            'message' => 'Transaksi berhasil diduplikasi.',
            'transaction' => $copy->load(['account', 'toAccount', 'category']),
        ], 201);
    }

    public function interpretVoice(Request $request): JsonResponse
    {
        $request->validate([
            'text' => 'required|string|min:2|max:500',
        ]);

        $result = $this->financialService->interpretVoiceText($request->user(), $request->input('text'));

        return response()->json($result);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $user = $request->user();
        $transactions = Transaction::where('user_id', $user->id)
            ->with(['account', 'toAccount', 'category'])
            ->orderBy('date', 'desc')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="fintrack_transaksi_' . date('Y-m-d') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($transactions) {
            $handle = fopen('php://output', 'w');
            // Add UTF-8 BOM for Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'ID',
                'Tanggal',
                'Waktu',
                'Nama Transaksi',
                'Jenis',
                'Kategori',
                'Akun Sumber',
                'Akun Tujuan',
                'Nominal (IDR)',
                'Metode Pembayaran',
                'Catatan',
            ]);

            foreach ($transactions as $t) {
                fputcsv($handle, [
                    $t->id,
                    $t->date->format('Y-m-d'),
                    $t->time ?? '-',
                    $t->name,
                    $t->type,
                    $t->category?->name ?? ($t->type === 'transfer' ? 'Transfer Antar Akun' : '-'),
                    $t->account?->name ?? '-',
                    $t->toAccount?->name ?? '-',
                    $t->amount,
                    $t->payment_method ?? '-',
                    $t->notes ?? '-',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    public function importCsv(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $user = $request->user();
        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        $importedCount = 0;
        $failedCount = 0;
        $rowNumber = 0;

        $accounts = Account::where('user_id', $user->id)->get();
        $categories = Category::where(function ($q) use ($user) {
            $q->whereNull('user_id')->orWhere('user_id', $user->id);
        })->get();

        $defaultAccount = $accounts->first();

        while (($row = fgetcsv($handle, 1000, ',')) !== false) {
            $rowNumber++;
            if ($rowNumber === 1 && (str_contains(strtolower($row[0] ?? ''), 'id') || str_contains(strtolower($row[0] ?? ''), 'tanggal'))) {
                continue; // Skip header
            }

            // Expected columns: Tanggal, Nama, Jenis, Kategori, Nominal, Akun
            $date = !empty($row[0]) ? trim($row[0]) : now()->toDateString();
            $name = !empty($row[1]) ? trim($row[1]) : 'Transaksi Impor #' . $rowNumber;
            $type = !empty($row[2]) ? strtolower(trim($row[2])) : 'expense';
            if (!in_array($type, ['income', 'expense', 'transfer'])) {
                $type = 'expense';
            }
            $catName = !empty($row[3]) ? trim($row[3]) : null;
            $amount = !empty($row[4]) ? floatval(preg_replace('/[^0-9.]/', '', str_replace(',', '.', $row[4]))) : 0;
            $accName = !empty($row[5]) ? trim($row[5]) : null;

            if ($amount <= 0) {
                $failedCount++;
                continue;
            }

            $matchedAccount = $defaultAccount;
            if ($accName) {
                $foundAcc = $accounts->first(fn($a) => strcasecmp($a->name, $accName) === 0);
                if ($foundAcc) $matchedAccount = $foundAcc;
            }

            $matchedCat = null;
            if ($catName) {
                $matchedCat = $categories->first(fn($c) => strcasecmp($c->name, $catName) === 0);
            }

            try {
                $this->financialService->createTransaction($user, [
                    'account_id' => $matchedAccount->id,
                    'category_id' => $matchedCat?->id,
                    'name' => $name,
                    'type' => $type,
                    'amount' => $amount,
                    'date' => Carbon::parse($date)->toDateString(),
                    'payment_method' => 'import',
                    'notes' => 'Diimpor dari file CSV',
                ]);
                $importedCount++;
            } catch (\Exception $e) {
                $failedCount++;
            }
        }
        fclose($handle);

        return response()->json([
            'message' => "Proses impor selesai. {$importedCount} transaksi berhasil dimasukkan, {$failedCount} gagal.",
            'imported_count' => $importedCount,
            'failed_count' => $failedCount,
        ]);
    }
}
