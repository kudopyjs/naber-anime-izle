# 🚀 Backblaze B2 + Cloudflare - Hızlı Başlangıç

Bu rehber, anime streaming platformunuzu **Bunny.net**'ten **Backblaze B2 + Cloudflare** altyapısına geçirmeniz için adım adım talimatlar içerir.

---

## ⚡ Hızlı Özet

**Neden B2 + Cloudflare?**
- 💰 **%90 daha ucuz** (bandwidth ücretsiz!)
- 🌍 **Cloudflare CDN** (global hız)
- 🔓 **Vendor lock-in yok** (kendi altyapınız)

**Dezavantajları:**
- ⚙️ Video encoding kendiniz yapmalısınız (FFmpeg)
- 🛠️ Daha fazla teknik bilgi gerekir

---

## 📋 Gereksinimler

### 1. Yazılımlar
- ✅ **Node.js** (v18+)
- ✅ **Python** (3.8+)
- ✅ **FFmpeg** (video encoding için)

### 2. Hesaplar
- ✅ **Backblaze B2** hesabı (ücretsiz 10GB)
- ✅ **Cloudflare** hesabı (ücretsiz)
- ✅ **Domain** (Cloudflare'de yönetilen)

---

## 🎯 Adım 1: Backblaze B2 Kurulumu

### 1.1 Hesap Oluştur
```
https://www.backblaze.com/b2/sign-up.html
```

### 1.2 Bucket Oluştur
1. **B2 Cloud Storage** → **Buckets** → **Create a Bucket**
2. Ayarlar:
   - **Name:** `anime-videos`
   - **Files:** `Public` ✅
   - **Encryption:** `Disable`

### 1.3 Application Key Oluştur
1. **App Keys** → **Add a New Application Key**
2. Ayarlar:
   - **Name:** `anime-upload-key`
   - **Bucket:** `anime-videos`
   - **Access:** `Read and Write`

3. **Bilgileri kaydet:**
   ```
   keyID: 00xxxxxxxxxxxxx
   applicationKey: K00xxxxxxxxxxxxxxxxxxxxx
   ```

### 1.4 Endpoint Bilgisi
Bucket sayfasında **Endpoint** bilgisini not edin:
```
s3.us-west-004.backblazeb2.com
```

---

## ☁️ Adım 2: Cloudflare CDN Kurulumu

### 2.1 Domain Ekle
1. https://dash.cloudflare.com
2. **Add a Site** → Domain'inizi ekleyin
3. Nameserver'ları güncelleyin

### 2.2 CNAME Record Ekle
1. **DNS** → **Records** → **Add record**
2. Ayarlar:
   ```
   Type: CNAME
   Name: videos
   Target: f004.backblazeb2.com
   Proxy: ✅ Proxied (turuncu bulut)
   ```

3. Şimdi videolarınız şu URL'den erişilebilir:
   ```
   https://videos.yourdomain.com/file/anime-videos/video.mp4
   ```

### 2.3 Caching Rules
1. **Caching** → **Configuration**
2. **Page Rules** ekle:
   ```
   URL: videos.yourdomain.com/*
   Cache Level: Cache Everything
   Edge Cache TTL: 1 month
   ```

### 2.4 CORS Headers
1. **Rules** → **Transform Rules** → **Modify Response Header**
2. Rule:
   ```
   If: Hostname equals videos.yourdomain.com
   Then:
   - Access-Control-Allow-Origin: *
   - Access-Control-Allow-Methods: GET, HEAD, OPTIONS
   ```

---

## 🔧 Adım 3: Proje Kurulumu

### 3.1 FFmpeg Kurulumu

**Windows:**
```powershell
choco install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

### 3.2 Python Bağımlılıkları
```bash
cd bunny_scripts
pip install b2sdk yt-dlp turkanime-cli
```

### 3.3 Node.js Bağımlılıkları
```bash
cd anime-streaming-ui
npm install
```

Yeni paketler:
- `backblaze-b2` - B2 SDK
- `fluent-ffmpeg` - FFmpeg wrapper
- `axios` - HTTP client

---

## ⚙️ Adım 4: Yapılandırma

### 4.1 .env Dosyası Oluştur
```bash
cd anime-streaming-ui
cp .env.example .env
```

### 4.2 .env Dosyasını Düzenle
```env
# Backblaze B2
VITE_B2_KEY_ID=00xxxxxxxxxxxxx
VITE_B2_APPLICATION_KEY=K00xxxxxxxxxxxxxxxxxxxxx
VITE_B2_BUCKET_NAME=anime-videos
VITE_B2_BUCKET_ID=xxxxxxxxxxxxxxx
VITE_B2_ENDPOINT=s3.us-west-004.backblazeb2.com

# Cloudflare CDN
VITE_CDN_URL=https://videos.yourdomain.com

# Video Storage Selection
VITE_VIDEO_STORAGE=b2

# B2 Upload API
VITE_B2_API_URL=http://localhost:5002
```

---

## 🚀 Adım 5: Kullanım

### 5.1 Backend API'yi Başlat

**Terminal 1:**
```bash
cd anime-streaming-ui
npm run b2-api
```

Backend şunları yapar:
- Video indirme
- FFmpeg ile HLS encoding
- Thumbnail oluşturma
- B2'ye yükleme

### 5.2 Frontend'i Başlat

**Terminal 2:**
```bash
cd anime-streaming-ui
npm run dev
```

### 5.3 Yeni Video Yükle

**Yöntem 1: Web UI**
1. http://localhost:5173 adresine gidin
2. Admin paneline gidin
3. "Upload Video" sayfasını açın
4. Video URL'sini girin veya dosya seçin

**Yöntem 2: Python Script (TurkAnime)**
```bash
cd bunny_scripts
python turkanime_to_b2.py --anime naruto --start 1 --end 10
```

---

## 🔄 Adım 6: Migration (Bunny → B2)

Mevcut Bunny.net videolarınızı B2'ye taşımak için:

### 6.1 Tüm Videoları Migrate Et
```bash
cd bunny_scripts
python migrate_bunny_to_b2.py --all
```

### 6.2 Belirli Collection'ı Migrate Et
```bash
python migrate_bunny_to_b2.py --collection "Naruto Season 1"
```

### 6.3 Tek Video Migrate Et
```bash
python migrate_bunny_to_b2.py --video-id abc123
```

**Not:** Migration sırasında:
1. Video Bunny'den indirilir
2. B2'ye yüklenir
3. Metadata oluşturulur
4. Log dosyasına kaydedilir

---

## 📊 Adım 7: Database Güncelleme

Migration sonrası database'deki video URL'lerini güncellemelisiniz:

**Eski (Bunny.net):**
```
https://iframe.mediadelivery.net/embed/512139/abc123
```

**Yeni (B2 + Cloudflare):**
```
https://videos.yourdomain.com/Naruto Season 1/abc123/playlist.m3u8
```

**SQL Örneği:**
```sql
-- Video URL'lerini güncelle
UPDATE episodes 
SET video_url = REPLACE(
  video_url, 
  'https://iframe.mediadelivery.net/embed/512139/',
  'https://videos.yourdomain.com/'
);
```

---

## 🎬 Video Encoding Detayları

### HLS Format
B2'ye yüklenen videolar HLS formatında olacak:
```
anime-videos/
  Naruto Season 1/
    abc123/
      playlist.m3u8      # Master playlist
      segment_000.ts     # Video segment 1
      segment_001.ts     # Video segment 2
      ...
      thumbnail.jpg      # Thumbnail
      metadata.json      # Video metadata
```

### Encoding Ayarları (H.265/HEVC) ✅
- **Codec:** H.265 (libx265) - %25-50 daha küçük dosya boyutu!
- **Audio:** AAC 128kbps
- **CRF:** 28 (H.265 için optimal, H.264'teki 23'e eşdeğer kalite)
- **Preset:** medium (hız/kalite dengesi)
- **Tag:** hvc1 (Apple uyumluluğu)
- **Segment:** 10 saniye

**Neden H.265?**
- Daha küçük dosya boyutu = Daha az storage maliyeti
- Daha az bandwidth = Daha hızlı yükleme
- Aynı kalite, yarı boyut!

### Çoklu Kalite (Opsiyonel)
Adaptive bitrate için:
- **1080p:** CRF 26
- **720p:** 3 Mbps
- **480p:** 1 Mbps

---

## 💰 Maliyet Karşılaştırması

### Örnek: 100GB video, 1TB/ay bandwidth

**Bunny.net:**
- Storage: $0.50/ay
- Bandwidth: $5.00/ay
- **Toplam: $5.50/ay**

**B2 + Cloudflare:**
- Storage: $0.50/ay
- Bandwidth: $0.00/ay (Cloudflare ücretsiz!)
- **Toplam: $0.50/ay**

**Tasarruf: %90!** 🎉

---

## 🔍 Test ve Doğrulama

### 1. B2 Bağlantısı Test Et
```bash
curl http://localhost:5002/api/test
```

Beklenen yanıt:
```json
{
  "success": true,
  "message": "B2 API çalışıyor!"
}
```

### 2. Video Upload Test Et
```bash
curl -X POST http://localhost:5002/api/upload-to-b2 \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://example.com/video.mp4",
    "title": "Test Video",
    "animeName": "Test Anime"
  }'
