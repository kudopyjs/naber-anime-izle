# HiAnime Video Streaming - Tüm Servisleri Başlat
# Bu script tüm gerekli servisleri otomatik olarak başlatır

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HiAnime Video Streaming Başlatılıyor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Çalışma dizinini al
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Aniwatch API'yi başlat
Write-Host "[1/3] Aniwatch API başlatılıyor (Port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\aniwatch-api'; Write-Host 'Aniwatch API Başlatılıyor...' -ForegroundColor Green; npm start"
Start-Sleep -Seconds 3

# 2. Proxy Server'ı başlat
Write-Host "[2/3] Proxy Server başlatılıyor (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\server'; Write-Host 'Proxy Server Başlatılıyor...' -ForegroundColor Green; node hianime_proxy.js"
Start-Sleep -Seconds 2

# 3. Web Server'ı başlat
Write-Host "[3/3] Web Server başlatılıyor (Port 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\html\public_html'; Write-Host 'Web Server Başlatılıyor...' -ForegroundColor Green; python -m http.server 5001"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Tüm Servisler Başlatıldı!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📺 Video izlemek için tarayıcınızda açın:" -ForegroundColor Cyan
Write-Host "   http://localhost:5001/watch-new.html?anime=one-piece-100&ep=2146" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Servisler:" -ForegroundColor Cyan
Write-Host "   - Aniwatch API: http://localhost:4000" -ForegroundColor White
Write-Host "   - Proxy Server: http://localhost:5000" -ForegroundColor White
Write-Host "   - Web Server:   http://localhost:5001" -ForegroundColor White
Write-Host ""
Write-Host "💡 İpucu: Servisleri durdurmak için açılan terminal pencerelerini kapatın" -ForegroundColor Yellow
Write-Host ""

# Tarayıcıyı otomatik aç
Start-Sleep -Seconds 3
Write-Host "🌐 Tarayıcı açılıyor..." -ForegroundColor Cyan
Start-Process "http://localhost:5001/watch-new.html?anime=one-piece-100&ep=2146"

Write-Host ""
Write-Host "✨ Hazır! İyi seyirler!" -ForegroundColor Green
Write-Host ""
Write-Host "Bu pencereyi kapatabilirsiniz. Servisler arka planda çalışmaya devam edecek." -ForegroundColor Gray
