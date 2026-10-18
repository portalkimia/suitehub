@echo off
chcp 65001 >nul
title Push Pembaruan PortalKimia-Suite ke GitHub
cls
echo ====================================================================
echo        PUSH PEMBARUAN PORTALKIMIA-SUITE KE GITHUB
echo ====================================================================
echo.
echo Sedang mengirim commit ke https://github.com/portalkimia/suitehub...
echo.
echo * Catatan: Jika muncul jendela kecil dari GitHub, silakan klik
echo   "Sign in with your browser" untuk otorisasi login.
echo.
"C:\Program Files\Git\cmd\git.exe" push origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================================
    echo   [BERHASIL] Repositori GitHub Anda telah sukses diperbarui!
    echo ====================================================================
) else (
    echo.
    echo ====================================================================
    echo   [INFO] Jika diminta token, Anda bisa menggunakan Personal Access Token.
    echo ====================================================================
)
echo.
pause
