# FinTrack — Modern Personal Finance Management Platform

**FinTrack** adalah aplikasi platform **Manajemen Keuangan Pribadi (Personal Finance Management)** cerdas, modern, dan profesional yang dirancang untuk mengelola arus kas pemasukan, pengeluaran, transfer antar rekening, anggaran bulanan, target tabungan, pengingat tagihan, serta analisis kesehatan finansial dalam satu dashboard terpadu.

Aplikasi ini siap digunakan dan dapat dikembangkan menjadi model bisnis **SaaS (Software-as-a-Service)** multi-tenant.

---

## 🚀 Fitur Unggulan FinTrack

### 1. 📊 Dashboard Keuangan Komprehensif
- **Kartu Ringkasan Real-Time**: Total likuiditas seluruh akun, pemasukan bulan ini, pengeluaran, surplus kas bersih (*Net Cashflow*), dan rasio tabungan (*Savings Rate*).
- **Grafik Interaktif Recharts**:
  - Tren Arus Kas 6 Bulan (Area Chart perbandingan Pemasukan vs Pengeluaran).
  - Donut Chart komposisi pengeluaran per kategori.
- **Peringatan Kuota Anggaran**: Bar progress dinamis dengan notifikasi visual saat menyentuh 50% (waspada), 80% (kritis), dan 100% (over-budget).
- **Filter Periode Fleksibel**: Hari ini, Minggu ini, Bulan ini, Bulan lalu, Tahun ini, serta rentang tanggal kustom.
- **Widget Pintar**: Transaksi terbaru, tagihan jatuh tempo terdekat, dan progress tujuan tabungan.

### 2. 💸 Manajemen Transaksi Fleksibel
- Mendukung 3 jenis transaksi: **Pemasukan**, **Pengeluaran**, dan **Transfer Antar Rekening**.
- **Kalkulasi Saldo Otomatis & Atomik**: Menggunakan database transaction (`DB::transaction`) dengan perlindungan *race condition* (`lockForUpdate`).
- **Transfer Bersih**: Transfer antar rekening tidak dihitung sebagai pemasukan atau pengeluaran baru pada ringkasan keuangan global.
- **Fitur Lengkap**: Tambah, edit, hapus transaksi (dengan pengembalian saldo otomatis), duplikasi transaksi 1-klik.
- **Pencarian & Multi-Filter**: Berdasarkan kata kunci nama/catatan, kategori, akun, jenis, dan tanggal.
- **Ekspor & Impor**:
  - Ekspor data transaksi ke file **CSV** dan **Excel (.xlsx)**.
  - Impor data dari file CSV dengan validasi format kolom otomatis.

### 3. 🎙️ Input Transaksi dengan Suara (AI Voice Parsing)
- Menggunakan **Web Speech API** bahasa Indonesia untuk mengenali ucapan pengguna secara langsung di browser HP maupun desktop.
- Menginterpretasikan struktur perintah suara secara cerdas:
  - *"Tadi beli makan 25 ribu"* → Jenis: Pengeluaran, Nominal: 25.000, Kategori: Makanan.
  - *"Gaji masuk 5 juta ke rekening BCA"* → Jenis: Pemasukan, Nominal: 5.000.000, Kategori: Gaji, Akun: BCA.
  - *"Bayar bensin 30 ribu dari dompet tunai"* → Jenis: Pengeluaran, Nominal: 30.000, Kategori: Transportasi, Akun: Dompet Tunai.
  - *"Nabung 100 ribu ke rekening tabungan"* → Jenis: Transfer / Tabungan, Nominal: 100.000.
- **Konfirmasi & Edit Sebelum Simpan**: Pengguna dapat melihat dan menyunting hasil interpretasi sebelum data disimpan secara permanen ke database backend.

### 4. 🏦 Manajemen Akun & Dompet Multiguna
- Mengelola multi-akun: **Uang Tunai (Cash)**, **Rekening Bank**, **Dompet Digital (e-Wallet)**, **Tabungan**, dan **Portofolio Investasi**.
- Setiap akun mencatat saldo awal, saldo saat ini, nomor rekening, warna aksen, dan deskripsi.
- **Pengarsipan Aman**: Akun yang sudah memiliki riwayat transaksi diarsipkan (tidak dihapus fisik) agar histori keuangan tetap utuh.

