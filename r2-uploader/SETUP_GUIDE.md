# 🚀 R2 Uploader - Kurulum Rehberi

## 📋 Gereksinimler

- Python 3.8+
- pip
- Cloudflare hesabı (R2 aktif)
- Internet bağlantısı

## 🔧 Adım Adım Kurulum

### 1️⃣ Python Paketlerini Yükle

```bash
cd r2-uploader
pip install -r requirements.txt
```

### 2️⃣ yt-dlp Yükle

```bash
pip install yt-dlp
```

**veya güncel sürüm için:**

```bash
pip install -U yt-dlp
```

### 3️⃣ Cloudflare R2 Kurulumu

#### A. Cloudflare Dashboard'a Git
- https://dash.cloudflare.com/
- R2 bölümüne git

#### B. Bucket Oluştur
1. "Create bucket" tıkla
2. İsim: `anime-videos` (veya istediğin isim)
3. Location: Automatic
4. "Create bucket" tıkla

#### C. Public Access Aktif Et
1. Bucket'ı aç
2. Settings → Public Access
3. "Allow Access" tıkla
4. Public URL'i kopyala: `https://pub-xxxxx.r2.dev`

#### D. API Token Oluştur
1. R2 → Manage R2 API Tokens
2. "Create API Token" tıkla
3. Permissions:
   - ✅ Object Read & Write
   - ✅ Bucket Read
4. TTL: Forever (veya istediğin süre)
5. "Create API Token" tıkla
6. **Access Key ID** ve **Secret Access Key**'i kopyala (bir daha gösterilmeyecek!)

#### E. Account ID'yi Bul
- Cloudflare Dashboard → R2
- Sağ tarafta "Account ID" göreceksin
- Kopyala

### 4️⃣ .env Dosyası Oluştur

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=abc123def456...           # Account ID'niz
R2_ACCESS_KEY_ID=xyz789...              # API Token Access Key
R2_SECRET_ACCESS_KEY=secret123...       # API Token Secret Key
R2_BUCKET_NAME=anime-videos             # Bucket isminiz
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev  # Public URL

# Aniwatch API (opsiyonel)
ANIWATCH_API_URL=http://localhost:4000
```

### 5️⃣ Bağlantıyı Test Et

```bash
python test_connection.py
```

**Beklenen çıktı:**

```
✅ Environment Variables Test: PASSED
✅ yt-dlp Test: PASSED
✅ R2 Connection Test: PASSED

🎉 All tests passed! You're ready to upload videos.
```

## 🎬 Kullanım

### Tek Bölüm Yükle

```bash
python main.py one-piece-100 1 1
```

**Parametreler:**
- `one-piece-100`: Anime slug (HiAnime'den)
- `1`: Episode ID
- `1`: Episode number

### Batch Upload (Çoklu Bölüm)

**Yöntem 1: Range ile**

`batch_upload.py` dosyasını düzenle:

```python
episodes = create_episode_list(
    anime_slug="one-piece-100",
    start_ep=1,
    end_ep=10  # 1'den 10'a kadar
)
```

Çalıştır:

```bash
python batch_upload.py
```

**Yöntem 2: JSON ile**

`episodes.json` oluştur:

```json
[
  {"anime_slug": "one-piece-100", "episode_id": "1", "episode_number": 1},
  {"anime_slug": "one-piece-100", "episode_id": "2", "episode_number": 2},
  {"anime_slug": "naruto-1", "episode_id": "1", "episode_number": 1}
]
```

`batch_upload.py` düzenle:

```python
episodes = load_episodes_from_json("episodes.json")
```

Çalıştır:

```bash
python batch_upload.py
```

## 📊 Sonuçları Görüntüle

Yükleme sonuçları otomatik kaydedilir:

```bash
# Tek yükleme sonuçları
cat upload_results.json

# Batch yükleme sonuçları
cat batch_results.json
```

## 🔍 Sorun Giderme

### ❌ "R2 Connection Test: FAILED"

**Çözüm:**
1. `.env` dosyasındaki bilgileri kontrol et
2. API Token'ın doğru izinlere sahip olduğundan emin ol
3. Bucket isminin doğru olduğunu kontrol et

### ❌ "yt-dlp Test: FAILED"

**Çözüm:**
```bash
pip install -U yt-dlp
```

### ❌ "Failed to get video URL"

**Çözüm:**
1. HiAnime URL'inin doğru olduğunu kontrol et
2. Episode ID'nin geçerli olduğunu kontrol et
3. Internet bağlantını kontrol et

### ⚠️ "Upload too slow"

**Çözüm:**
- Internet hızını kontrol et
- Chunk size'ı artır (`r2_uploader.py` → `chunk_size`)
- Daha az paralel yükleme yap

## 💡 İpuçları

### 1. Rate Limiting'den Kaçın

Batch upload yaparken delay kullan:

```python
batch_upload_with_delay(episodes, delay_seconds=10)
```

### 2. Disk Alanı Tasarrufu

Script direkt stream yapar, local storage kullanmaz. Sadece altyazılar için ~1MB gerekir.

### 3. Bandwidth Optimizasyonu

R2'nin bandwidth'i ücretsiz, ancak upload için kendi internet hızınız önemli.

### 4. Duplicate Check

Script otomatik olarak R2'de dosya var mı kontrol eder:

```python
if self.uploader.file_exists(r2_key):
    print("Already exists, skipping...")
```

## 📁 Dosya Yapısı

```
r2-uploader/
├── main.py                 # Ana script
├── hianime_downloader.py   # yt-dlp wrapper
├── r2_uploader.py          # R2 upload logic
├── batch_upload.py         # Batch processing
├── test_connection.py      # Connection tests
├── requirements.txt        # Python dependencies
├── .env                    # Your config (create this)
├── .env.example           # Example config
├── README.md              # Documentation
└── SETUP_GUIDE.md         # This file
```

## 🎯 Sonraki Adımlar

1. ✅ Test et: `python test_connection.py`
2. ✅ Tek bölüm yükle: `python main.py one-piece-100 1 1`
3. ✅ Batch yükle: `python batch_upload.py`
4. ✅ Frontend'i güncelle (R2 URL'leri kullan)
5. ✅ Otomasyonu kur (cron job / scheduler)

## 🆘 Yardım

Sorun yaşıyorsan:
1. `test_connection.py` çalıştır
2. Error mesajlarını oku
3. `.env` dosyasını kontrol et
4. Python ve pip versiyonlarını kontrol et

```bash
python --version  # 3.8+
pip --version
```

## 📞 İletişim

Sorularınız için GitHub Issues kullanın.

---

**🎉 Başarılar! Artık kendi anime streaming platformunuz var!**