```

### 3. CDN Test Et
```bash
curl -I https://videos.yourdomain.com/test.mp4
```

Beklenen header'lar:
- `cf-cache-status: HIT` (cache'lenmiş)
- `access-control-allow-origin: *` (CORS)

---

## 🐛 Sorun Giderme

### Problem: FFmpeg bulunamadı
**Çözüm:**
```bash
# FFmpeg kurulu mu kontrol et
ffmpeg -version

# Kurulu değilse:
# Windows: choco install ffmpeg
# Linux: sudo apt install ffmpeg
# macOS: brew install ffmpeg
```

### Problem: B2 authorization hatası
**Çözüm:**
- `.env` dosyasında `VITE_B2_KEY_ID` ve `VITE_B2_APPLICATION_KEY` doğru mu?
- Application Key'in bucket'a erişim yetkisi var mı?

### Problem: Cloudflare CORS hatası
**Çözüm:**
1. Cloudflare Dashboard → Rules → Transform Rules
2. CORS header'ları ekleyin (Adım 2.4)

### Problem: Video oynatılamıyor
**Çözüm:**
1. Browser console'da hata kontrol edin
2. Network tab'de `playlist.m3u8` isteğini kontrol edin
3. Status code 200 olmalı
4. CORS header'ları var mı kontrol edin

---

## 📚 Ek Kaynaklar

### Dokümantasyon
- **Detaylı Kurulum:** `B2_CLOUDFLARE_SETUP.md`
- **API Referansı:** `server/b2-upload-api.js`
- **Python Script:** `bunny_scripts/turkanime_to_b2.py`

### Dosya Yapısı
```
naber-anime-izle/
├── B2_CLOUDFLARE_SETUP.md      # Detaylı kurulum rehberi
├── B2_QUICK_START.md           # Bu dosya
├── anime-streaming-ui/
│   ├── src/utils/b2Upload.js   # B2 upload utility (frontend)
│   ├── server/b2-upload-api.js # B2 upload API (backend)
│   └── .env                    # Yapılandırma
└── bunny_scripts/
    ├── turkanime_to_b2.py      # TurkAnime → B2
    └── migrate_bunny_to_b2.py  # Bunny → B2 migration
