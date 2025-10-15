# 🐰 Bunny.net Video Streaming Kurulum Rehberi

## 📋 İçindekiler
1. [Bunny.net Hesap Kurulumu](#1-bunnynet-hesap-kurulumu)
2. [Stream Library Oluşturma](#2-stream-library-oluşturma)
3. [API Anahtarlarını Alma](#3-api-anahtarlarını-alma)
4. [Proje Entegrasyonu](#4-proje-entegrasyonu)
5. [Başka Arşivden Video Aktarma](#5-başka-arşivden-video-aktarma)
6. [Upload Sayfasını Güncelleme](#6-upload-sayfasını-güncelleme)

---

## 1. Bunny.net Hesap Kurulumu

### Adım 1: Hesap Oluştur
1. https://bunny.net adresine git
2. **"Sign Up"** butonuna tıkla
3. Email ve şifre ile kayıt ol
4. Email'ini doğrula

### Adım 2: Ödeme Bilgilerini Ekle
- Bunny.net kredi kartı gerektirir (kullandığın kadar öde)
- **Fiyatlandırma:**
  - Depolama: $0.01/GB/ay
  - Streaming: $0.005/GB (Avrupa)
  - Encoding: Ücretsiz
- İlk $1 ücretsiz kredi verilir

---

## 2. Stream Library Oluşturma

### Adım 1: Stream Sekmesine Git
1. Dashboard'da sol menüden **"Stream"** sekmesine tıkla
2. **"Add Stream Library"** butonuna tıkla

### Adım 2: Library Ayarları
```
Name: anime-videos (veya istediğin isim)
Replication Regions: 
  ✓ Europe (Türkiye için en yakın)
  ✓ Asia (opsiyonel, daha iyi performans için)
```

### Adım 3: Gelişmiş Ayarlar (Opsiyonel)
```
Player Settings:
  ✓ Enable player branding
  ✓ Enable captions
  ✓ Enable download button (isteğe bağlı)

Security:
  ✓ Enable token authentication (güvenlik için önerilir)
  ✓ Allowed referrer domains: yourdomain.com
```

### Adım 4: Oluştur
- **"Create"** butonuna tıkla
- Library oluşturuldu! 🎉

---

## 3. API Anahtarlarını Alma

### Adım 1: Library'nize Tıklayın
- Stream dashboard'da yeni oluşturduğunuz library'ye tıklayın

### Adım 2: API Sekmesi
1. Üst menüden **"API"** sekmesine gidin
2. Şu bilgileri kopyalayın:

```
API Key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Library ID: 12345
```

### Adım 3: CDN Hostname'i Bulun
1. **"Overview"** sekmesine dönün
2. **"CDN Hostname"** bölümünü bulun:
```
CDN Hostname: vz-xxxxxxxx-xxx.b-cdn.net
```

### ⚠️ ÖNEMLİ: Bu bilgileri güvenli bir yere kaydedin!

---

## 4. Proje Entegrasyonu

### Adım 1: .env Dosyasını Güncelle

`.env` dosyanızı açın ve şunları ekleyin:

```env
# Bunny Stream Configuration
VITE_BUNNY_STREAM_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_BUNNY_LIBRARY_ID=12345
VITE_BUNNY_CDN_HOSTNAME=vz-xxxxxxxx-xxx.b-cdn.net
```

**Gerçek değerlerinizi yazın!**

### Adım 2: Dev Server'ı Yeniden Başlat

```bash
# Ctrl+C ile durdur
# Sonra tekrar başlat
npm run dev
```

### Adım 3: Test Et

Tarayıcı konsolunda test edin:
```javascript
console.log('API Key:', import.meta.env.VITE_BUNNY_STREAM_API_KEY)
console.log('Library ID:', import.meta.env.VITE_BUNNY_LIBRARY_ID)
```

Değerler görünüyorsa ✅ başarılı!

---

## 5. Başka Arşivden Video Aktarma

### Yöntem 1: URL'den Direkt Aktarma (En Kolay)

Eğer videolarınız URL ile erişilebiliyorsa:

```javascript
import { uploadFromURL } from './utils/bunnyUpload'

// Tek video aktar
const result = await uploadFromURL(
  'https://eski-arsiv.com/anime/naruto-ep1.mp4',
  'Naruto - Bölüm 1'
)

if (result.success) {
  console.log('Video ID:', result.videoId)
  console.log('Embed URL:', result.data.embedUrl)
}
```

### Yöntem 2: Python Script ile Toplu Aktarma

Çok sayıda video için Python scripti kullanın:

#### Adım 1: Script Oluştur

`bunny_transfer.py` dosyası oluşturun:

```python
import requests
import os
import json
from pathlib import Path
import time

# Bunny.net ayarları
BUNNY_API_KEY = "your-api-key-here"
LIBRARY_ID = "your-library-id-here"

# Kaynak klasör
SOURCE_FOLDER = r"C:\path\to\old\archive"

def create_video(title):
    """Bunny'de yeni video oluştur"""
    url = f"https://video.bunnycdn.com/library/{LIBRARY_ID}/videos"
    headers = {
        "AccessKey": BUNNY_API_KEY,
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, headers=headers, json={"title": title})
    
    if response.status_code == 200:
        return response.json()["guid"]
    else:
        print(f"Hata: {response.text}")
        return None

def upload_video(video_id, file_path):
    """Video dosyasını yükle"""
    url = f"https://video.bunnycdn.com/library/{LIBRARY_ID}/videos/{video_id}"
    headers = {
        "AccessKey": BUNNY_API_KEY,
        "Content-Type": "application/octet-stream"
    }
    
    file_size = os.path.getsize(file_path)
    print(f"  Dosya boyutu: {file_size / (1024*1024):.2f} MB")
    
    with open(file_path, 'rb') as f:
        response = requests.put(url, headers=headers, data=f)
    
    return response.status_code == 200

def transfer_all_videos():
    """Tüm videoları aktar"""
    # Desteklenen formatlar
    video_extensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm']
    
    # Tüm video dosyalarını bul
    video_files = []
    for ext in video_extensions:
        video_files.extend(Path(SOURCE_FOLDER).glob(f"*{ext}"))
    
    print(f"Toplam {len(video_files)} video bulundu\n")
    
    success_count = 0
    fail_count = 0
    
    for i, video_file in enumerate(video_files, 1):
        print(f"[{i}/{len(video_files)}] İşleniyor: {video_file.name}")
        
        # Video başlığı (dosya adından)
        title = video_file.stem
        
        # Video oluştur
        video_id = create_video(title)
        if not video_id:
            print(f"  ✗ Video oluşturulamadı!")
            fail_count += 1
            continue
        
        print(f"  Video ID: {video_id}")
        
        # Dosyayı yükle
        if upload_video(video_id, video_file):
            print(f"  ✓ Başarıyla yüklendi!")
            success_count += 1
        else:
            print(f"  ✗ Yükleme başarısız!")
            fail_count += 1
        
        # Rate limiting için bekle
        time.sleep(1)
        print()
    
    print("\n" + "="*50)
    print(f"Transfer tamamlandı!")
    print(f"Başarılı: {success_count}")
    print(f"Başarısız: {fail_count}")
    print("="*50)

if __name__ == "__main__":
    print("Bunny.net Video Transfer Scripti")
    print("="*50)
    print(f"Kaynak klasör: {SOURCE_FOLDER}")
    print(f"Library ID: {LIBRARY_ID}")
    print("="*50 + "\n")
    
    input("Devam etmek için Enter'a basın...")
    
    transfer_all_videos()
```

#### Adım 2: Gerekli Kütüphaneleri Yükle

```bash
pip install requests
```

#### Adım 3: Script'i Çalıştır

```bash
python bunny_transfer.py
```

### Yöntem 3: URL Listesinden Aktarma

Eğer video URL'leriniz bir listede varsa:

`video_urls.txt` dosyası oluşturun:
```
https://eski-arsiv.com/anime/naruto-ep1.mp4|Naruto - Bölüm 1
https://eski-arsiv.com/anime/naruto-ep2.mp4|Naruto - Bölüm 2
https://eski-arsiv.com/anime/onepiece-ep1.mp4|One Piece - Bölüm 1
```

Python scripti:

```python
import requests

BUNNY_API_KEY = "your-api-key"
LIBRARY_ID = "your-library-id"

def upload_from_url(video_url, title):
    """URL'den video aktar"""
    url = f"https://video.bunnycdn.com/library/{LIBRARY_ID}/videos/fetch"
    headers = {
        "AccessKey": BUNNY_API_KEY,
        "Content-Type": "application/json"
    }
    
    data = {
        "url": video_url,
        "title": title
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.status_code == 200

# URL listesini oku ve aktar
with open('video_urls.txt', 'r', encoding='utf-8') as f:
    for line in f:
        video_url, title = line.strip().split('|')
        print(f"Aktarılıyor: {title}")
        
        if upload_from_url(video_url, title):
            print(f"  ✓ Başarılı!")
        else:
            print(f"  ✗ Başarısız!")
```

---

## 6. Upload Sayfasını Güncelleme

### Seçenek 1: Hem Lokal Hem URL Upload

Upload sayfasına iki seçenek ekleyin:

```javascript
// UploadVideo.jsx içinde
const [uploadMethod, setUploadMethod] = useState('file') // 'file' veya 'url'
const [videoUrl, setVideoUrl] = useState('')

// Form içinde:
<div className="mb-6">
  <label className="block text-white font-medium mb-2">Upload Yöntemi</label>
  <div className="flex gap-4">
    <button
      type="button"
      onClick={() => setUploadMethod('file')}
      className={`px-6 py-3 rounded-lg ${
        uploadMethod === 'file' 
          ? 'bg-primary text-white' 
          : 'bg-white/10 text-white/60'
      }`}
    >
      📁 Dosya Yükle
    </button>
    <button
      type="button"
      onClick={() => setUploadMethod('url')}
      className={`px-6 py-3 rounded-lg ${
        uploadMethod === 'url' 
          ? 'bg-primary text-white' 
          : 'bg-white/10 text-white/60'
      }`}
    >
      🔗 URL'den Aktar
    </button>
  </div>
</div>

{uploadMethod === 'url' && (
  <div>
    <label className="block text-white font-medium mb-2">Video URL</label>
    <input
      type="url"
      value={videoUrl}
      onChange={(e) => setVideoUrl(e.target.value)}
      placeholder="https://example.com/video.mp4"
      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white"
      required
    />
  </div>
)}
```

### Seçenek 2: Progress Bar Ekle

```javascript
const [uploadProgress, setUploadProgress] = useState(0)

// Upload sırasında:
const result = await uploadVideoFile(
  formData.video,
  formData.title,
  (progress) => setUploadProgress(progress)
)

// UI'da göster:
{uploading && (
  <div className="w-full bg-white/10 rounded-full h-4 mb-4">
    <div 
      className="bg-primary h-4 rounded-full transition-all"
      style={{ width: `${uploadProgress}%` }}
    />
    <p className="text-white text-center mt-2">
      {uploadProgress.toFixed(0)}% Yüklendi
    </p>
  </div>
)}
```

---

## 7. Video Player Entegrasyonu

### Watch Sayfasında Bunny Player Kullan

`src/pages/Watch.jsx` dosyasını güncelleyin:

```javascript
// Bunny video ID'si varsa
{anime.bunnyVideoId && (
  <iframe
    src={`https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${anime.bunnyVideoId}?autoplay=false&preload=true`}
    loading="lazy"
    style={{
      border: 0,
      position: 'absolute',
      top: 0,
      height: '100%',
      width: '100%'
    }}
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
    allowFullScreen
  />
)}
```

---

## 📊 Maliyet Hesaplama

### Örnek Senaryo:
- **100 anime**, her biri **24 bölüm**
- Her bölüm **500 MB** (ortalama)
- Aylık **10,000 izlenme**

### Maliyetler:
```
Depolama:
100 anime × 24 bölüm × 0.5 GB = 1,200 GB
1,200 GB × $0.01 = $12/ay

Streaming (Avrupa):
10,000 izlenme × 0.5 GB = 5,000 GB
5,000 GB × $0.005 = $25/ay

Encoding: Ücretsiz

TOPLAM: ~$37/ay
```

### İlk Ay Ücretsiz Test:
- $1 ücretsiz kredi
- Yaklaşık 200 GB streaming yapabilirsiniz
- ~400 video izlenme

---

## 🔒 Güvenlik Önerileri

### 1. Token Authentication Aktif Edin

Bunny Dashboard → Library → Security:
```
✓ Enable token authentication
✓ Set token expiration: 3600 seconds (1 saat)
```

### 2. Referrer Kısıtlaması

```
Allowed referrer domains:
- yourdomain.com
- localhost:5173 (development için)
```

### 3. API Key'i Gizleyin

```javascript
// ❌ YANLIŞ - Frontend'de API key kullanma
const BUNNY_API_KEY = 'xxx'

// ✓ DOĞRU - Backend'de kullan
// Backend API endpoint oluştur:
// POST /api/upload-video
```

**Backend örneği (Node.js):**

```javascript
// server.js
app.post('/api/upload-video', async (req, res) => {
  const { title, videoUrl } = req.body
  
  const response = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/fetch`,
    {
      method: 'POST',
      headers: {
        'AccessKey': process.env.BUNNY_API_KEY, // Backend'de sakla
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: videoUrl, title })
    }
  )
  
  const data = await response.json()
  res.json(data)
})
```

---

## 🎯 Hızlı Başlangıç Checklist

- [ ] Bunny.net hesabı oluştur
- [ ] Stream Library oluştur
- [ ] API Key ve Library ID al
- [ ] `.env` dosyasını güncelle
- [ ] Dev server'ı yeniden başlat
- [ ] `bunnyUpload.js` dosyasını kontrol et
- [ ] Test upload yap
- [ ] Video player'ı test et
- [ ] Eski arşivden video aktar
- [ ] Production için backend API oluştur

---

## 🆘 Sorun Giderme

### Hata: "Invalid API Key"
**Çözüm:** 
- `.env` dosyasında API key'i kontrol edin
- Dev server'ı yeniden başlatın
- API key'in doğru library'den olduğundan emin olun

### Hata: "Upload failed"
**Çözüm:**
- Dosya boyutunu kontrol edin (max 5GB)
- İnternet bağlantınızı kontrol edin
- Bunny hesabınızda kredi olduğundan emin olun

### Video Yüklenmiyor
**Çözüm:**
- Encoding tamamlanana kadar bekleyin (birkaç dakika sürebilir)
- Video status'unu kontrol edin: `getVideoInfo(videoId)`
- Status `4` olmalı (ready)

### CORS Hatası
**Çözüm:**
- API çağrılarını backend'e taşıyın
- Bunny Dashboard'da allowed domains ekleyin

---

## 📚 Faydalı Linkler

- **Bunny.net Dashboard:** https://bunny.net/dashboard
- **Stream API Docs:** https://docs.bunny.net/reference/video_library
- **Pricing:** https://bunny.net/pricing/stream
- **Support:** https://support.bunny.net

---

## ✅ Sonraki Adımlar

1. ✅ Bunny.net kurulumunu tamamla
2. ✅ Test upload yap
3. ✅ Eski arşivden videoları aktar
4. 🔄 Backend API oluştur (güvenlik için)
5. 🔄 Production deployment
6. 🔄 CDN optimizasyonu

**Başarılar! 🚀**
