@echo off
title FinTrack App Launcher
echo ========================================================
echo        Memulai FinTrack - Personal Finance App
echo ========================================================
echo.
echo [1/2] Menjalankan Backend Laravel di port 8000...
start "FinTrack Backend (Laravel)" /min cmd /c "cd /d %~dp0backend && php artisan serve --host=127.0.0.1 --port=8000"

echo [2/2] Menjalankan Frontend Vite di port 5173...
start "FinTrack Frontend (Vite)" /min cmd /c "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Menunggu server siap...
timeout /t 3 /nobreak >nul

echo Membuka FinTrack di browser default...
start http://127.0.0.1:5173/

echo.
echo ========================================================
echo FinTrack aktif!
echo Frontend URL: http://127.0.0.1:5173
echo Backend API:  http://127.0.0.1:8000
echo.
echo Akun Demo FinTrack:
echo   Email    : demo@fintrack.id
echo   Password : password123
echo ========================================================
echo Tekan sembarang tombol untuk menutup launcher ini (server tetap berjalan).
pause >nul
