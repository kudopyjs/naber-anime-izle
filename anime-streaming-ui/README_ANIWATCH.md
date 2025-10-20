# Aniwatch API Entegrasyonu - Hızlı Başlangıç

## 🎯 Özet

Bu uygulama artık anime verilerini **hianime.to**'dan [aniwatch-api](https://github.com/ghoshRitesh12/aniwatch-api) üzerinden çekiyor.

## ⚡ Hızlı Kurulum

### 1. Aniwatch API'yi Başlatın

```bash
# Ana dizinde (naber-anime-izle/)
cd aniwatch-api
npm install
cp .env.example .env
npm start
```

API `http://localhost:4000` adresinde çalışacak.

### 2. Frontend'i Yapılandırın

`anime-streaming-ui/.env` dosyasını oluşturun veya güncelleyin:

```env
VITE_ANIWATCH_API_URL=http://localhost:4000
```

### 3. Frontend'i Başlatın

```bash
cd anime-streaming-ui
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışacak.

## 🎬 Nasıl Çalışır?

### Ana Sayfa
- Hianime.to'dan trending, popular ve latest animeleri gösterir
- Spotlight anime'ler büyük banner olarak gösterilir

### Anime Detay Sayfası
- Anime bilgileri, açıklama, türler
- Tüm bölümlerin listesi
- Önerilen animeler

### İzleme Sayfası
- HLS formatında video streaming
- Altyazı ve dublaj seçenekleri
- Çoklu sunucu desteği (HD-1, HD-2, Vidstreaming, vb.)
- VTT formatında altyazılar

### Arama
- Gerçek zamanlı arama önerileri
- Anime poster ve bilgileri

## 🔧 Önemli Dosyalar

### Servis
- `src/services/aniwatchApi.js` - Tüm API çağrıları

### Sayfalar
- `src/pages/Home.jsx` - Ana sayfa
- `src/pages/AnimeDetail.jsx` - Anime detay sayfası
- `src/pages/Watch.jsx` - Video oynatma sayfası

### Componentler
- `src/components/SearchBar.jsx` - Arama çubuğu
- `src/components/AnimeCard.jsx` - Anime kartı
- `src/components/CategoryRow.jsx` - Anime kategorisi satırı

## 📋 API Endpoint Örnekleri

### Ana Sayfa Verileri
```javascript
const homeData = await aniwatchApi.getHomePage()
// spotlightAnimes, trendingAnimes, mostPopularAnimes, vb.
```

### Anime Detayları
```javascript
const animeData = await aniwatchApi.getAnimeInfo('attack-on-titan-112')
// anime.info, anime.moreInfo, recommendedAnimes, vb.
```

### Bölümler
```javascript
const episodes = await aniwatchApi.getAnimeEpisodes('attack-on-titan-112')
// episodes: [{ number, title, episodeId, isFiller }]
```

### Streaming Linkleri
```javascript
const streamData = await aniwatchApi.getEpisodeStreamingLinks(
  'attack-on-titan-112?ep=1',
  'hd-1',
  'sub'
)
// sources: [{ url, quality }], subtitles: [{ lang, url }]
```

### Arama
```javascript
const results = await aniwatchApi.searchAnime('naruto', 1)
// animes: [{ id, name, poster, episodes, type }]
```

## 🎨 URL Yapısı

### Anime Detay
```
/anime/{animeId}
Örnek: /anime/attack-on-titan-112
```

### Video İzleme
```
/watch/{animeId}/{episodeId}
Örnek: /watch/attack-on-titan-112/attack-on-titan-112?ep=1
```

## 🐛 Sorun Giderme

### API Bağlantı Hatası
```
Error: Failed to fetch
```
**Çözüm:** Aniwatch API'nin çalıştığından emin olun (`http://localhost:4000`)

### Video Oynatmıyor
**Çözüm:** 
1. Tarayıcı console'unu kontrol edin (F12)
2. Farklı bir sunucu seçin (HD-1, HD-2, vb.)
3. Altyazı/Dublaj kategorisini değiştirin

### CORS Hatası
**Çözüm:** Aniwatch API'nin CORS ayarlarını kontrol edin

## 📚 Daha Fazla Bilgi

- [Ana Dökümantasyon](../ANIWATCH_INTEGRATION.md)
- [Aniwatch API GitHub](https://github.com/ghoshRitesh12/aniwatch-api)
- [Aniwatch API Dökümantasyonu](https://github.com/ghoshRitesh12/aniwatch-api#documentation)

## 🚀 Production

Production için Aniwatch API'yi deploy edin ve `.env` dosyasını güncelleyin:

```env
VITE_ANIWATCH_API_URL=https://your-aniwatch-api.com
```

## 💡 Özellikler

✅ Hianime.to'dan gerçek anime verileri
✅ HLS video streaming
✅ Çoklu sunucu desteği
✅ Altyazı desteği
✅ Gerçek zamanlı arama
✅ Önerilen animeler
✅ Filler bölüm işaretleme
✅ Responsive tasarım
✅ Modern UI/UX
