# 🏗️ Anime Streaming Platform - Architecture

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    (React + Tailwind CSS)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vite + React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Home.jsx   │  │  Search.jsx  │  │  Anime.jsx   │          │
│  │  (Trending)  │  │  (Real-time) │  │  (Details)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │              Watch.jsx (Video Player)             │           │
│  │  - HiAnime Redirect (Current)                    │           │
│  │  - R2 Video Player (Future)                      │           │
│  └──────────────────────────────────────────────────┘           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANIWATCH API (Node.js)                        │
│                    http://localhost:4000                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /anime/home  │  │/anime/search │  │/anime/info   │          │
│  │ (Trending)   │  │(Query-based) │  │(Details)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │/anime/episodes│ │/episode-srcs │                             │
│  │(Episode List) │ │(Video URLs)  │                             │
│  └──────────────┘  └──────────────┘                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         HIANIME.TO                               │
│                  (Source: Anime Data)                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🎥 Video Pipeline (R2 Integration)

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIDEO UPLOAD PIPELINE                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: Get Video URL
┌──────────────┐
│  HiAnime.to  │ ──────► yt-dlp ──────► Direct Video URL
└──────────────┘         (Extract)      (m3u8/mp4)

Step 2: Stream to R2
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Direct URL   │ ──────► │ Python Script│ ──────► │ Cloudflare R2│
│ (Streaming)  │  Fetch  │ (No Download)│  Upload │  (Storage)   │
└──────────────┘         └──────────────┘         └──────────────┘

Step 3: Serve to Users
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Cloudflare R2│ ──────► │ CDN (Global) │ ──────► │ User Browser │
│ (Storage)    │  Serve  │ (Fast)       │  Stream │ (Video.js)   │
└──────────────┘         └──────────────┘         └──────────────┘
```

## 🗂️ Project Structure

```
naber-anime-izle/
│
├── anime-streaming-ui/          # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Trending anime
│   │   │   ├── Search.jsx       # Search page
│   │   │   ├── Anime.jsx        # Anime details
│   │   │   └── Watch.jsx        # Video player
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Navigation
│   │   │   ├── Footer.jsx       # Footer
│   │   │   └── AnimeCard.jsx    # Anime card
│   │   └── services/
│   │       └── aniwatchApi.js   # API client
│   └── package.json
│
├── aniwatch-api/                # Backend API (Node.js)
│   ├── src/
│   │   ├── routes/
│   │   │   └── anime.js         # API routes
│   │   └── controllers/
│   │       └── animeController.js
│   └── package.json
│
├── r2-uploader/                 # Video Upload System (Python)
│   ├── main.py                  # Main upload script
│   ├── hianime_downloader.py    # yt-dlp wrapper
│   ├── r2_uploader.py           # R2 upload logic
│   ├── batch_upload.py          # Batch processing
│   ├── test_connection.py       # Connection tests
│   ├── requirements.txt         # Python deps
│   ├── .env                     # Config (create this)
│   ├── README.md                # Documentation
│   └── SETUP_GUIDE.md           # Setup instructions
│
└── docs/
    ├── ARCHITECTURE.md          # This file
    ├── INTEGRATION_SUMMARY.md   # Integration guide
    └── CORS_FIX.md             # CORS solutions
```

## 🔄 Data Flow

### 1. Browse Anime (Home Page)

```
User → Frontend → Aniwatch API → HiAnime → API → Frontend → User
        (React)   (Node.js)      (Scrape)   (JSON) (Display)
```

### 2. Search Anime

```
User Input → Debounce → API Call → HiAnime → Results → Display
  (Type)    (300ms)    (Search)   (Scrape)   (JSON)   (Cards)
```

### 3. Watch Episode (Current - HiAnime Redirect)

```
User Click → Watch.jsx → Generate URL → Redirect → HiAnime
  (Episode)  (React)     (hianime.to)  (New Tab)  (Play)
```

### 4. Watch Episode (Future - R2 Integration)

```
User Click → Check R2 → If Exists → Stream Video
  (Episode)  (API)      (Yes)       (R2 CDN)
                        │
                        └─► If Not → Upload Job → Stream Video
                            (No)     (Python)     (R2 CDN)
