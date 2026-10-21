<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinancialService
{
    /**
     * Create a transaction and adjust account balances atomically.
     */
    public function createTransaction(User $user, array $data): Transaction
    {
        return DB::transaction(function () use ($user, $data) {
            $type = $data['type'];
            $amount = floatval($data['amount']);
            $sourceAccount = Account::where('id', $data['account_id'])
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($type === 'income') {
                $sourceAccount->increment('balance', $amount);
            } elseif ($type === 'expense') {
                $sourceAccount->decrement('balance', $amount);
            } elseif ($type === 'transfer') {
                if (empty($data['to_account_id'])) {
                    throw new \InvalidArgumentException('Akun tujuan transfer wajib dipilih.');
                }
                if ($data['account_id'] === $data['to_account_id']) {
                    throw new \InvalidArgumentException('Akun sumber dan akun tujuan tidak boleh sama.');
                }
                $targetAccount = Account::where('id', $data['to_account_id'])
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $sourceAccount->decrement('balance', $amount);
                $targetAccount->increment('balance', $amount);
            }

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'account_id' => $sourceAccount->id,
                'to_account_id' => $data['to_account_id'] ?? null,
                'category_id' => $data['category_id'] ?? null,
                'name' => $data['name'],
                'type' => $type,
                'amount' => $amount,
                'date' => $data['date'] ?? Carbon::now()->toDateString(),
                'time' => $data['time'] ?? Carbon::now()->format('H:i'),
                'payment_method' => $data['payment_method'] ?? 'transfer',
                'notes' => $data['notes'] ?? null,
                'attachment_url' => $data['attachment_url'] ?? null,
                'is_recurring' => $data['is_recurring'] ?? false,
            ]);

            return $transaction;
        });
    }

    /**
     * Update an existing transaction and recalculate account balance differences.
     */
    public function updateTransaction(Transaction $transaction, array $data): Transaction
    {
        return DB::transaction(function () use ($transaction, $data) {
            $user = $transaction->user;

            // 1. Revert previous transaction effect
            $oldSourceAccount = Account::where('id', $transaction->account_id)->lockForUpdate()->first();
            if ($oldSourceAccount) {
                if ($transaction->type === 'income') {
                    $oldSourceAccount->decrement('balance', $transaction->amount);
                } elseif ($transaction->type === 'expense') {
                    $oldSourceAccount->increment('balance', $transaction->amount);
                } elseif ($transaction->type === 'transfer' && $transaction->to_account_id) {
                    $oldTargetAccount = Account::where('id', $transaction->to_account_id)->lockForUpdate()->first();
                    $oldSourceAccount->increment('balance', $transaction->amount);
                    if ($oldTargetAccount) {
                        $oldTargetAccount->decrement('balance', $transaction->amount);
                    }
                }
            }

            // 2. Apply new transaction effect
            $newType = $data['type'] ?? $transaction->type;
            $newAmount = floatval($data['amount'] ?? $transaction->amount);
            $newAccountId = $data['account_id'] ?? $transaction->account_id;
            $newToAccountId = $data['to_account_id'] ?? $transaction->to_account_id;

            $newSourceAccount = Account::where('id', $newAccountId)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($newType === 'income') {
                $newSourceAccount->increment('balance', $newAmount);
            } elseif ($newType === 'expense') {
                $newSourceAccount->decrement('balance', $newAmount);
            } elseif ($newType === 'transfer') {
                if (!$newToAccountId || $newAccountId === $newToAccountId) {
                    throw new \InvalidArgumentException('Akun tujuan transfer tidak valid.');
                }
                $newTargetAccount = Account::where('id', $newToAccountId)
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $newSourceAccount->decrement('balance', $newAmount);
                $newTargetAccount->increment('balance', $newAmount);
            }

            $transaction->update([
                'account_id' => $newAccountId,
                'to_account_id' => $newType === 'transfer' ? $newToAccountId : null,
                'category_id' => $newType === 'transfer' ? null : ($data['category_id'] ?? $transaction->category_id),
                'name' => $data['name'] ?? $transaction->name,
                'type' => $newType,
                'amount' => $newAmount,
                'date' => $data['date'] ?? $transaction->date,
                'time' => $data['time'] ?? $transaction->time,
                'payment_method' => $data['payment_method'] ?? $transaction->payment_method,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $transaction->notes,
                'attachment_url' => array_key_exists('attachment_url', $data) ? $data['attachment_url'] : $transaction->attachment_url,
                'is_recurring' => $data['is_recurring'] ?? $transaction->is_recurring,
            ]);

            return $transaction;
        });
    }

    /**
     * Delete transaction and safely reverse account balance.
     */
    public function deleteTransaction(Transaction $transaction): bool
    {
        return DB::transaction(function () use ($transaction) {
            $sourceAccount = Account::where('id', $transaction->account_id)->lockForUpdate()->first();
            if ($sourceAccount) {
                if ($transaction->type === 'income') {
                    $sourceAccount->decrement('balance', $transaction->amount);
                } elseif ($transaction->type === 'expense') {
                    $sourceAccount->increment('balance', $transaction->amount);
                } elseif ($transaction->type === 'transfer' && $transaction->to_account_id) {
                    $targetAccount = Account::where('id', $transaction->to_account_id)->lockForUpdate()->first();
                    $sourceAccount->increment('balance', $transaction->amount);
                    if ($targetAccount) {
                        $targetAccount->decrement('balance', $transaction->amount);
                    }
                }
            }

            return $transaction->delete();
        });
    }

    /**
     * Parse natural language voice commands in Indonesian.
     * Examples:
     * - "Tadi beli makan 20 ribu"
     * - "Gaji masuk 2 juta ke Mandiri"
     * - "Bayar bensin 30 ribu dari uang tunai"
     * - "Nabung 100 ribu ke rekening tabungan"
     */
    public function interpretVoiceText(User $user, string $text): array
    {
        $raw = trim($text);
        $lower = strtolower($raw);

        // 1. Identify transaction type
        $type = 'expense'; // default
        if (preg_match('/(gaji|masuk|terima|dapat|pendapatan|transferan dari|untung|bonus|cair)/i', $lower)) {
            $type = 'income';
        } elseif (preg_match('/(transfer ke|kirim ke|pindah ke|nabung|tabung)/i', $lower)) {
            $type = 'transfer';
        }

        // 2. Extract amount
        $amount = 0;
        // Patterns:
        // "20 ribu" -> 20 * 1000 = 20000
        // "2.5 juta" or "2,5 juta" -> 2500000
        // "50000" or "Rp 50.000"
        if (preg_match('/(\d+(?:[\.,]\d+)?)\s*(juta|jt)/i', $lower, $m)) {
            $num = floatval(str_replace(',', '.', $m[1]));
            $amount = $num * 1000000;
        } elseif (preg_match('/(\d+(?:[\.,]\d+)?)\s*(ribu|rb|k)/i', $lower, $m)) {
            $num = floatval(str_replace(',', '.', $m[1]));
            $amount = $num * 1000;
        } elseif (preg_match('/(?:rp\.?|nominal|sebesar)?\s*(\d{1,3}(?:\.\d{3})+(?:,\d+)?)/i', $lower, $m)) {
            $cleaned = str_replace('.', '', $m[1]);
            $cleaned = str_replace(',', '.', $cleaned);
            $amount = floatval($cleaned);
        } elseif (preg_match('/(?:rp\.?|nominal|sebesar)?\s*(\d+)/i', $lower, $m)) {
            $amount = floatval($m[1]);
        }

        // 3. Match categories
        $categories = Category::where(function ($q) use ($user) {
            $q->whereNull('user_id')->orWhere('user_id', $user->id);
        })->where('is_archived', false)->get();

        $matchedCategory = null;
        $categoryKeywords = [
            'Makanan' => ['makan', 'makanan', 'minum', 'kopi', 'sarapan', 'siang', 'malam', 'restoran', 'cafe', 'cemilan', 'snack', 'bakso', 'ayam', 'nasi'],
            'Transportasi' => ['bensin', 'pertalite', 'pertamax', 'parkir', 'ojol', 'gojek', 'grab', 'kereta', 'krl', 'mrt', 'tol', 'bus', 'angkot'],
            'Tagihan' => ['listrik', 'pln', 'air', 'pdam', 'wifi', 'internet', 'pulsa', 'kuota', 'bpjs', 'netflix', 'spotify', 'langganan', 'sewa'],
            'Belanja' => ['belanja', 'baju', 'sepatu', 'tokopedia', 'shopee', 'supermarket', 'indomaret', 'alfamart', 'mall'],
            'Skincare dan perawatan' => ['skincare', 'perawatan', 'salon', 'barbershop', 'kosmetik'],
            'Hiburan' => ['nonton', 'bioskop', 'game', 'liburan', 'karaoke', 'wisata'],
            'Pendidikan' => ['buku', 'kursus', 'kuliah', 'sekolah', 'spp', 'pelatihan'],
            'Kesehatan' => ['obat', 'dokter', 'rumah sakit', 'klinik', 'apotek', 'vitamin'],
            'Keluarga' => ['keluarga', 'ortu', 'anak', 'susu', 'pampers'],
            'Investasi' => ['saham', 'reksadana', 'crypto', 'kripto', 'emas', 'bibit', 'ajaib'],
            'Tabungan' => ['nabung', 'tabungan', 'simpan'],
            'Gaji' => ['gaji', 'salary', 'upah', 'payroll'],
            'Freelance' => ['freelance', 'proyek', 'side hustle', 'klien'],
            'Bisnis' => ['omset', 'penjualan', 'bisnis', 'toko'],
            'Bonus' => ['bonus', 'thr', 'reward'],
        ];

        foreach ($categoryKeywords as $catName => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($lower, $kw)) {
                    $matchedCategory = $categories->first(function ($c) use ($catName) {
                        return strcasecmp($c->name, $catName) === 0;
                    });
                    if ($matchedCategory) {
                        break 2;
                    }
                }
            }
        }

        // 4. Match accounts
        $accounts = Account::where('user_id', $user->id)->where('is_archived', false)->get();
        $matchedAccount = null;
        $matchedToAccount = null;

        foreach ($accounts as $acc) {
            $accNameLower = strtolower($acc->name);
            if (str_contains($lower, $accNameLower)) {
                $matchedAccount = $acc;
                break;
            }
            if ($acc->type === 'cash' && (str_contains($lower, 'tunai') || str_contains($lower, 'cash') || str_contains($lower, 'dompet'))) {
                $matchedAccount = $acc;
                break;
            }
            if ($acc->type === 'bank' && str_contains($lower, 'bank')) {
                $matchedAccount = $acc;
                break;
            }
            if ($acc->type === 'ewallet' && (str_contains($lower, 'ewallet') || str_contains($lower, 'e-wallet'))) {
                $matchedAccount = $acc;
                break;
            }
        }

        if (!$matchedAccount) {
            // Default to first active account
            $matchedAccount = $accounts->first();
        }

        // For transfers, check target account
        if ($type === 'transfer') {
            foreach ($accounts as $acc) {
                if ($matchedAccount && $acc->id === $matchedAccount->id) {
                    continue;
                }
                $accNameLower = strtolower($acc->name);
                if (str_contains($lower, $accNameLower) || ($acc->type === 'savings' && str_contains($lower, 'tabungan'))) {
                    $matchedToAccount = $acc;
                    break;
                }
            }
        }

        // 5. Clean name
        $name = ucfirst($raw);
        if (preg_match('/(?:tadi|baru saja|barusan)?\s*(beli|bayar|isi|pesan|jajan|makan|gaji|terima|dapat|nabung|transfer)\s+([^0-9]+)/i', $raw, $matches)) {
            $name = ucfirst(trim($matches[1] . ' ' . $matches[2]));
        }

        return [
            'original_text' => $raw,
            'interpreted' => [
                'name' => $name,
                'type' => $type,
                'amount' => $amount,
                'category_id' => $matchedCategory?->id,
                'category_name' => $matchedCategory?->name,
                'account_id' => $matchedAccount?->id,
                'account_name' => $matchedAccount?->name,
                'to_account_id' => $matchedToAccount?->id,
                'to_account_name' => $matchedToAccount?->name,
                'date' => Carbon::now()->toDateString(),
                'payment_method' => $matchedAccount?->type === 'cash' ? 'cash' : 'transfer',
            ],
            'confidence' => ($amount > 0 && ($matchedCategory || $type === 'transfer')) ? 'high' : 'medium',
        ];
    }
}
