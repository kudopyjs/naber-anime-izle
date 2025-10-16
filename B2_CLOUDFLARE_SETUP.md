# 🚀 Backblaze B2 + Cloudflare Kurulum Rehberi

## 📌 Genel Bakış

Bu rehber, anime streaming platformunuzu **Bunny.net**'ten **Backblaze B2 + Cloudflare** altyapısına geçirmeniz için hazırlanmıştır.

### Mimari

```
Video Upload → FFmpeg Encoding → B2 Storage → Cloudflare CDN → Video Player
```

---

## 🔧 1. Backblaze B2 Kurulumu

### 1.1 Hesap Oluşturma

1. https://www.backblaze.com/b2/sign-up.html adresine gidin
2. Ücretsiz hesap oluşturun (10GB ücretsiz)
3. Email doğrulama yapın

### 1.2 Bucket Oluşturma

1. **B2 Cloud Storage** → **Buckets** → **Create a Bucket**
2. Ayarlar:
   - **Bucket Name:** `anime-videos` (benzersiz olmalı)
   - **Files in Bucket:** `Public` (önemli!)
   - **Encryption:** `Disable` (Cloudflare şifreleyecek)
   - **Object Lock:** `Disable`

### 1.3 Application Key Oluşturma

1. **App Keys** → **Add a New Application Key**
2. Ayarlar:
   - **Name:** `anime-upload-key`
   - **Allow access to Bucket(s):** `anime-videos`
   - **Type of Access:** `Read and Write`
   - **Allow List All Bucket Names:** ✅
   - **File name prefix:** (boş bırakın)
   - **Duration:** (boş bırakın - süresiz)

3. **Create New Key** → **Bilgileri kaydedin:**
   ```
   keyID: 00xxxxxxxxxxxxx
   applicationKey: K00xxxxxxxxxxxxxxxxxxxxx
   ```
   
   ⚠️ **ÖNEMLİ:** `applicationKey` sadece bir kez gösterilir! Kaydedin!

### 1.4 Bucket Bilgilerini Alma

1. Bucket'ınıza tıklayın
2. **Endpoint** bilgisini not edin:
   ```
   s3.us-west-004.backblazeb2.com
   ```
3. **Bucket ID** bilgisini not edin

---

## ☁️ 2. Cloudflare Kurulumu

### 2.1 Domain Ekleme

1. https://dash.cloudflare.com adresine gidin
2. **Add a Site** → Domain'inizi ekleyin
3. Nameserver'ları domain sağlayıcınızda güncelleyin

### 2.2 B2 için Cloudflare CDN (Bandwidth Alliance)

Backblaze ve Cloudflare arasında **Bandwidth Alliance** var - B2'den Cloudflare'e giden trafik ücretsiz!

#### Yöntem 1: CNAME Setup (Önerilen)

1. B2 Bucket Settings → **Bucket Info**
2. **Friendly URL** bulun: `f004.backblazeb2.com/file/anime-videos/`
3. Cloudflare DNS'e CNAME ekleyin:
   ```
   Type: CNAME
   Name: videos (veya cdn)
   Target: f004.backblazeb2.com
   Proxy: ✅ Proxied (turuncu bulut)
   ```

4. Şimdi videolarınız şu URL'den erişilebilir:
   ```
   https://videos.yourdomain.com/file/anime-videos/video.mp4
   ```

#### Yöntem 2: Cloudflare Workers (Gelişmiş)

B2 URL'lerini tamamen gizlemek için:

