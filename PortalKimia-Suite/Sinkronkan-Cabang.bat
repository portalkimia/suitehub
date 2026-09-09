@echo off
chcp 65001 >nul
title Sinkronisasi PortalKimia Suite - Tito Vanzal, S.Pd.
cls
echo ====================================================================
echo        SINKRONISASI OTOMATIS CABANG KE PORTALKIMIA SUITE
echo        (File Code.gs otomatis diabaikan demi keamanan GitHub)
echo ====================================================================
echo.
echo [1/3] Menyinkronkan LMS-Guru-Kimia...
robocopy "C:\Users\Tito\Desktop\LMS-Guru-Kimia" "C:\Users\Tito\Desktop\PortalKimia-Suite\lms" /E /XD "scratch" /XF "*.gs" "*.log" "dom-output.html" >nul
echo       - LMS berhasil diperbarui!

echo.
echo [2/3] Menyinkronkan Portal-Bahan-Ajar-Kimia (Media)...
robocopy "C:\Users\Tito\Desktop\Portal-Bahan-Ajar-Kimia" "C:\Users\Tito\Desktop\PortalKimia-Suite\media" /E /XD "Media_Pembelajaran_Kimia_Drive" "Stitch" /XF "*.gs" >nul
echo       - Media Pembelajaran berhasil diperbarui!

echo.
echo [3/3] Menyinkronkan Generator Modul Ajar AI...
robocopy "C:\Users\Tito\Desktop\Generator Modul Ajar" "C:\Users\Tito\Desktop\PortalKimia-Suite\generator" /E /XF "*.gs" >nul
echo       - Generator Modul Ajar berhasil diperbarui!

echo.
echo ====================================================================
echo   [SELESAI] Seluruh file frontend siap diunggah ke GitHub (Aman)!
echo ====================================================================
echo.
pause
