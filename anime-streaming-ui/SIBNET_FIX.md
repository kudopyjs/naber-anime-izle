# 🔧 Sibnet URL Sorunu - Çözüm

## ❌ Hata

```
Bunny.net Error: Invalid file. Cannot load file temp/.../original
```

**Sebep:** Sibnet URL'leri direkt video dosyası değil, player sayfası. Bunny.net'in `fetch` API'si direkt video URL'sine ihtiyaç duyuyor.

---

## ✅ Çözüm: Backend API ile URL Çözümleme

### **Nasıl Çalışır?**

```
1. Frontend: Sibnet URL'sini backend'e gönderir
   ↓
2. Backend: yt-dlp ile gerçek video URL'sini çözümler
   ↓
3. Frontend: Çözümlenmiş URL'yi Bunny.net'e gönderir
   ↓
4. Bunny.net: Direkt video URL'sinden fetch yapar
   ↓
5. ✅ Başarılı!
```

---

## 🚀 Kurulum

### **1. Backend API'yi Başlat**

```bash
cd bunny_scripts
python upload_api.py
```

**Beklenen Çıktı:**
```
============================================================
🎬 Anime Upload API - Bunny.net
============================================================
📁 Upload klasörü: C:\...\bunny_scripts\temp_uploads
📦 Max dosya boyutu: 5.0 GB
🔑 Bunny.net: ✅ Yapılandırıldı
============================================================

🚀 Server başlatılıyor...
📍 URL: http://localhost:5000
```

---

### **2. .env Dosyasına Backend URL Ekle**

```bash
# anime-streaming-ui/.env
VITE_BACKEND_API_URL=http://localhost:5000
```

---

### **3. Frontend'i Yeniden Başlat**

```bash
cd anime-streaming-ui
# Ctrl+C ile durdur
npm run dev
```

---

## 🧪 Test

### **1. Upload Sayfasına Git**
```
http://localhost:5173/upload
```

### **2. Sibnet URL'sini Gir**
```
https://video.sibnet.ru/video4916331-_AnimeWh0__Ble4ch___Th0us4nd_Ye4r_Bl00d_W4r___01
```

### **3. Console'u Kontrol Et (F12)**

**Backend Çalışıyorsa:**
```
🔍 Video URL çözümleniyor (backend API)...
✅ URL çözümlendi (sibnet): http://video.sibnet.ru/shell.php?videoid=...
🔗 URL'den aktarılıyor...
✅ Video aktarıldı: abc-123-def
```

**Backend Çalışmıyorsa:**
```
🔍 Video URL çözümleniyor (backend API)...
❌ URL çözümleme hatası: Failed to fetch
🔄 Basit URL çözümleme yapılıyor...
⚠️ Sibnet URL'leri için backend API gerekli!
⚠️ Backend çalıştırın: python upload_api.py
```

---

## 📊 Desteklenen Platformlar

| Platform | Backend Gerekli? | Açıklama |
|----------|------------------|----------|
| **Mail.ru** | ❌ Hayır | Basit URL çevirme yeterli |
| **Sibnet** | ✅ Evet | yt-dlp ile çözümleme gerekli |
| **Google Drive** | ✅ Evet | yt-dlp ile çözümleme gerekli |
| **Yandex Disk** | ✅ Evet | yt-dlp ile çözümleme gerekli |
| **Pixeldrain** | ✅ Evet | yt-dlp ile çözümleme gerekli |
| **HDVID** | ✅ Evet | yt-dlp ile çözümleme gerekli |
| **Direkt MP4** | ❌ Hayır | Direkt kullanılır |

---

## 🔍 Backend API Endpoint'leri

### **1. URL Çözümleme**

```http
POST http://localhost:5000/api/resolve-url
Content-Type: application/json

{
  "video_url": "https://video.sibnet.ru/video4916331-..."
}
```

**Response:**
```json
{
  "success": true,
  "original_url": "https://video.sibnet.ru/video4916331-...",
  "resolved_url": "http://video.sibnet.ru/shell.php?videoid=...",
  "title": "Bleach - Episode 1",
  "duration": 1440,
  "platform": "sibnet"
}
```

---

### **2. Video Yükleme (URL)**

```http
POST http://localhost:5000/api/upload/url
Content-Type: application/json

{
  "anime_name": "Bleach",
  "episode_number": 1,
  "episode_title": "The Blood Warfare",
  "video_url": "https://video.sibnet.ru/video4916331-...",
  "fansub": "AnimeWh0"
}
```

**Response:**
```json
{
  "success": true,
  "video_id": "abc-123-def-456",
  "collection_id": "xyz-789-ghi-012",
  "message": "Video başarıyla yüklendi!"
}
```

---

## 🔧 Sorun Giderme

### **1. "Backend API kullanılamıyor"**

**Sorun:** Backend çalışmıyor

**Çözüm:**
```bash
cd bunny_scripts
python upload_api.py
```

**Kontrol:**
```bash
# Browser'da aç
http://localhost:5000/api/health
```

**Beklenen:**
```json
{
  "status": "ok",
  "bunny_configured": true
}
```

---

### **2. "ModuleNotFoundError: No module named 'yt_dlp'"**

**Sorun:** yt-dlp kurulu değil

**Çözüm:**
```bash
pip install yt-dlp
```

---

### **3. "CORS Error"**

**Sorun:** Frontend backend'e erişemiyor

**Çözüm:** Backend'de CORS zaten aktif (`flask-cors`), ama kontrol edin:

```python
# upload_api.py
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # ✅ Bu satır olmalı
```

---

### **4. "Invalid file" Hatası Devam Ediyor**

**Kontrol Listesi:**
- [ ] Backend çalışıyor mu? (`http://localhost:5000/api/health`)
- [ ] `.env` dosyasında `VITE_BACKEND_API_URL` var mı?
- [ ] Frontend yeniden başlatıldı mı?
- [ ] Console'da "✅ URL çözümlendi" mesajı var mı?
- [ ] Çözümlenmiş URL direkt video URL'si mi?

---

## 📝 Örnek Kullanım

### **Komut Satırı:**

```bash
# Terminal 1: Backend
cd bunny_scripts
python upload_api.py

# Terminal 2: Frontend
cd anime-streaming-ui
npm run dev
```

### **Browser:**

```
1. http://localhost:5173/upload
2. Anime Seç: Bleach
3. Video URL: https://video.sibnet.ru/video4916331-...
4. Bölüm: 1
5. İsim: The Blood Warfare
6. Yükle
```

### **Console:**

```
🔍 Video URL çözümleniyor (backend API)...
✅ URL çözümlendi (sibnet): http://video.sibnet.ru/shell.php?...
🔗 URL'den aktarılıyor...
✅ Video aktarıldı: abc-123-def-456
📁 Collection: xyz-789-ghi-012
```

---

## ✅ Başarı Kriterleri

- ✅ Backend çalışıyor (`http://localhost:5000`)
- ✅ Frontend backend'e bağlanıyor
- ✅ Sibnet URL'leri çözümleniyor
- ✅ Bunny.net'e direkt video URL'si gönderiliyor
- ✅ "Invalid file" hatası yok
- ✅ Video başarıyla yükleniyor

---

## 🎉 Özet

**Sibnet URL'leri artık çalışıyor:**
1. ✅ Backend API ile yt-dlp entegrasyonu
2. ✅ Otomatik URL çözümleme
3. ✅ Fallback mekanizması
4. ✅ Detaylı hata mesajları
5. ✅ Console logları

**Backend'i çalıştırın ve Sibnet URL'lerini yükleyin!** 🚀
