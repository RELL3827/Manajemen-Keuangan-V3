<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Bill;
use App\Models\Budget;
use App\Models\BudgetCategory;
use App\Models\Category;
use App\Models\Notification;
use App\Models\RecurringTransaction;
use App\Models\SavingGoal;
use App\Models\SavingGoalContribution;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Demo User
        $user = User::updateOrCreate(
            ['email' => 'demo@fintrack.id'],
            [
                'name' => 'Aditya Pratama',
                'password' => Hash::make('password123'),
                'currency' => 'IDR',
                'timezone' => 'Asia/Jakarta',
                'date_format' => 'DD/MM/YYYY',
                'theme' => 'dark',
                'notify_bills' => true,
                'notify_budget_alerts' => true,
            ]
        );

        // 2. Default Categories
        $categoriesData = [
            // Incomes
            ['name' => 'Gaji', 'type' => 'income', 'icon' => 'banknote', 'color' => '#10B981'],
            ['name' => 'Freelance', 'type' => 'income', 'icon' => 'laptop', 'color' => '#06B6D4'],
            ['name' => 'Bisnis', 'type' => 'income', 'icon' => 'briefcase', 'color' => '#3B82F6'],
            ['name' => 'Bonus', 'type' => 'income', 'icon' => 'gift', 'color' => '#8B5CF6'],
            ['name' => 'Hasil Investasi', 'type' => 'income', 'icon' => 'trending-up', 'color' => '#EC4899'],
            ['name' => 'Pendapatan Lainnya', 'type' => 'income', 'icon' => 'plus-circle', 'color' => '#14B8A6'],
            // Expenses
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

        $cats = [];
        foreach ($categoriesData as $c) {
            $cats[$c['name']] = Category::updateOrCreate(
                ['user_id' => $user->id, 'name' => $c['name']],
                $c
            );
        }

        // 3. Realistic Accounts
        $accountsData = [
            [
                'name' => 'BCA Tahapan',
                'type' => 'bank',
                'account_number' => '8210492817',
                'balance' => 18450000,
                'initial_balance' => 15000000,
                'color' => '#0284C7',
                'icon' => 'landmark',
                'description' => 'Rekening utama untuk payroll dan transfer harian',
            ],
            [
                'name' => 'Mandiri Prioritas',
                'type' => 'bank',
                'account_number' => '142008392019',
                'balance' => 12300000,
                'initial_balance' => 10000000,
                'color' => '#D97706',
                'icon' => 'landmark',
                'description' => 'Rekening operasional sekunder dan cadangan',
            ],
            [
                'name' => 'Dompet Tunai',
                'type' => 'cash',
                'account_number' => null,
                'balance' => 850000,
                'initial_balance' => 1000000,
                'color' => '#10B981',
                'icon' => 'wallet',
                'description' => 'Uang cash fisik di dompet untuk parkir dan jajan kaki lima',
            ],
            [
                'name' => 'GoPay',
                'type' => 'ewallet',
                'account_number' => '081289384910',
                'balance' => 540000,
                'initial_balance' => 300000,
                'color' => '#06B6D4',
                'icon' => 'smartphone',
                'description' => 'Saldo ojek online, GoFood, dan transaksi QRIS',
            ],
            [
                'name' => 'Dana Digital',
                'type' => 'ewallet',
                'account_number' => '081289384910',
                'balance' => 320000,
                'initial_balance' => 200000,
                'color' => '#3B82F6',
                'icon' => 'smartphone',
                'description' => 'Pembayaran tagihan pulsa, listrik & promo',
            ],
            [
                'name' => 'Bibit Reksadana & SBN',
                'type' => 'investment',
                'account_number' => 'BIBIT-982103',
                'balance' => 35000000,
                'initial_balance' => 30000000,
                'color' => '#10B981',
                'icon' => 'trending-up',
                'description' => 'Portofolio pasar uang, obligasi negara, dan indeks saham',
            ],
        ];

        $accs = [];
        foreach ($accountsData as $acc) {
            $accs[$acc['name']] = Account::updateOrCreate(
                ['user_id' => $user->id, 'name' => $acc['name']],
                array_merge($acc, ['user_id' => $user->id, 'is_active' => true, 'is_archived' => false])
            );
        }

        // Clean previous transactions for demo to keep clean state
        Transaction::where('user_id', $user->id)->delete();

        // 4. Populate Realistic Transactions (Current Month & Previous Month)
        $now = Carbon::now();
        $thisMonthStr = $now->format('Y-m');
        $lastMonth = $now->copy()->subMonth();
        $lastMonthStr = $lastMonth->format('Y-m');

        $sampleTxs = [
            // Current Month Incomes
            [
                'name' => 'Gaji Pokok & Tunjangan Bulanan',
                'type' => 'income',
                'amount' => 17500000,
                'account_id' => $accs['BCA Tahapan']->id,
                'category_id' => $cats['Gaji']->id,
                'date' => "{$thisMonthStr}-01",
                'payment_method' => 'transfer',
                'notes' => 'Gaji bulanan PT Digital Inovasi',
            ],
            [
                'name' => 'Project UI/UX Redesign FinTech',
                'type' => 'income',
                'amount' => 4500000,
                'account_id' => $accs['Mandiri Prioritas']->id,
                'category_id' => $cats['Freelance']->id,
                'date' => "{$thisMonthStr}-08",
                'payment_method' => 'transfer',
                'notes' => 'Pembayaran termin pertama proyek klien freelance',
            ],
            [
                'name' => 'Dividen Portofolio SBN & Obligasi',
                'type' => 'income',
                'amount' => 580000,
                'account_id' => $accs['Bibit Reksadana & SBN']->id,
                'category_id' => $cats['Hasil Investasi']->id,
                'date' => "{$thisMonthStr}-15",
                'payment_method' => 'transfer',
                'notes' => 'Kupon bulanan ORI & Obligasi Negara',
            ],

            // Current Month Expenses
            [
                'name' => 'Belanja Bulanan Supermarket GrandLucky',
                'type' => 'expense',
                'amount' => 1420000,
                'account_id' => $accs['BCA Tahapan']->id,
                'category_id' => $cats['Belanja']->id,
                'date' => "{$thisMonthStr}-02",
                'payment_method' => 'debit_card',
                'notes' => 'Bahan makanan dapur, buah, minyak dan deterjen',
            ],
            [
                'name' => 'Tagihan Listrik PLN Pasca Bayar',
                'type' => 'expense',
                'amount' => 485000,
                'account_id' => $accs['Dana Digital']->id,
                'category_id' => $cats['Tagihan']->id,
                'date' => "{$thisMonthStr}-03",
                'payment_method' => 'transfer',
                'notes' => 'Listrik rumah daya 2200 VA',
            ],
            [
                'name' => 'Langganan Internet IndiHome 50 Mbps',
                'type' => 'expense',
                'amount' => 395000,
                'account_id' => $accs['Dana Digital']->id,
                'category_id' => $cats['Tagihan']->id,
                'date' => "{$thisMonthStr}-05",
                'payment_method' => 'transfer',
                'notes' => 'Internet fiber optic rumah',
            ],
            [
                'name' => 'Makan Siang Tim & Kopi Susu',
                'type' => 'expense',
                'amount' => 85000,
                'account_id' => $accs['GoPay']->id,
                'category_id' => $cats['Makanan']->id,
                'date' => "{$thisMonthStr}-06",
                'payment_method' => 'qris',
                'notes' => 'Ricebowl dan Americano dingin',
            ],
            [
                'name' => 'Isi Bensin Pertamax Penuh',
                'type' => 'expense',
                'amount' => 250000,
                'account_id' => $accs['Dompet Tunai']->id,
                'category_id' => $cats['Transportasi']->id,
                'date' => "{$thisMonthStr}-07",
                'payment_method' => 'cash',
                'notes' => 'SPBU Pertamina',
            ],
            [
                'name' => 'Jajan Sore Martabak Manis & Gorengan',
                'type' => 'expense',
                'amount' => 65000,
                'account_id' => $accs['Dompet Tunai']->id,
                'category_id' => $cats['Makanan']->id,
                'date' => "{$thisMonthStr}-09",
                'payment_method' => 'cash',
                'notes' => 'Cemilan kantor',
            ],
            [
                'name' => 'Skincare Sunscreen & Sabun Muka',
                'type' => 'expense',
                'amount' => 260000,
                'account_id' => $accs['GoPay']->id,
                'category_id' => $cats['Skincare dan perawatan']->id,
                'date' => "{$thisMonthStr}-11",
                'payment_method' => 'qris',
                'notes' => 'Sociolla purchase',
            ],
            [
                'name' => 'Tiket Bioskop XXI & Popcorn Caramel',
                'type' => 'expense',
                'amount' => 140000,
                'account_id' => $accs['GoPay']->id,
                'category_id' => $cats['Hiburan']->id,
                'date' => "{$thisMonthStr}-13",
                'payment_method' => 'qris',
                'notes' => 'Nonton film weekend bersama teman',
            ],
            [
                'name' => 'Makan Malam Sushi Tei',
                'type' => 'expense',
                'amount' => 380000,
                'account_id' => $accs['BCA Tahapan']->id,
                'category_id' => $cats['Makanan']->id,
                'date' => "{$thisMonthStr}-14",
                'payment_method' => 'debit_card',
                'notes' => 'Dinner santai keluarga',
            ],
            [
                'name' => 'Top Up Saldo E-Toll & Parkir',
                'type' => 'expense',
                'amount' => 150000,
                'account_id' => $accs['Mandiri Prioritas']->id,
                'category_id' => $cats['Transportasi']->id,
                'date' => "{$thisMonthStr}-16",
                'payment_method' => 'transfer',
                'notes' => 'Tap e-Money tol dalam kota',
            ],
            [
                'name' => 'Buku Pengembangan Diri & Karir',
                'type' => 'expense',
                'amount' => 125000,
                'account_id' => $accs['BCA Tahapan']->id,
                'category_id' => $cats['Pendidikan']->id,
                'date' => "{$thisMonthStr}-17",
                'payment_method' => 'transfer',
                'notes' => 'Gramedia order online',
            ],

            // Current Month Transfer
            [
                'name' => 'Top Up GoPay dari BCA Tahapan',
                'type' => 'transfer',
                'amount' => 500000,
                'account_id' => $accs['BCA Tahapan']->id,
                'to_account_id' => $accs['GoPay']->id,
                'category_id' => null,
                'date' => "{$thisMonthStr}-04",
                'payment_method' => 'transfer',
                'notes' => 'Isi saldo dompet digital mingguan',
            ],

            // Previous Month Historical Txs
            [
                'name' => 'Gaji Pokok Bulan Lalu',
                'type' => 'income',
                'amount' => 17500000,
                'account_id' => $accs['BCA Tahapan']->id,
                'category_id' => $cats['Gaji']->id,
                'date' => "{$lastMonthStr}-01",
                'payment_method' => 'transfer',
            ],
            [
                'name' => 'Belanja Dapur Bulan Lalu',
                'type' => 'expense',
                'amount' => 1250000,
                'account_id' => $accs['BCA Tahapan']->id,
                'category_id' => $cats['Belanja']->id,
                'date' => "{$lastMonthStr}-03",
                'payment_method' => 'debit_card',
            ],
            [
                'name' => 'Makan & Cafe Bulan Lalu',
                'type' => 'expense',
                'amount' => 1650000,
                'account_id' => $accs['GoPay']->id,
                'category_id' => $cats['Makanan']->id,
                'date' => "{$lastMonthStr}-10",
                'payment_method' => 'qris',
            ],
            [
                'name' => 'Tagihan Listrik & WiFi Bulan Lalu',
                'type' => 'expense',
                'amount' => 860000,
                'account_id' => $accs['Dana Digital']->id,
                'category_id' => $cats['Tagihan']->id,
                'date' => "{$lastMonthStr}-05",
                'payment_method' => 'transfer',
            ],
            [
                'name' => 'Transportasi & Bensin Bulan Lalu',
                'type' => 'expense',
                'amount' => 620000,
                'account_id' => $accs['Dompet Tunai']->id,
                'category_id' => $cats['Transportasi']->id,
                'date' => "{$lastMonthStr}-15",
                'payment_method' => 'cash',
            ],
        ];

        foreach ($sampleTxs as $tx) {
            Transaction::create(array_merge($tx, ['user_id' => $user->id]));
        }

        // 5. Budgets for Current Month
        $budget = Budget::updateOrCreate(
            ['user_id' => $user->id, 'month' => $now->month, 'year' => $now->year],
            [
                'total_budget' => 7500000,
                'method' => 'custom',
            ]
        );

        $allocations = [
            ['cat' => 'Makanan', 'amount' => 2500000],
            ['cat' => 'Belanja', 'amount' => 1500000],
            ['cat' => 'Tagihan', 'amount' => 1200000],
            ['cat' => 'Transportasi', 'amount' => 800000],
            ['cat' => 'Hiburan', 'amount' => 600000],
            ['cat' => 'Skincare dan perawatan', 'amount' => 500000],
            ['cat' => 'Pendidikan', 'amount' => 400000],
        ];

        foreach ($allocations as $alloc) {
            if (isset($cats[$alloc['cat']])) {
                BudgetCategory::updateOrCreate(
                    ['budget_id' => $budget->id, 'category_id' => $cats[$alloc['cat']]->id],
                    ['allocated_amount' => $alloc['amount']]
                );
            }
        }

        // 6. Saving Goals
        $goalsData = [
            [
                'name' => 'Dana Darurat (Emergency Fund)',
                'target_amount' => 50000000,
                'current_amount' => 28500000,
                'target_date' => Carbon::now()->addMonths(10)->toDateString(),
                'periodic_contribution' => 2000000,
                'color' => '#10B981',
                'icon' => 'shield-check',
                'account_id' => $accs['BCA Tahapan']->id,
                'is_completed' => false,
            ],
            [
                'name' => 'Upgrade MacBook Pro M3',
                'target_amount' => 25000000,
                'current_amount' => 17500000,
                'target_date' => Carbon::now()->addMonths(4)->toDateString(),
                'periodic_contribution' => 2000000,
                'color' => '#3B82F6',
                'icon' => 'laptop',
                'account_id' => $accs['Mandiri Prioritas']->id,
                'is_completed' => false,
            ],
            [
                'name' => 'Liburan Akhir Tahun ke Jepang',
                'target_amount' => 18000000,
                'current_amount' => 13500000,
                'target_date' => Carbon::now()->addMonths(2)->toDateString(),
                'periodic_contribution' => 2500000,
                'color' => '#EC4899',
                'icon' => 'plane',
                'account_id' => $accs['BCA Tahapan']->id,
                'is_completed' => false,
            ],
        ];

        foreach ($goalsData as $g) {
            $goal = SavingGoal::updateOrCreate(
                ['user_id' => $user->id, 'name' => $g['name']],
                array_merge($g, ['user_id' => $user->id])
            );

            // Add sample contribution record
            SavingGoalContribution::updateOrCreate(
                ['saving_goal_id' => $goal->id, 'amount' => $g['periodic_contribution']],
                [
                    'user_id' => $user->id,
                    'account_id' => $g['account_id'],
                    'type' => 'deposit',
                    'notes' => 'Setoran rutin bulanan',
                    'date' => Carbon::now()->subDays(5)->toDateString(),
                ]
            );
        }

        // 7. Bills
        $billsData = [
            [
                'title' => 'Tagihan Listrik PLN',
                'amount' => 485000,
                'due_date' => Carbon::now()->addDays(3)->toDateString(),
                'reminder_days_before' => 3,
                'frequency' => 'monthly',
                'is_paid' => false,
                'account_id' => $accs['Dana Digital']->id,
                'category_id' => $cats['Tagihan']->id,
                'notes' => 'Nomor meteran PLN 541289381',
            ],
            [
                'title' => 'WiFi IndiHome Fiber',
                'amount' => 395000,
                'due_date' => Carbon::now()->addDays(7)->toDateString(),
                'reminder_days_before' => 3,
                'frequency' => 'monthly',
                'is_paid' => false,
                'account_id' => $accs['Dana Digital']->id,
                'category_id' => $cats['Tagihan']->id,
                'notes' => 'No Pelanggan: 1223948291',
            ],
            [
                'title' => 'Cicilan Kendaraan Mandiri Tunas',
                'amount' => 1850000,
                'due_date' => Carbon::now()->addDays(14)->toDateString(),
                'reminder_days_before' => 5,
                'frequency' => 'monthly',
                'is_paid' => false,
                'account_id' => $accs['Mandiri Prioritas']->id,
                'category_id' => $cats['Tagihan']->id,
                'notes' => 'Angsuran ke-14 dari 36',
            ],
            [
                'title' => 'Spotify Premium Family',
                'amount' => 86900,
                'due_date' => Carbon::now()->subDays(4)->toDateString(),
                'reminder_days_before' => 2,
                'frequency' => 'monthly',
                'is_paid' => true,
                'paid_at' => Carbon::now()->subDays(4),
                'account_id' => $accs['GoPay']->id,
                'category_id' => $cats['Tagihan']->id,
                'notes' => 'Autodebet GoPay',
            ],
        ];

        foreach ($billsData as $b) {
            Bill::updateOrCreate(
                ['user_id' => $user->id, 'title' => $b['title']],
                array_merge($b, ['user_id' => $user->id])
            );
        }

        // 8. Recurring Transactions
        $recurringData = [
            [
                'name' => 'Gaji Bulanan',
                'type' => 'income',
                'amount' => 17500000,
                'frequency' => 'monthly',
                'start_date' => "{$thisMonthStr}-01",
                'next_due_date' => Carbon::now()->addMonth()->startOfMonth()->toDateString(),
                'account_id' => $accs['BCA Tahapan']->id,
                'category_id' => $cats['Gaji']->id,
                'notes' => 'Payroll rutin dari kantor',
            ],
            [
                'name' => 'Langganan Internet & Listrik',
                'type' => 'expense',
                'amount' => 880000,
                'frequency' => 'monthly',
                'start_date' => "{$thisMonthStr}-05",
                'next_due_date' => Carbon::now()->addMonth()->startOfMonth()->addDays(4)->toDateString(),
                'account_id' => $accs['Dana Digital']->id,
                'category_id' => $cats['Tagihan']->id,
                'notes' => 'Estimasi tagihan utilitas bulanan',
            ],
        ];

        foreach ($recurringData as $r) {
            RecurringTransaction::updateOrCreate(
                ['user_id' => $user->id, 'name' => $r['name']],
                array_merge($r, ['user_id' => $user->id, 'is_active' => true])
            );
        }

        // 9. Notifications
        $notifs = [
            [
                'title' => 'Tagihan Listrik Mendekati Jatuh Tempo',
                'message' => 'Tagihan Listrik PLN sebesar Rp 485.000 akan jatuh tempo dalam 3 hari ke depan.',
                'type' => 'bill',
                'is_read' => false,
                'action_url' => '/bills',
            ],
            [
                'title' => 'Peringatan Anggaran Makanan',
                'message' => 'Pengeluaran Makanan telah mencapai 58% dari total alokasi anggaran bulan ini.',
                'type' => 'budget_warning',
                'is_read' => false,
                'action_url' => '/budgets',
            ],
            [
                'title' => 'Progress Tujuan Tabungan',
                'message' => 'Dana Darurat Anda kini telah mencapai 57% dari target Rp 50.000.000. Pertahankan konsistensi!',
                'type' => 'goal',
                'is_read' => true,
                'action_url' => '/saving-goals',
            ],
        ];

        foreach ($notifs as $n) {
            Notification::updateOrCreate(
                ['user_id' => $user->id, 'title' => $n['title']],
                array_merge($n, ['user_id' => $user->id])
            );
        }
    }
}