```

---

## ✅ Checklist

Geçiş tamamlandı mı? Kontrol edin:

- [ ] B2 hesabı oluşturuldu
- [ ] Bucket oluşturuldu (Public)
- [ ] Application Key alındı
- [ ] Cloudflare domain eklendi
- [ ] CNAME record eklendi (Proxied)
- [ ] Caching rules yapılandırıldı
- [ ] CORS headers eklendi
- [ ] FFmpeg kuruldu
- [ ] Python bağımlılıkları kuruldu
- [ ] Node.js bağımlılıkları kuruldu
- [ ] .env dosyası yapılandırıldı
- [ ] Backend API çalışıyor
- [ ] Test video yüklendi
- [ ] Video oynatılıyor
- [ ] Migration tamamlandı (opsiyonel)
- [ ] Database güncellendi

---

## 🎉 Tebrikler!

Artık anime streaming platformunuz **Backblaze B2 + Cloudflare** altyapısında çalışıyor!

**Sonraki adımlar:**
1. Mevcut videoları kademeli olarak migrate edin
2. Yeni videoları B2'ye yükleyin
3. Maliyet tasarrufunun keyfini çıkarın! 💰

**Sorularınız için:**
- GitHub Issues
- Discord
- Email: support@yourdomain.com

---

**Son Güncelleme:** 2025-01-16
