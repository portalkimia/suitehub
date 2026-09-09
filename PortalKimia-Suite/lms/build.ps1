# DUAL-BUILD SCRIPT: Build Tito's LMS (Emerald) and Partner's LMS (Dhevira Aptia Firmanda, S.Pd. - Pink Feminine)
param (
    [string]$PartnerName = "Dhevira Aptia Firmanda, S.Pd.",
    [string]$PartnerClass = "X14",
    [string]$PartnerSchool = "SMA Progresif Bumi Shalawat",
    [string]$PartnerMapel = "Kimia (Chemistry)"
)

$titoDir = "C:\Users\Tito\Desktop\LMS-Guru-Kimia"
$pinkDir = "C:\Users\Tito\Desktop\LMS-Guru-Kimia-Pink"
$scratchDir = "C:\Users\Tito\.gemini\antigravity\scratch\guru-kimia-lms"

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

if (!(Test-Path $pinkDir)) {
    New-Item -ItemType Directory -Force -Path $pinkDir | Out-Null
}

# ------------------------------------------------------------------------------
# 1. BUILD TITO'S LMS (OBSIDIAN HIGH-CONTRAST DARK - LMS PORTALKIMIA)
# ------------------------------------------------------------------------------
Write-Host "Building Tito's LMS (Obsidian Dark Theme - LMS PortalKimia)..." -ForegroundColor Cyan

$stylesContent = [System.IO.File]::ReadAllText("$titoDir\styles.css", [System.Text.Encoding]::UTF8)
$dataSampleContent = [System.IO.File]::ReadAllText("$titoDir\data-sample.js", [System.Text.Encoding]::UTF8)
$appJsContent = [System.IO.File]::ReadAllText("$titoDir\app.js", [System.Text.Encoding]::UTF8)
$templateContent = [System.IO.File]::ReadAllText("$titoDir\template.html", [System.Text.Encoding]::UTF8)
$codeGsContent = [System.IO.File]::ReadAllText("$titoDir\Code.gs", [System.Text.Encoding]::UTF8)

