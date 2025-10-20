# Anime Streaming Platform - Kurulum Scripti
# PowerShell için

Write-Host "🎬 Anime Streaming Platform Kurulumu" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Python bağımlılıkları
Write-Host "📦 Python bağımlılıkları yükleniyor..." -ForegroundColor Yellow
pip install -r requirements.txt

# 2. Consumet API kurulumu
Write-Host ""
Write-Host "🔧 Consumet API kurulumu..." -ForegroundColor Yellow

$consumetPath = "C:\Users\kudre\Desktop\naber-anime-izle\consumet-api"

if (Test-Path $consumetPath) {
    Write-Host "✅ Consumet API zaten kurulu" -ForegroundColor Green
} else {
    Write-Host "📥 Consumet API indiriliyor..." -ForegroundColor Yellow
    cd C:\Users\kudre\Desktop\naber-anime-izle
    git clone https://github.com/consumet/api.consumet.org.git consumet-api
    cd consumet-api
    
    Write-Host "📦 Node.js bağımlılıkları yükleniyor..." -ForegroundColor Yellow
    npm install
    
    Write-Host "✅ Consumet API kuruldu" -ForegroundColor Green
}

# 3. .env kontrolü
Write-Host ""
Write-Host "🔑 Environment değişkenleri kontrol ediliyor..." -ForegroundColor Yellow

$envPath = "C:\Users\kudre\Desktop\naber-anime-izle\bunny_scripts\.env"

if (Test-Path $envPath) {
    Write-Host "✅ .env dosyası mevcut" -ForegroundColor Green
    Write-Host "⚠️  OPENAI_API_KEY ve GEMINI_API_KEY değerlerini kontrol edin!" -ForegroundColor Yellow
} else {
    Write-Host "❌ .env dosyası bulunamadı!" -ForegroundColor Red
}

# 4. Özet
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Kurulum tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Sıradaki adımlar:" -ForegroundColor Cyan
Write-Host "1. Consumet API'yi başlat:" -ForegroundColor White
Write-Host "   cd C:\Users\kudre\Desktop\naber-anime-izle\consumet-api" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Anime veritabanını oluştur:" -ForegroundColor White
Write-Host "   cd C:\Users\kudre\Desktop\naber-anime-izle\bunny_scripts" -ForegroundColor Gray
Write-Host "   python consumet_scraper.py" -ForegroundColor Gray
Write-Host ""
Write-Host "3. API sunucusunu başlat:" -ForegroundColor White
Write-Host "   python api_server.py" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Tarayıcıda test et:" -ForegroundColor White
Write-Host "   http://localhost:8000" -ForegroundColor Gray
Write-Host ""
