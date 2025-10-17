# Vast.ai Upload & Connect Script
# Kullanım: .\upload_to_vastai.ps1

$PORT = 20647
$HOST = "163.5.212.69"
$BASE_DIR = "C:\Users\kudre\Desktop\naber-anime-izle"

Write-Host "🚀 Vast.ai Upload & Connect" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# 1. turkanime_to_b2.py yükle
Write-Host "`n📤 turkanime_to_b2.py yükleniyor..." -ForegroundColor Yellow
scp -P $PORT "$BASE_DIR\bunny_scripts\turkanime_to_b2.py" root@${HOST}:/root/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ turkanime_to_b2.py yüklendi!" -ForegroundColor Green
} else {
    Write-Host "❌ Yükleme başarısız!" -ForegroundColor Red
    exit 1
}

# 2. .env dosyası var mı kontrol et
$envFile = "$BASE_DIR\bunny_scripts\.env"
if (Test-Path $envFile) {
    Write-Host "`n📤 .env dosyası yükleniyor..." -ForegroundColor Yellow
    scp -P $PORT $envFile root@${HOST}:/root/
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ .env yüklendi!" -ForegroundColor Green
    }
} else {
    Write-Host "`n⚠️  .env dosyası bulunamadı, atlanıyor..." -ForegroundColor Yellow
}

# 3. SSH bağlan
Write-Host "`n🔗 SSH bağlanıyor..." -ForegroundColor Cyan
Write-Host "Host: $HOST" -ForegroundColor Gray
Write-Host "Port: $PORT" -ForegroundColor Gray
Write-Host "`nBağlantı kuruldu! Çıkmak için 'exit' yazın.`n" -ForegroundColor Green

ssh -p $PORT root@$HOST -L 8080:localhost:8080
