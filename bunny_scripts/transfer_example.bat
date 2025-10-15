@echo off
REM TurkAnime'den Bunny.net'e Transfer - Örnek Batch Script
REM Windows için hızlı başlangıç

echo ========================================
echo TurkAnime to Bunny.net Transfer
echo ========================================
echo.

REM Bunny.net API bilgilerini ayarla
REM Bu değerleri kendi bilgilerinizle değiştirin!
set BUNNY_STREAM_API_KEY=your-api-key-here
set BUNNY_LIBRARY_ID=your-library-id-here

REM API bilgileri kontrol
if "%BUNNY_STREAM_API_KEY%"=="your-api-key-here" (
    echo HATA: Bunny.net API bilgilerini ayarlayin!
    echo Bu dosyayi duzenleyin ve API bilgilerinizi girin.
    pause
    exit /b 1
)

echo API bilgileri ayarlandi.
echo.

REM Kullanıcıdan seçim al
echo Ne yapmak istersiniz?
echo.
echo 1. Anime listesini gor
echo 2. Belirli bir anime'nin bolumlerini aktar
echo 3. Ornek: Naruto 1-10 bolumler
echo 4. Ornek: One Piece 1-50 bolumler
echo 5. Cikis
echo.

set /p choice="Seciminiz (1-5): "

if "%choice%"=="1" goto list_anime
if "%choice%"=="2" goto custom_transfer
if "%choice%"=="3" goto naruto_example
if "%choice%"=="4" goto onepiece_example
if "%choice%"=="5" goto end

echo Gecersiz secim!
pause
exit /b 1

:list_anime
echo.
echo Anime listesi getiriliyor...
python turkanime_to_bunny.py --list
pause
exit /b 0

:custom_transfer
echo.
set /p anime_slug="Anime slug (ornek: naruto): "
set /p start_ep="Baslangic bolumu: "
set /p end_ep="Bitis bolumu: "

echo.
echo Transfer baslatiliyor: %anime_slug% (%start_ep%-%end_ep%)
python turkanime_to_bunny.py --anime %anime_slug% --start %start_ep% --end %end_ep%
pause
exit /b 0

:naruto_example
echo.
echo Naruto 1-10 bolumleri aktariliyor...
python turkanime_to_bunny.py --anime naruto --start 1 --end 10
pause
exit /b 0

:onepiece_example
echo.
echo One Piece 1-50 bolumleri aktariliyor...
python turkanime_to_bunny.py --anime one-piece --start 1 --end 50
pause
exit /b 0

:end
echo.
echo Cikis yapiliyor...
exit /b 0
