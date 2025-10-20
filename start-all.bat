@echo off
REM HiAnime Video Streaming - Tüm Servisleri Başlat

echo ========================================
echo   HiAnime Video Streaming Baslatiliyor
echo ========================================
echo.

REM 1. Aniwatch API'yi başlat
echo [1/3] Aniwatch API baslatiliyor (Port 4000)...
start "Aniwatch API" cmd /k "cd aniwatch-api && npm start"
timeout /t 3 /nobreak >nul

REM 2. Proxy Server'ı başlat
echo [2/3] Proxy Server baslatiliyor (Port 5000)...
start "Proxy Server" cmd /k "cd server && node hianime_proxy.js"
timeout /t 2 /nobreak >nul

REM 3. Web Server'ı başlat
echo [3/3] Web Server baslatiliyor (Port 5001)...
start "Web Server" cmd /k "cd html\public_html && python -m http.server 5001"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   Tum Servisler Baslatildi!
echo ========================================
echo.
echo Video izlemek icin tarayicinizda acin:
echo   http://localhost:5001/watch-new.html?anime=one-piece-100^&ep=2146
echo.
echo Servisler:
echo   - Aniwatch API: http://localhost:4000
echo   - Proxy Server: http://localhost:5000
echo   - Web Server:   http://localhost:5001
echo.
echo Tarayici aciliyor...
timeout /t 3 /nobreak >nul
start http://localhost:5001/watch-new.html?anime=one-piece-100^&ep=2146

echo.
echo Hazir! Iyi seyirler!
echo.
pause