# 1A. Generate PWA manifest.json for Tito (LMS PortalKimia)
$manifestTito = @"
{
  "name": "LMS PortalKimia - Tito Vanzal, S.Pd.",
  "short_name": "LMS PortalKimia",
  "description": "Sistem Pembelajaran & Manajemen Kelas Kimia - SMA Progresif Bumi Shalawat",
  "start_url": "./index.html",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#09090b",
  "theme_color": "#a78bfa",
  "categories": ["education", "productivity"],
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "portalkimia-logo.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
"@
[System.IO.File]::WriteAllText("$titoDir\manifest.json", $manifestTito, $utf8NoBom)

# 1B. Generate Service Worker (sw.js)
$swContent = @"
// Service Worker for LMS PortalKimia PWA
const CACHE_NAME = 'lms-portalkimia-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './portalkimia-logo.svg',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('Cache non-blocking note: ', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
"@
[System.IO.File]::WriteAllText("$titoDir\sw.js", $swContent, $utf8NoBom)

$finalHtmlTito = $templateContent.Replace("/*STYLES_PLACEHOLDER*/", $stylesContent).Replace("/*DATA_SAMPLE_PLACEHOLDER*/", $dataSampleContent).Replace("/*APP_JS_PLACEHOLDER*/", $appJsContent)

[System.IO.File]::WriteAllText("$titoDir\index.html", $finalHtmlTito, $utf8NoBom)
if (Test-Path $scratchDir) {
    Copy-Item -Path "$titoDir\index.html" -Destination "$scratchDir\index.html" -Force
}
Write-Host " [OK] Tito's LMS index.html compiled ($((Get-Item "$titoDir\index.html").Length) bytes)" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 2. TRANSFORM & BUILD PARTNER'S LMS (Dhevira Aptia Firmanda, S.Pd. - X14 - Rose / Fuchsia / Pink)
# ------------------------------------------------------------------------------
Write-Host "Building Partner's LMS: $PartnerName (Feminine Theme - $PartnerClass)..." -ForegroundColor Magenta

# 2A. Transform styles.css for Feminine Theme
$stylesPink = $stylesContent `
    -replace '#059669', '#f43f5e' `
    -replace '#047857', '#e11d48' `
    -replace '#4f46e5', '#d946ef' `
    -replace '#a78bfa', '#f43f5e' `
    -replace '#7c3aed', '#e11d48' `
    -replace '#8b5cf6', '#fb7185' `
    -replace '#c4b5fd', '#fbcfe8' `
    -replace 'Emerald Green', 'Rose / Pink Feminine' `
    -replace 'rgba\(16, 185, 129,', 'rgba(244, 63, 94,' `
    -replace 'rgba\(16, 185, 129\)', 'rgba(244, 63, 94)' `
    -replace 'rgba\(167, 139, 250,', 'rgba(244, 63, 94,' `
    -replace 'rgba\(124, 58, 237,', 'rgba(225, 29, 72,'

[System.IO.File]::WriteAllText("$pinkDir\styles.css", $stylesPink, $utf8NoBom)

# 2B. Transform app.js for Partner
$appJsPink = $appJsContent `
    -replace 'LMS_KIMIA_REAL_DATA_V6', 'LMS_KIMIA_REAL_DATA_V6_PINK' `
    -replace 'LMS_THEME', 'LMS_THEME_PINK' `
    -replace 'Tito Vanzal, S\.Pd\.', $PartnerName `
    -replace 'X3 Atlet', $PartnerClass

if ($PartnerSchool -and $PartnerSchool.Trim() -ne "") {
    $appJsPink = $appJsPink -replace 'sekolah:\s*"SMA Progresif Bumi Shalawat"', "sekolah: `"$PartnerSchool`""
    $appJsPink = $appJsPink -replace 'this\.guru\.sekolah\s*=\s*"SMA Progresif Bumi Shalawat";', "this.guru.sekolah = `"$PartnerSchool`";"
}
if ($PartnerMapel -and $PartnerMapel.Trim() -ne "") {
    $appJsPink = $appJsPink -replace 'mapel:\s*"Kimia \(Chemistry\)"', "mapel: `"$PartnerMapel`""
}

[System.IO.File]::WriteAllText("$pinkDir\app.js", $appJsPink, $utf8NoBom)
[System.IO.File]::WriteAllText("$pinkDir\data-sample.js", $dataSampleContent, $utf8NoBom)

# 2C. Generate PWA manifest.json & sw.js for Partner
$manifestPink = @"
{
  "name": "LMS Guru Kimia & Wali Kelas - $PartnerName",
  "short_name": "LMS Kimia",
  "description": "Sistem Informasi Pembelajaran Kimia & Wali Kelas $PartnerClass - $PartnerSchool",
  "start_url": "./index.html",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0f172a",
  "theme_color": "#f43f5e",
  "categories": ["education", "productivity"],
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='25' fill='%23f43f5e'/><text x='50%' y='68%' font-size='55' text-anchor='middle' fill='white'>🌸</text></svg>",
      "sizes": "192x192 512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
"@
[System.IO.File]::WriteAllText("$pinkDir\manifest.json", $manifestPink, $utf8NoBom)
[System.IO.File]::WriteAllText("$pinkDir\sw.js", $swContent, $utf8NoBom)

# 2D. Transform template.html for Feminine Palette:
$templatePink = $templateContent `
    -replace 'X3 Atlet', $PartnerClass `
    -replace 'Tito Vanzal, S\.Pd\.', $PartnerName `
    -replace 'content="#a78bfa"', 'content="#f43f5e"' `
    -replace 'content="#059669"', 'content="#f43f5e"' `
    -replace '#a78bfa', '#f43f5e' `
    -replace '#7c3aed', '#e11d48' `
    -replace '#8b5cf6', '#fb7185' `
    -replace '#c4b5fd', '#fbcfe8' `
    -replace 'text-violet-', 'text-rose-' `
    -replace 'bg-violet-', 'bg-rose-' `
    -replace 'border-violet-', 'border-rose-' `
    -replace 'from-emerald-600 via-teal-600 to-emerald-700', 'from-rose-500 via-fuchsia-500 to-rose-600' `
    -replace 'from-emerald-600 to-teal-600', 'from-rose-500 via-fuchsia-500 to-rose-600' `
    -replace 'from-emerald-500 to-teal-500', 'from-rose-500 to-fuchsia-500' `
    -replace 'from-teal-600 to-emerald-600', 'from-fuchsia-600 to-rose-600' `
    -replace 'from-emerald-600 to-emerald-800', 'from-rose-600 to-fuchsia-800' `
    -replace 'from-emerald-700 to-teal-700', 'from-rose-700 to-fuchsia-700' `
    -replace 'from-teal-500 to-cyan-500', 'from-fuchsia-500 to-pink-500' `
    -replace 'from-teal-600 to-cyan-600', 'from-fuchsia-600 to-pink-600' `
    -replace 'from-cyan-500 to-teal-500', 'from-pink-500 to-fuchsia-500' `
    -replace 'from-cyan-600 to-teal-600', 'from-pink-600 to-fuchsia-600' `
    -replace 'emerald-', 'rose-' `
    -replace 'teal-', 'fuchsia-' `
    -replace 'cyan-', 'pink-'

[System.IO.File]::WriteAllText("$pinkDir\template.html", $templatePink, $utf8NoBom)

# 2E. Compile Partner's index.html
$finalHtmlPink = $templatePink.Replace("/*STYLES_PLACEHOLDER*/", $stylesPink).Replace("/*DATA_SAMPLE_PLACEHOLDER*/", $dataSampleContent).Replace("/*APP_JS_PLACEHOLDER*/", $appJsPink)
[System.IO.File]::WriteAllText("$pinkDir\index.html", $finalHtmlPink, $utf8NoBom)
Write-Host " [OK] Partner's LMS index.html compiled ($((Get-Item "$pinkDir\index.html").Length) bytes)" -ForegroundColor Green

# 2F. Transform Code.gs for Partner (Rose/Fuchsia Header Accent)
$codeGsPink = $codeGsContent `
    -replace '#10b981', '#f43f5e' `
    -replace '#059669', '#d946ef' `
    -replace 'Tito Vanzal, S\.Pd\.', $PartnerName `
    -replace 'X3 Atlet', $PartnerClass

[System.IO.File]::WriteAllText("$pinkDir\Code.gs", $codeGsPink, $utf8NoBom)
Write-Host " [OK] Partner's Code.gs generated" -ForegroundColor Green

# 2G. Copy Documentation
if (Test-Path "$titoDir\PANDUAN_GOOGLE_DRIVE.md") {
    Copy-Item -Path "$titoDir\PANDUAN_GOOGLE_DRIVE.md" -Destination "$pinkDir\PANDUAN_GOOGLE_DRIVE.md" -Force
}

Write-Host "`n🎉 DUAL LMS BUILD COMPLETE!" -ForegroundColor Yellow
Write-Host "1. Tito's LMS (Emerald / X3 Atlet): $titoDir\index.html" -ForegroundColor Cyan
Write-Host "2. Dhevira's LMS (Rose-Fuchsia-Pink / X14): $pinkDir\index.html" -ForegroundColor Magenta