### 5. 🎯 Anggaran Bulanan (Budgeting)
- Menentukan batas total anggaran bulanan dan alokasi limit per kategori.
- Monitoring *budget vs actual* dengan indikator visual persentase pemakaian.
- Fitur **Salin Anggaran Bulan Lalu** untuk kemudahan perencanaan tanpa repot.
- Dilengkapi **Kalkulator Aturan 50/30/20** (50% Kebutuhan Pokok, 30% Keinginan, 20% Tabungan/Investasi).

### 6. 🏆 Tujuan Tabungan (Saving Goals)
- Menetapkan target tabungan (Dana Darurat, Laptop Baru, Liburan, Kendaraan, dll).
- Estimasi waktu pencapaian target berdasarkan kontribusi rutin bulanan.
- **Setor Tabungan & Tarik Dana Terintegrasi**: Pemotongan saldo langsung terhubung dengan rekening keuangan pilihan pengguna tanpa pencatatan ganda.
- Efek perayaan konfeti (*confetti animation*) saat tujuan tabungan berhasil mencapai 100%!

### 7. ⏰ Pengingat Tagihan & Transaksi Berulang
- Pelacakan tagihan rutin (Listrik PLN, WiFi IndiHome, Cicilan, Spotify, Sewa).
- Indikator status: *Lunas*, *Jatuh Tempo Mendekati*, dan *Lewat Batas (Overdue)*.
- Tombol **Tandai Lunas**: Memotong saldo akun secara otomatis dan mencatat transaksi pengeluaran.
- Transaksi berulang harian, mingguan, bulanan, atau tahunan.

### 8. 📈 Laporan & Analitik Finansial
- Analisis arus kas bulanan mendalam dan tren surplus bersih.
- Komposisi belanja kategori terbesar dan frekuensi transaksi.
- Ekspor laporan ke **CSV**, spreadsheet **Excel (.xlsx)**, dan dokumen cetak **PDF**.

### 9. 🧠 Insight Keuangan Otomatis & Health Score
- **Skor Kesehatan Finansial (0-100)** berbasis rasio tabungan aktual.
- Notifikasi anomali: Deteksi lonjakan pengeluaran kategori tertentu dibandingkan bulan sebelumnya.
- Peringatan penggunaan kuota pos anggaran mendekati limit.

### 10. 📱 Progressive Web App (PWA)
- Mendukung instalasi aplikasi di **Android** dan **Windows Desktop** (Add to Home Screen / Install App).
- Dilengkapi Web App Manifest (`manifest.json`) dan Service Worker (`sw.js`).
- Tampilan responsif dengan desktop sidebar dan mobile bottom navigation.

---

## 🛠️ Stack Teknologi

| Komponen | Teknologi |
|---|---|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS v4, Modern Glassmorphism UI |
| **Icons** | Lucide React |
| **Grafik & Visual** | Recharts (AreaChart, BarChart, LineChart, PieChart) |
| **Ekspor Dokumen** | jsPDF, jsPDF-AutoTable, XLSX (SheetJS) |
| **Backend API** | Laravel 11/12 REST API |
| **Autentikasi** | Laravel Sanctum (Bearer Token) |
| **Database** | SQLite (Default, Zero-config), MySQL 8.x / PostgreSQL Ready |
| **PWA** | Web App Manifest, Service Worker |

---

## 📦 Struktur Proyek

```
Manage Money/
├── backend/                  # Laravel 11 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Controller Auth, Transaksi, Akun, Anggaran, dll.
│   │   ├── Models/                 # Eloquent Models (User, Account, Transaction, dll.)
│   │   └── Services/               # FinancialService (Atomic Balance & Voice Parser)
│   ├── database/
│   │   ├── migrations/             # 11 Skema migrasi tabel relasional
│   │   └── seeders/                # DatabaseSeeder dengan data realistis Indonesia
│   ├── routes/
│   │   └── api.php                 # Endpoint API Sanctum
│   ├── tests/Feature/              # Automated PHPUnit / Pest Feature Tests
│   └── .env.example
├── frontend/                 # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── public/
│   │   ├── manifest.json           # PWA Web App Manifest
│   │   ├── sw.js                   # PWA Service Worker
│   │   └── logo.svg                # Logo vektor FinTrack
│   ├── src/
│   │   ├── components/             # Sidebar, Header, MobileNav, VoiceModal, TxModal
│   │   ├── context/                # AuthContext, ThemeContext
│   │   ├── pages/                  # Dashboard, Transaksi, Akun, Anggaran, Laporan, dll.
│   │   ├── services/api.ts         # Type-safe API Client
│   │   ├── types/index.ts          # TypeScript Domain Interfaces
│   │   └── utils/formatters.ts     # Format mata uang Rupiah & tanggal Indonesia
│   └── vite.config.ts
├── .env.example              # Template konfigurasi environment root
└── README.md                 # Dokumentasi proyek lengkap
```

