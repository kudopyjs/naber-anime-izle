# 🎬 HiAnime Direct Streaming Guide

## 📋 Özet

HiAnime'den **direkt stream** yaparak sitede video izleme sistemi. R2'ye yükleme yok, Cloudflare bypass ile direkt streaming!

## 🏗️ Mimari

```
User → Frontend → Proxy Server → HiAnime Servers
                      ↓
              Cloudflare Bypass
              CORS Bypass
              Range Requests
```

## 🚀 Başlatma

### 1️⃣ Proxy Server (Port 5000)

```bash
cd server
npm run hianime
```

**Çıktı:**
```
============================================================
🚀 HiAnime Video Proxy Server
============================================================
✅ Server running on http://localhost:5000
📺 Proxy endpoint: http://localhost:5000/proxy?url=<video_url>
🔍 Video info: POST http://localhost:5000/get-video-info
💚 Health check: http://localhost:5000/health
============================================================
```

### 2️⃣ Aniwatch API (Port 4000)

```bash
cd aniwatch-api
npm start
```

### 3️⃣ Frontend (Port 5173)

```bash
cd anime-streaming-ui
npm run dev
```

## 🎯 Özellikler

### ✅ Cloudflare Bypass
- Advanced browser headers
- Cookie handling
- Retry mechanism
- 5 retry attempts

### ✅ CORS Bypass
- `Access-Control-Allow-Origin: *`
- All headers exposed
- Credentials support

### ✅ Video Streaming
- Range requests (seek desteği)
- HLS streaming
- M3U8 support
- Auto quality selection

### ✅ Frontend
- Native HTML5 video player
- Auto next episode
- Episode list
- Poster images

## 📁 Dosya Yapısı

```
server/
  ├── hianime_proxy.js       # Proxy server (Cloudflare bypass)
  ├── .env                   # PROXY_PORT=5000
  └── package.json

anime-streaming-ui/
  ├── src/
  │   ├── components/
  │   │   └── SimpleVideoPlayer.jsx  # HTML5 video player
  │   └── pages/
  │       └── Watch.jsx              # Video izleme sayfası
  └── .env.local             # VITE_PROXY_URL=http://localhost:5000
```

## 🔧 Yapılandırma

### server/.env
```bash
PROXY_PORT=5000
ANIWATCH_API_URL=http://localhost:4000
```

### anime-streaming-ui/.env.local
```bash
VITE_PROXY_URL=http://localhost:5000
VITE_API_URL=http://localhost:4000
```

## 🎬 Kullanım

1. **Anime seç** → Ana sayfadan anime seç
2. **Bölüm seç** → İzlemek istediğin bölümü seç
3. **İzle** → Video otomatik yüklenir ve oynatılır!

## 🔍 API Endpoints

### GET /proxy
Video stream proxy

**Query:**
- `url`: Video URL (encoded)

**Örnek:**
```
GET /proxy?url=https%3A%2F%2Fhaildrop77.pro%2F...
```

### POST /get-video-info
Video kaynakları al

**Body:**
```json
{
  "animeId": "one-piece-100",
  "episodeId": "2142"
}
```

**Response:**
```json
{
  "sources": [
    {
      "url": "/proxy?url=...",
      "quality": "1080p"
    }
  ]
}
```

### GET /health
Server durumu

**Response:**
```json
{
  "status": "ok",
  "service": "HiAnime Video Proxy",
  "timestamp": "2025-10-20T19:30:00.000Z"
}
```

## 🐛 Troubleshooting

### Video oynatmıyor
1. Proxy server çalışıyor mu? → `http://localhost:5000/health`
2. Aniwatch API çalışıyor mu? → `http://localhost:4000/api/v2/hianime/home`
3. Console'da hata var mı? → F12 → Console

### 403 Forbidden
- Cloudflare bypass çalışmıyor
- Headers kontrol et
- Retry mekanizması devreye girecek

### CORS Error
- Proxy server kullanıldığından emin ol
- `useProxy={true}` olmalı
- VITE_PROXY_URL doğru mu?

## 📊 Performans

- **İlk yükleme:** ~2-3 saniye
- **Seek (atlama):** Anında (range requests)
- **Buffer:** Otomatik
- **Kalite:** 1080p (max)

## 🎉 Avantajlar

✅ **R2'ye yükleme yok** - Direkt stream  
✅ **Hızlı** - Anında oynatma  
✅ **Cloudflare bypass** - Güçlü bypass  
✅ **CORS bypass** - Tam destek  
✅ **Range requests** - Seek desteği  
✅ **Auto next** - Otomatik sonraki bölüm  

## 🔒 Güvenlik

- CORS sadece development için `*`
- Production'da specific origins kullan
- Rate limiting eklenebilir
- API key koruması eklenebilir

## 📝 Notlar

- Proxy server **localhost**'ta çalışıyor
- Production için domain gerekli
- Cloudflare bypass sürekli güncellenmeli
- HiAnime API değişirse güncelleme gerekir

## 🚀 Production Deployment

### Proxy Server
```bash
# Heroku, Railway, Render, etc.
cd server
npm install
npm run hianime
```

### Frontend
```bash
# Vercel, Netlify, etc.
cd anime-streaming-ui
npm run build
```

**Environment Variables:**
```
VITE_PROXY_URL=https://your-proxy-server.com
VITE_API_URL=https://your-aniwatch-api.com
```

## 🎯 Sonuç

Artık HiAnime'den direkt stream yaparak sitende video izleyebilirsin! 🎉

**Test için:**
1. `cd server && npm run hianime`
2. `cd aniwatch-api && npm start`
3. `cd anime-streaming-ui && npm run dev`
4. http://localhost:5173 → Anime seç → İzle!
