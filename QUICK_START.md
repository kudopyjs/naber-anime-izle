# 🚀 Hızlı Başlangıç Rehberi

## Tüm Servisleri Çalıştırma

Uygulamanın tam çalışması için 3 servis gerekli:

### 1️⃣ Aniwatch API (Port 4000)
```bash
cd aniwatch-api
npm install
npm start
```

### 2️⃣ Video Proxy (Port 5003)
```bash
cd server
npm install
npm start
```

### 3️⃣ Frontend (Port 5173)
```bash
cd anime-streaming-ui
npm install
npm run dev
```

## ✅ Kontrol Listesi

Tüm servisler çalışıyor mu kontrol edin:

```bash
# Aniwatch API
curl http://localhost:4000/api/v2/hianime/home

# Video Proxy
curl http://localhost:5003/health

# Frontend
# Tarayıcıda: http://localhost:5173
```

## 🎬 Video İzleme

1. Ana sayfada bir anime seçin
2. Anime detay sayfasında bir bölüm seçin
3. Video otomatik olarak oynatılmalı

**Not:** Video proxy sayesinde artık direkt siteden izleyebilirsiniz!

## 🐛 Sorun Giderme

### Video Oynatmıyor
1. **Video Proxy çalışıyor mu?**
   ```bash
   curl http://localhost:5003/health
   ```

2. **Console'da hata var mı?**
   - F12 tuşuna basın
   - Console sekmesini kontrol edin
   - Network sekmesinde proxy isteklerini kontrol edin

3. **Proxy URL doğru mu?**
   - Console'da `🔄 Proxy URL:` logunu kontrol edin
   - `http://localhost:5003/proxy/playlist?url=...` şeklinde olmalı

### Port Çakışması
```bash
# Windows - Port 5003'ü kullanan process'i bul ve kapat
netstat -ano | findstr :5003
taskkill /PID <PID> /F

# Veya farklı port kullan
PORT=5004 npm start
```

### CORS Hatası
- Video proxy'nin çalıştığından emin olun
- Aniwatch API'nin çalıştığından emin olun
- Tarayıcı cache'ini temizleyin (Ctrl+Shift+Delete)

## 📝 Environment Variables

### Frontend (.env)
```env
VITE_ANIWATCH_API_URL=http://localhost:4000
VITE_VIDEO_PROXY_URL=http://localhost:5003
```

### Video Proxy (.env)
```env
PORT=5003
```

### Aniwatch API (.env)
```env
ANIWATCH_API_PORT=4000
```

## 🎯 Özellikler

### ✅ Çalışan
- Ana sayfa (animeler listeleniyor)
- Arama (gerçek zamanlı öneriler)
- Anime detay sayfası
- Bölüm listesi
- **Video oynatma (proxy ile)** ⭐ YENİ!
- Sunucu seçimi
- Altyazı/Dublaj seçimi

### 🔄 Geliştirme Aşamasında
- Video kalite seçimi
- İzleme geçmişi
- Favoriler
- Yorum sistemi

## 📚 Daha Fazla Bilgi

- [Aniwatch API Entegrasyonu](./ANIWATCH_INTEGRATION.md)
- [Video Proxy Dökümantasyonu](./server/README.md)
- [CORS Sorun Giderme](./CORS_FIX.md)
- [Entegrasyon Özeti](./INTEGRATION_SUMMARY.md)

## 🎉 Başarılı Kurulum

Eğer:
- ✅ Ana sayfada animeler görünüyorsa
- ✅ Arama çalışıyorsa
- ✅ Anime detay sayfası açılıyorsa
- ✅ Video oynatılıyorsa

**Tebrikler! Kurulum başarılı!** 🎊
