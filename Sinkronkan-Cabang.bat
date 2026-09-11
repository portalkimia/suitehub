@echo off
chcp 65001 >nul
title Sinkronisasi PortalKimia Suite - Tito Vanzal, S.Pd.
cls
echo ====================================================================
echo        SINKRONISASI OTOMATIS CABANG KE PORTALKIMIA SUITE
echo        (File Code.gs otomatis diabaikan demi keamanan GitHub)
echo ====================================================================
echo.
echo [1/4] Menyinkronkan LMS-Guru-Kimia (Frontend)...
robocopy "C:\Users\Tito\Desktop\LMS-Guru-Kimia" "C:\Users\Tito\Desktop\PortalKimia-Suite\lms" /E /XD "scratch" ".system_generated" /XF "*.gs" "*.log" "dom-output.html" >nul
echo       - LMS frontend berhasil diperbarui!

echo.
echo [2/4] Menyinkronkan Backup Lengkap LMS (Termasuk Code.gs)...
if not exist "C:\Users\Tito\Desktop\PortalKimia-Suite\backup\lms" mkdir "C:\Users\Tito\Desktop\PortalKimia-Suite\backup\lms" >nul
robocopy "C:\Users\Tito\Desktop\LMS-Guru-Kimia" "C:\Users\Tito\Desktop\PortalKimia-Suite\backup\lms" /E /XD "scratch" ".system_generated" /XF "*.log" "dom-output.html" >nul
if not exist "C:\Users\Tito\Desktop\Backend-GAS-PortalKimia-Suite" mkdir "C:\Users\Tito\Desktop\Backend-GAS-PortalKimia-Suite" >nul
copy /Y "C:\Users\Tito\Desktop\LMS-Guru-Kimia\Code.gs" "C:\Users\Tito\Desktop\Backend-GAS-PortalKimia-Suite\LMS_Code.gs" >nul
echo       - Backup LMS dan Backend GAS berhasil diamankan!

echo.
echo [3/4] Menyinkronkan Portal-Bahan-Ajar-Kimia (Media)...
robocopy "C:\Users\Tito\Desktop\Portal-Bahan-Ajar-Kimia" "C:\Users\Tito\Desktop\PortalKimia-Suite\media" /E /XD "Media_Pembelajaran_Kimia_Drive" "Stitch" /XF "*.gs" >nul
echo       - Media Pembelajaran berhasil diperbarui!

echo.
echo [4/5] Menyinkronkan Generator Modul Ajar AI...
robocopy "C:\Users\Tito\Desktop\Generator Modul Ajar" "C:\Users\Tito\Desktop\PortalKimia-Suite\generator" /E /XF "*.gs" >nul
echo       - Generator Modul Ajar berhasil diperbarui!

echo.
echo [5/5] Menyinkronkan PortalKimia Olimpiade...
if not exist "C:\Users\Tito\Desktop\PortalKimia-Suite\olimpiade" mkdir "C:\Users\Tito\Desktop\PortalKimia-Suite\olimpiade" >nul
robocopy "C:\Users\Tito\Desktop\PortalKimia-Olimpiade" "C:\Users\Tito\Desktop\PortalKimia-Suite\olimpiade" /E /XD "scratch" ".system_generated" /XF "*.gs" "*.log" >nul
if exist "C:\Users\Tito\Desktop\PortalKimia-Olimpiade\Code.gs" (
    copy /Y "C:\Users\Tito\Desktop\PortalKimia-Olimpiade\Code.gs" "C:\Users\Tito\Desktop\Backend-GAS-PortalKimia-Suite\Olimpiade_Code.gs" >nul
)
echo       - PortalKimia Olimpiade & Backend GAS berhasil diperbarui!

echo.
echo ====================================================================
echo   [SELESAI] File frontend, backup lokal dan backend GAS tersinkron!
echo ====================================================================
echo.
pause