---

## 💻 Panduan Instalasi & Menjalankan Lokal

### Prasyarat
- **PHP** &ge; 8.2 (dengan ekstensi `pdo_sqlite`, `pdo_mysql`, `mbstring`, `openssl`)
- **Composer** &ge; 2.x
- **Node.js** &ge; 18.x & **npm**

---

### Langkah 1: Setup Backend Laravel API

1. Buka terminal dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```

2. Salin environment file:
   ```bash
   copy .env.example .env
   ```

3. Jalankan migrasi tabel database dan seeder data demo:
   ```bash
   php artisan migrate --seed
   ```

4. Jalankan backend server:
   ```bash
   php -S 127.0.0.1:8000 -t public
   ```
   *Backend API aktif di `http://127.0.0.1:8000`.*

---

### Langkah 2: Setup Frontend React

1. Buka terminal baru dan masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```

2. Jalankan server frontend:
   ```bash
   npm run dev
   ```
   *Frontend FinTrack aktif di `http://127.0.0.1:5173`.*

---

## 🔑 Kredensial Akun Demo

Untuk mencoba seluruh fitur dengan data lengkap (rekening bank BCA, Mandiri, dompet tunai, GoPay, riwayat 30+ transaksi, anggaran bulanan, tagihan, dan target tabungan):

- **Email**: `demo@fintrack.id`
- **Password**: `password123`
*(Tersedia tombol 1-klik **"Isi Kredensial Demo"** pada halaman login).*

Anda juga dapat membuat akun baru melalui tombol **"Daftar Sekarang"**. Setiap akun baru otomatis dibuatkan rekening starter dan kategori default secara mandiri.

---

## 🧪 Menjalankan Pengujian Otomatis

Backend dilengkapi dengan Feature Tests untuk memastikan integritas saldo, transfer, isolasi data pengguna, dan parser suara:

```bash
cd backend
php artisan test
```

**Cakupan Pengujian:**
- `test_user_can_create_income_and_balance_increases`: Memastikan penambahan pemasukan menambah saldo akun secara akurat.
- `test_user_can_create_expense_and_balance_decreases`: Memastikan pengeluaran memotong saldo akun dengan benar.
- `test_transfer_updates_both_account_balances_correctly`: Memastikan transfer memotong akun asal dan menambah akun tujuan secara konsisten.
- `test_user_cannot_access_or_modify_other_users_data`: Memastikan pengguna tidak dapat membaca/mengubah data milik pengguna lain (Data Isolation).
- `test_voice_interpretation_parses_indonesian_command`: Menguji akurasi parser teks perintah suara Indonesia ke struktur data transaksi.

---

## 🗄️ Konfigurasi Database

### 1. SQLite (Default - Siap Pakai)
Secara default, FinTrack menggunakan SQLite yang tersimpan di `backend/database/database.sqlite`. Tidak memerlukan instalasi database server tambahan.

### 2. MySQL (Laragon / XAMPP / Server Produksi)
Jika ingin menggunakan MySQL, buka file `backend/.env` dan sesuaikan:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fintrack
DB_USERNAME=root
DB_PASSWORD=
```
Buat database `fintrack` di MySQL Anda, kemudian jalankan:
```bash
php artisan migrate:fresh --seed
```

---

## 🚀 Panduan Deployment ke Produksi (SaaS Ready)

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```
   Folder hasil build `frontend/dist` dapat disajikan langsung oleh web server (Nginx/Cloudflare Pages) atau diarahkan ke public storage Laravel.

2. **Optimasi Backend**:
   ```bash
   cd backend
   composer install --optimize-autoloader --no-dev
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

3. **Environment Variabel Produksi**:
   - Ubah `APP_ENV=production` dan `APP_DEBUG=false`.
   - Set `APP_KEY` melalui `php artisan key:generate`.
   - Tentukan `FRONTEND_URL` dengan domain produksi Anda (misal `https://app.fintrack.id`).

---

## 📄 Lisensi
Hak Cipta © 2026 FinTrack. Dikembangkan untuk manajemen keuangan pribadi yang cerdas, aman, dan berdaya guna tinggi.
