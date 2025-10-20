# 🎬 Anime Streaming Platform

Consumet (9anime) + AI altyazı çevirisi ile direkt stream

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle
```bash
pip install -r requirements.txt
```

### 2. Environment Ayarları
`.env` dosyası oluşturun:
```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...  # Opsiyonel (ücretsiz)
```

### 3. Anime Veritabanını Oluştur
```bash
python consumet_scraper.py
# Çıktı: anime-database.json (~10,000+ anime)
```

### 4. API Sunucusunu Başlat
```bash
python api_server.py
# http://localhost:8000
```

### 5. Frontend (Ayrı Proje)
```bash
cd anime-streaming-ui
npm install
npm start
```

## 📡 API Endpoints

### Anime Listesi
```http
GET /api/anime/list?search=naruto&provider=all&limit=50
```

**Response:**
```json
{
  "total": 1,
  "results": [
    {
      "id": "naruto",
      "title": "Naruto",
      "sources": [
        {
          "provider": "turkanime",
          "language": "tr",
          "type": "hard-sub"
        },
        {
          "provider": "9anime",
          "language": "en",
          "type": "soft-sub"
        }
      ]
    }
  ]
}
```

### Anime Detayı
```http
GET /api/anime/naruto
```

### Bölüm Kaynakları
```http
GET /api/anime/naruto/episode/1
```

**Response:**
```json
{
  "anime": "Naruto",
  "episode": 1,
  "sources": [
    {
      "provider": "turkanime",
      "url": "https://sibnet.ru/...",
      "quality": "1080p",
      "language": "turkish",
      "subtitle": "hard-coded"
    },
    {
      "provider": "9anime",
      "url": "https://...m3u8",
      "quality": "1080p",
      "language": "english",
      "subtitle": "soft",
      "type": "m3u8"
    }
  ],
  "subtitles": [
    {
      "lang": "English",
      "url": "https://...ass",
      "type": "original"
    },
    {
      "lang": "Turkish",
      "url": "/api/subtitle/translate?url=...&lang=tr",
      "type": "AI-Translated"
    }
  ]
}
```

### Video Proxy (CORS Bypass)
```http
GET /api/proxy/video?url=https://sibnet.ru/...
```

### Altyazı Çevirisi
```http
GET /api/subtitle/translate?url=https://...ass&lang=tr
```

## 🎯 Özellikler

✅ **Consumet/9anime**
- 10,000+ anime
- İngilizce + soft-sub
- M3U8/HLS streaming
- 720p, 1080p kalite

✅ **AI Altyazı Çevirisi**
- Kontekst korunur (kitap formatı)
- GPT-3.5 / GPT-4 / Gemini
- Timing korunur
- Türkçe'ye otomatik çeviri

✅ **Storage YOK**
- Direkt stream
- Bandwidth tasarrufu
- Sıfır hosting maliyeti

✅ **CORS Bypass**
- Video proxy endpoint

## 💰 Maliyet

### AI Çeviri (Bölüm Başına)
- **GPT-3.5:** ~$0.02
- **GPT-4:** ~$0.50
- **Gemini Pro:** ÜCRETSİZ ⭐

### Örnek Hesap
- 1 anime = 200 bölüm
- GPT-3.5 ile = 200 × $0.02 = **$4**
- **Gemini ile = $0** 🎉

## 🏗️ Mimari

```
Kullanıcı
  ↓
Frontend (React + Video.js)
  ↓
Backend API (FastAPI)
  ↓
  ├─ Consumet/9anime (İngilizce + soft-sub)
  └─ AI Çeviri (GPT/Gemini) → Türkçe altyazı
```

## 📦 Dosya Yapısı

```
bunny_scripts/
├── consumet_scraper.py        # Consumet scraper
├── api_server.py              # FastAPI backend
├── anime-database.json        # Anime veritabanı (~10K anime)
├── requirements.txt
├── README.md
└── .env
```

## 🔧 Geliştirme

### Test
```bash
# API test
curl http://localhost:8000/api/anime/list

# Altyazı çevirisi test
curl "http://localhost:8000/api/subtitle/translate?url=...&lang=tr"
```

### Production
```bash
# Gunicorn ile
gunicorn api_server:app -w 4 -k uvicorn.workers.UvicornWorker

# Docker ile
docker build -t anime-api .
docker run -p 8000:8000 anime-api
```

## 📝 TODO

- [ ] Redis cache (çeviri sonuçları)
- [ ] Rate limiting
- [ ] User authentication
- [ ] Watchlist/favorites
- [ ] MAL/AniList sync
- [ ] Gogoanime entegrasyonu
- [ ] Batch altyazı çevirisi

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun
3. Commit yapın
4. Push edin
5. Pull request açın

## 📄 Lisans

MIT

## 🙏 Teşekkürler

- TürkAnime
- Consumet API
- OpenAI
- Google Gemini
