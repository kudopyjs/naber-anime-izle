# 🚀 HiAnime to Cloudflare R2 Direct Transfer

Anime videolarını HiAnime'den direkt Cloudflare R2'ye stream eder (local storage kullanmadan).

## 📋 Özellikler

- ✅ **Direkt Stream**: Video indirmeden R2'ye yükler
- ✅ **Altyazı Desteği**: Otomatik altyazı indirme ve yükleme
- ✅ **Bandwidth Ücretsiz**: R2'nin egress ücretsiz
- ✅ **Hızlı**: Cloudflare CDN ile dünya çapında hızlı
- ✅ **Batch Processing**: Çoklu bölüm yükleme

## 🔧 Kurulum

### 1. Gereksinimleri Yükle

```bash
cd r2-uploader
pip install -r requirements.txt
```

### 2. yt-dlp-hianime Yükle

```bash
pip install git+https://github.com/pratikpatel8982/yt-dlp-hianime.git
```

### 3. Cloudflare R2 Ayarları

1. Cloudflare Dashboard → R2
2. Bucket oluştur: `anime-videos`
3. API Token oluştur (R2 Read & Write)
4. Public URL aktif et

### 4. .env Dosyası Oluştur

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=anime-videos
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

ANIWATCH_API_URL=http://localhost:4000
```

## 🎬 Kullanım

### 1️⃣ Episode Listesi Oluştur (Otomatik)

Popüler animelerden otomatik episode listesi oluştur:

```bash
python generate_episodes.py
```

**Seçenekler:**
- Trending Anime (en popüler)
- Popular Anime
- Top Airing Anime (şu an yayında)
- Belirli anime ID'leri

**Örnek çıktı:** `episodes.json`

### 2️⃣ Tek Bölüm Yükle

```bash
python main.py <anime_slug> <episode_id> <episode_number>
```

**Örnek:**
```bash
python main.py one-piece-100 1 1
```

### Python'dan Kullan

```python
from main import AnimeToR2Pipeline

pipeline = AnimeToR2Pipeline()

result = pipeline.process_episode(
    anime_slug="one-piece-100",
    episode_id="1",
    episode_number=1
)

print(result["video_url"])
# https://pub-xxxxx.r2.dev/one-piece-100/episode-1.mp4
```

### 3️⃣ Batch Upload (Toplu Yükleme)

**Otomatik (episodes.json kullanarak):**

```bash
# 1. Episode listesi oluştur
python generate_episodes.py

# 2. Toplu yükle
python batch_upload.py
```

**Manuel (Python'dan):**

```python
episodes = [
    {"anime_slug": "one-piece-100", "episode_id": "1", "episode_number": 1},
    {"anime_slug": "one-piece-100", "episode_id": "2", "episode_number": 2},
    {"anime_slug": "one-piece-100", "episode_id": "3", "episode_number": 3},
]

results = pipeline.process_batch(episodes)
```

## 📁 Çıktı Yapısı (R2)

```
anime-videos/
├── one-piece-100/
│   ├── episode-1.mp4
│   ├── episode-1.en.srt
│   ├── episode-2.mp4
│   ├── episode-2.en.srt
│   └── ...
├── naruto-1/
│   ├── episode-1.mp4
│   └── ...
```

## 🎥 Frontend Entegrasyonu

### Watch.jsx'de Kullan

```javascript
// R2'den video URL'ini al
const videoUrl = `https://pub-xxxxx.r2.dev/${animeSlug}/episode-${episodeNumber}.mp4`
const subtitleUrl = `https://pub-xxxxx.r2.dev/${animeSlug}/episode-${episodeNumber}.en.srt`

// Video player
<video controls crossOrigin="anonymous">
  <source src={videoUrl} type="video/mp4" />
  <track kind="subtitles" src={subtitleUrl} srclang="en" label="English" />
</video>
```

## 🔄 Workflow

1. **Kullanıcı bölüm seçer** → Frontend
2. **Backend kontrol eder** → R2'de var mı?
3. **Yoksa:** Python script çalıştır → HiAnime'den R2'ye stream
4. **Varsa:** Direkt R2 URL'ini döndür
5. **Frontend oynatır** → Video.js / Plyr

## 💰 Maliyet Tahmini

**1000 bölüm (1080p, ~500MB/bölüm):**
- Depolama: 500GB × $0.015 = **$7.5/ay**
- Bandwidth: **ÜCRETSİZ** 🎉
- **Toplam: ~$8/ay**

## ⚡ Performans

- **Upload Hızı**: ~50-100 Mbps (internet hızınıza bağlı)
- **Streaming**: Cloudflare CDN ile <100ms latency
- **Concurrent Uploads**: 5-10 paralel yükleme

## 🛠️ Test

```bash
# Video info al
python hianime_downloader.py

# R2 bağlantı test
python r2_uploader.py

# Tam pipeline test
python main.py one-piece-100 1 1
```

## 📊 Sonuçlar

Tüm yükleme sonuçları `upload_results.json` dosyasına kaydedilir:

```json
[
  {
    "anime_slug": "one-piece-100",
    "episode_id": "1",
    "episode_number": 1,
    "success": true,
    "video_url": "https://pub-xxxxx.r2.dev/one-piece-100/episode-1.mp4",
    "subtitle_urls": {
      "en": "https://pub-xxxxx.r2.dev/one-piece-100/episode-1.en.srt"
    }
  }
]
```

## 🚨 Notlar

- **Telif Hakkı**: Sadece kişisel kullanım için
- **Rate Limiting**: HiAnime'den çok hızlı indirmeyin
- **Disk Alanı**: Altyazılar için minimal temp storage (~1MB)
- **Bandwidth**: R2'ye upload için internet hızınız önemli

## 🎯 Sonraki Adımlar

1. ✅ Python script'i çalıştır
2. ✅ R2'ye video yükle
3. ✅ Frontend'i güncelle (R2 URL'leri kullan)
4. ✅ Otomatik batch processing ekle
5. ✅ Admin panel oluştur (video yönetimi)