```

## 💾 Data Storage

### Current State

```
┌─────────────────────────────────────────┐
│         NO PERSISTENT STORAGE            │
│  All data fetched from HiAnime in        │
│  real-time via Aniwatch API              │
└─────────────────────────────────────────┘
```

### Future State (with R2)

```
┌─────────────────────────────────────────┐
│         CLOUDFLARE R2 STORAGE            │
│                                          │
│  anime-videos/                           │
│  ├── one-piece-100/                      │
│  │   ├── episode-1.mp4                   │
│  │   ├── episode-1.en.srt                │
│  │   ├── episode-2.mp4                   │
│  │   └── ...                             │
│  ├── naruto-1/                           │
│  │   └── ...                             │
│  └── ...                                 │
│                                          │
│  Public URL: https://pub-xxxxx.r2.dev   │
└─────────────────────────────────────────┘
```

## 🚀 Deployment Architecture

### Current (Development)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │  Aniwatch API│     │   HiAnime    │
│ localhost:   │────►│ localhost:   │────►│  hianime.to  │
│   5173       │     │   4000       │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Production (Recommended)

```
┌──────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                       │
│                  (Frontend Hosting)                       │
│                https://yoursite.pages.dev                 │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  CLOUDFLARE WORKERS                       │
│                  (API Proxy/Backend)                      │
│              https://api.yoursite.com                     │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    CLOUDFLARE R2                          │
│                  (Video Storage)                          │
│              https://cdn.yoursite.com                     │
└──────────────────────────────────────────────────────────┘
```

## 🔐 Security Considerations

### API Keys & Secrets

```
Frontend (.env)
├── VITE_API_URL=http://localhost:4000
└── (No sensitive data)

Backend (.env)
├── PORT=4000
└── (No API keys needed - public scraping)

R2 Uploader (.env)
├── R2_ACCOUNT_ID=***
├── R2_ACCESS_KEY_ID=***
├── R2_SECRET_ACCESS_KEY=***
├── R2_BUCKET_NAME=anime-videos
└── R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### CORS Configuration

```javascript
// Backend (aniwatch-api)
app.use(cors({
  origin: ['http://localhost:5173', 'https://yoursite.com'],
  credentials: true
}))

// R2 Bucket
{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"]
}
```

## 📊 Performance Metrics

### Current Performance

| Metric | Value |
|--------|-------|
| **Page Load** | ~1-2s |
| **API Response** | ~500ms-1s |
| **Search Latency** | ~300ms (debounced) |
| **Video Load** | Redirect to HiAnime |

### Expected Performance (with R2)

| Metric | Value |
|--------|-------|
| **Page Load** | ~1-2s |
| **API Response** | ~200-500ms |
| **Video Load** | ~2-5s (CDN) |
| **Bandwidth** | FREE (R2 egress) |

## 💰 Cost Estimation

### Current (Free)

```
Frontend: Cloudflare Pages (Free)
Backend: Cloudflare Workers (Free tier)
Storage: None
Total: $0/month
```

### With R2 (Estimated)

```
Frontend: Cloudflare Pages (Free)
Backend: Cloudflare Workers (Free tier)
Storage: R2 ($0.015/GB/month)
Bandwidth: FREE (R2 egress)

Example: 1000 episodes × 500MB = 500GB
Cost: 500GB × $0.015 = $7.50/month
```

## 🎯 Future Enhancements

### Phase 1: R2 Integration ✅ (Ready)
- [x] Python upload script
- [x] Direct streaming from HiAnime to R2
- [x] Batch upload support
- [ ] Frontend integration

### Phase 2: Database
- [ ] PostgreSQL/Supabase for metadata
- [ ] User accounts & watchlist
- [ ] View history
- [ ] Ratings & reviews

### Phase 3: Advanced Features
- [ ] Recommendation engine
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Offline download

### Phase 4: Monetization
- [ ] Premium subscriptions
- [ ] Ad integration (optional)
- [ ] Affiliate links

## 🔧 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, Aniwatch API |
| **Video Processing** | Python, yt-dlp, boto3 |
| **Storage** | Cloudflare R2 (S3-compatible) |
| **CDN** | Cloudflare CDN (automatic) |
| **Deployment** | Cloudflare Pages + Workers |
| **Video Player** | HTML5 Video / Video.js |

## 📝 Notes

- **Cloudflare Ecosystem**: Entire stack on Cloudflare for best performance
- **No Database**: Currently stateless, all data from HiAnime
- **Scalable**: R2 + CDN can handle millions of requests
- **Cost-Effective**: Free bandwidth with R2
- **Legal**: For personal/educational use only

---

**Last Updated**: 2025-01-20
**Version**: 1.0.0