```javascript
// cloudflare-worker/b2-proxy.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const b2Url = `https://f004.backblazeb2.com/file/anime-videos${url.pathname}`;
    
    return fetch(b2Url, {
      headers: request.headers
    });
  }
}
```

Deploy:
```bash
wrangler deploy
```

### 2.3 Cloudflare Caching Ayarları

1. **Caching** → **Configuration**
2. **Caching Level:** `Standard`
3. **Browser Cache TTL:** `4 hours`
4. **Page Rules** ekleyin:
   ```
   URL: videos.yourdomain.com/*
   Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   - Browser Cache TTL: 4 hours
   ```

### 2.4 CORS Ayarları (Transform Rules)

1. **Rules** → **Transform Rules** → **Modify Response Header**
2. Rule oluşturun:
   ```
   If: Hostname equals videos.yourdomain.com
   Then:
   - Set static: Access-Control-Allow-Origin = *
   - Set static: Access-Control-Allow-Methods = GET, HEAD, OPTIONS
   ```

---

## 🎬 3. Video Encoding (FFmpeg)

B2'ye yüklemeden önce videoları encode etmelisiniz.

### 3.1 FFmpeg Kurulumu

**Windows:**
```powershell
# Chocolatey ile
choco install ffmpeg

# Veya manuel: https://ffmpeg.org/download.html
```

**Linux/Mac:**
```bash
sudo apt install ffmpeg  # Ubuntu/Debian
brew install ffmpeg      # macOS
```

### 3.2 HLS Encoding Script

Video'yu HLS formatına çevirmek için:

#### H.265 (HEVC) - Önerilen ✅

**Avantajları:**
- %25-50 daha küçük dosya boyutu
- Daha az bandwidth kullanımı
- Daha az storage maliyeti

```bash
# Tek kalite (H.265 - Önerilen)
ffmpeg -i input.mp4 \
  -c:v libx265 -crf 28 -preset medium \
  -tag:v hvc1 \
  -c:a aac -b:a 128k \
  -hls_time 10 \
  -hls_playlist_type vod \
  -hls_segment_filename "segment_%03d.ts" \
  playlist.m3u8

# Çoklu kalite (adaptive bitrate - H.265)
ffmpeg -i input.mp4 \
  -filter_complex \
  "[0:v]split=3[v1][v2][v3]; \
   [v1]scale=w=1920:h=1080[v1out]; \
   [v2]scale=w=1280:h=720[v2out]; \
   [v3]scale=w=854:h=480[v3out]" \
  -map "[v1out]" -c:v:0 libx265 -crf 26 -preset medium -tag:v hvc1 \
  -map "[v2out]" -c:v:1 libx265 -crf 28 -preset medium -tag:v hvc1 \
  -map "[v3out]" -c:v:2 libx265 -crf 30 -preset medium -tag:v hvc1 \
  -map 0:a -c:a aac -b:a 128k -ac 2 \
  -f hls -hls_time 10 -hls_playlist_type vod \
  -hls_segment_filename "v%v/segment_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:0 v:2,a:0" \
  v%v/playlist.m3u8
```

#### H.264 (AVC) - Eski Tarayıcılar İçin

```bash
# Tek kalite (H.264)
ffmpeg -i input.mp4 \
  -c:v libx264 -crf 23 -preset medium \
  -c:a aac -b:a 128k \
  -hls_time 10 \
  -hls_playlist_type vod \
  -hls_segment_filename "segment_%03d.ts" \
  playlist.m3u8
```

**Not:** Projede varsayılan olarak **H.265 (HEVC)** kullanılıyor.

### 3.3 Thumbnail Oluşturma

```bash
# İlk frame'i thumbnail yap
ffmpeg -i input.mp4 -ss 00:00:01 -vframes 1 -q:v 2 thumbnail.jpg

# Her 10 saniyede bir thumbnail (sprite sheet için)
ffmpeg -i input.mp4 -vf "fps=1/10,scale=160:90,tile=10x10" sprite.jpg
```

---

## 📤 4. B2 Upload Utility

### 4.1 Node.js B2 SDK Kurulumu

```bash
cd anime-streaming-ui
npm install backblaze-b2
```

### 4.2 B2 Upload Utility Oluşturma

`src/utils/b2Upload.js` dosyası oluşturulacak (sonraki adımda)

---

## 🔄 5. Migration Stratejisi

### Seçenek 1: Kademeli Geçiş (Önerilen)

1. **Yeni videolar** → B2'ye yükle
2. **Eski videolar** → Bunny.net'te kalsın
3. Video player her iki sistemi desteklesin
4. Zamanla tüm videoları migrate et

### Seçenek 2: Toplu Migration

1. Bunny.net'ten tüm videoları indir
2. FFmpeg ile encode et
3. B2'ye yükle
4. Database'i güncelle

---

## 💰 6. Maliyet Karşılaştırması

### Bunny.net Stream
- Storage: $0.005/GB/ay
- Encoding: Ücretsiz
- Bandwidth: $0.01/GB (ilk 500GB sonrası)

### Backblaze B2 + Cloudflare
- Storage: $0.005/GB/ay (aynı)
- Encoding: Kendiniz yapın (FFmpeg ücretsiz)
- Bandwidth: **ÜCRETSIZ** (Cloudflare CDN ile)
- B2 Download: $0.01/GB (ama Cloudflare kullanırsanız ücretsiz!)

**Örnek:** 100GB video, 1TB/ay bandwidth
- Bunny.net: $0.50 (storage) + $5 (bandwidth) = **$5.50/ay**
- B2 + Cloudflare: $0.50 (storage) + $0 (bandwidth) = **$0.50/ay**

**Tasarruf: %90!** 🎉

---

## 🔐 7. Güvenlik

### 7.1 Private Videos (İsteğe Bağlı)

B2 bucket'ı private yapıp signed URL kullanabilirsiniz:

```javascript
// Signed URL oluşturma (backend'de)
const crypto = require('crypto');

function generateSignedUrl(filePath, expiresIn = 3600) {
  const expires = Date.now() + expiresIn * 1000;
  const signature = crypto
    .createHmac('sha256', B2_APP_KEY)
    .update(`${filePath}${expires}`)
    .digest('hex');
  
  return `https://videos.yourdomain.com/${filePath}?expires=${expires}&signature=${signature}`;
}
```

### 7.2 Hotlink Protection

Cloudflare'de:
1. **Security** → **WAF** → **Custom Rules**
2. Rule:
   ```
   If: Referer does not contain yourdomain.com
   Then: Block
   ```

---

## 📝 8. .env Yapılandırması

`.env` dosyanıza ekleyin:

```env
# Backblaze B2 Configuration
VITE_B2_KEY_ID=00xxxxxxxxxxxxx
VITE_B2_APPLICATION_KEY=K00xxxxxxxxxxxxxxxxxxxxx
VITE_B2_BUCKET_NAME=anime-videos
VITE_B2_BUCKET_ID=xxxxxxxxxxxxxxx
VITE_B2_ENDPOINT=s3.us-west-004.backblazeb2.com

# Cloudflare CDN
VITE_CDN_URL=https://videos.yourdomain.com

# FFmpeg Path (backend için)
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
```

---

## 🎯 9. Sonraki Adımlar

1. ✅ B2 hesabı oluştur ve bucket ayarla
2. ✅ Cloudflare CDN yapılandır
3. ⏳ `b2Upload.js` utility'sini oluştur
4. ⏳ Video encoding pipeline'ı kur
5. ⏳ Video player'ı güncelle
6. ⏳ Migration script'i çalıştır

---

## 🆘 Destek

- **Backblaze Docs:** https://www.backblaze.com/b2/docs/
- **Cloudflare Docs:** https://developers.cloudflare.com/
- **FFmpeg Wiki:** https://trac.ffmpeg.org/wiki

---

## ⚠️ Önemli Notlar

1. **Encoding süresi:** 1 saatlik video = ~10-20 dakika encoding (bilgisayarınıza bağlı)
2. **Storage ihtiyacı:** HLS segmentleri orijinal dosyadan ~20-30% daha fazla yer kaplar
3. **Bandwidth:** Cloudflare ücretsiz ama B2'den ilk indirme ücretli (cache'lenene kadar)
4. **Backup:** B2'de versioning açın, yanlışlıkla silinen dosyaları kurtarabilirsiniz

---

**Hazır mısınız?** Şimdi `b2Upload.js` utility'sini oluşturalım! 🚀
