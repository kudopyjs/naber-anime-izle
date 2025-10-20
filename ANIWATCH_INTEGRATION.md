# Aniwatch API Entegrasyonu

Bu proje artık anime verilerini ve streaming linklerini [aniwatch-api](https://github.com/ghoshRitesh12/aniwatch-api) üzerinden hianime.to'dan alıyor.

## 🎯 Yapılan Değişiklikler

### 1. Aniwatch API Servisi
**Dosya:** `anime-streaming-ui/src/services/aniwatchApi.js`

Tüm aniwatch-api endpoint'lerini kapsayan bir servis modülü oluşturuldu:
- `getHomePage()` - Ana sayfa verileri
- `getAnimeInfo(animeId)` - Anime detayları
- `searchAnime(query, page, filters)` - Anime arama
- `getSearchSuggestions(query)` - Arama önerileri
- `getAnimeEpisodes(animeId)` - Bölüm listesi
- `getEpisodeServers(episodeId)` - Mevcut sunucular
- `getEpisodeStreamingLinks(episodeId, server, category)` - Streaming linkleri
- `getAnimesByGenre(genre, page)` - Türe göre animeler
- `getAnimesByCategory(category, page)` - Kategoriye göre animeler

### 2. Güncellenen Sayfalar

#### Home.jsx
- Aniwatch API'den ana sayfa verilerini çekiyor
- Spotlight, trending, popular, latest animeleri gösteriyor
- Anime kartları hianime ID'leri kullanıyor

#### AnimeDetail.jsx
- Anime detaylarını aniwatch API'den alıyor
- Bölüm listesini gösteriyor
- Önerilen animeleri gösteriyor
- Filler bölümleri işaretliyor

#### Watch.jsx
- Episode streaming linklerini aniwatch API'den alıyor
- HLS video player ile oynatıyor
- Altyazı ve dublaj seçenekleri
- Sunucu seçimi (hd-1, vidstreaming, megacloud, vb.)
- Altyazı desteği (.vtt formatında)

#### SearchBar.jsx
- Gerçek zamanlı arama önerileri
- Debounce ile optimize edilmiş API çağrıları
- Anime poster ve bilgileri ile zengin öneri kartları

### 3. Güncellenen Componentler

#### AnimeCard.jsx
- Anime ID'leri direkt kullanılıyor (slug yerine)
- Bölüm sayısı gösterimi
- Anime tipi gösterimi (TV, Movie, OVA, vb.)

#### CategoryRow.jsx
- Aniwatch API veri yapısına uyumlu
- Poster alanı desteği

## 🚀 Kurulum

### 1. Aniwatch API'yi Submodule Olarak Ekleme
```bash
cd naber-anime-izle
git submodule add https://github.com/ghoshRitesh12/aniwatch-api
```

### 2. Aniwatch API Kurulumu
```bash
cd aniwatch-api
npm install
```

### 3. Aniwatch API Yapılandırması
`.env` dosyası oluşturun:
```bash
cp .env.example .env
```

`.env` içeriği:
```env
ANIWATCH_API_PORT=4000
ANIWATCH_API_DEPLOYMENT_ENV="nodejs"
```

### 4. Aniwatch API'yi Başlatma
```bash
npm start
```

API şu adreste çalışacak: `http://localhost:4000`

### 5. Frontend Yapılandırması
`anime-streaming-ui/.env` dosyasına ekleyin:
```env
VITE_ANIWATCH_API_URL=http://localhost:4000
```

### 6. Frontend'i Başlatma
```bash
cd anime-streaming-ui
npm install
npm run dev
```

## 📋 API Endpoint'leri

### Ana Sayfa
```
GET /api/v2/hianime/home
```

### Anime Detayları
```
GET /api/v2/hianime/anime/{animeId}
```

### Bölümler
```
GET /api/v2/hianime/anime/{animeId}/episodes
```

### Streaming Linkleri
```
GET /api/v2/hianime/episode/sources?animeEpisodeId={episodeId}&server={server}&category={category}
```

### Arama
```
GET /api/v2/hianime/search?q={query}&page={page}
```

### Arama Önerileri
```
GET /api/v2/hianime/search/suggestion?q={query}
```

## 🎬 Video Oynatma

Video oynatma artık HLS (HTTP Live Streaming) formatında çalışıyor:
- M3U8 playlist dosyaları
- Adaptif kalite seçimi
- VTT formatında altyazılar
- Çoklu sunucu desteği

### Desteklenen Sunucular
- `hd-1` (HD-1)
- `hd-2` (HD-2)
- `vidstreaming` (Vidstreaming)
- `megacloud` (Megacloud)
- `streamsb` (StreamSB)

### Kategoriler
- `sub` - Altyazılı
- `dub` - Dublajlı
- `raw` - Ham (altyazısız)

## 🔄 URL Yapısı

### Eski Format
```
/anime/{anime-slug}
/watch/{anime-slug}/{season}/{episode}
```

### Yeni Format
```
/anime/{animeId}
/watch/{animeId}/{episodeId}
```

**Örnek:**
- Anime: `/anime/attack-on-titan-112`
- Bölüm: `/watch/attack-on-titan-112/attack-on-titan-112?ep=1`

## 🎨 Özellikler

### Ana Sayfa
- ✅ Spotlight animeler (büyük banner)
- ✅ Trend animeler
- ✅ Popüler animeler
- ✅ Son eklenenler
- ✅ TV serileri
- ✅ Filmler

### Anime Detay Sayfası
- ✅ Anime bilgileri (açıklama, tür, yıl, durum)
- ✅ Bölüm listesi
- ✅ Filler bölüm işaretleme
- ✅ Önerilen animeler
- ✅ İlgili animeler

### İzleme Sayfası
- ✅ HLS video player
- ✅ Altyazı desteği
- ✅ Sunucu seçimi
- ✅ Altyazı/Dublaj seçimi
- ✅ Önceki/Sonraki bölüm navigasyonu
- ✅ Bölüm listesi

### Arama
- ✅ Gerçek zamanlı öneriler
- ✅ Anime poster gösterimi
- ✅ Debounce optimizasyonu

## 🐛 Bilinen Sorunlar

### Video Oynatma
Bazı tarayıcılar HLS formatını doğal olarak desteklemeyebilir. Bu durumda:
- Chrome/Edge: Genellikle sorunsuz çalışır
- Firefox: Sorunsuz çalışır
- Safari: Native HLS desteği var

### CORS Sorunları
Aniwatch API'nin CORS ayarlarının doğru yapılandırıldığından emin olun.

## 📚 Dökümantasyon

Daha fazla bilgi için:
- [Aniwatch API GitHub](https://github.com/ghoshRitesh12/aniwatch-api)
- [Aniwatch API Dökümantasyonu](https://github.com/ghoshRitesh12/aniwatch-api#documentation)

## 🔧 Geliştirme

### Debug Modu
Development modunda (`npm run dev`), Watch sayfasında debug bilgileri gösterilir:
- Episode ID
- Seçili sunucu
- Kategori (sub/dub)
- Streaming URL'leri
- Altyazı sayısı

### API Yanıtları
Tüm API çağrıları console'da loglanır. F12 ile Developer Tools'u açarak görebilirsiniz.

## 🚀 Production Deployment

### 1. Aniwatch API'yi Deploy Edin
Vercel, Render, Railway veya kendi sunucunuzda deploy edebilirsiniz.

### 2. Frontend .env Güncelleyin
```env
VITE_ANIWATCH_API_URL=https://your-aniwatch-api-domain.com
```

### 3. Build ve Deploy
```bash
cd anime-streaming-ui
npm run build
```

## 💡 İpuçları

1. **Hızlı Geliştirme**: Aniwatch API'yi bir kez başlatın, frontend'i geliştirirken çalışır durumda bırakın.

2. **Cache**: Aniwatch API yanıtları cache'lenebilir (Redis, memory cache, vb.)

3. **Rate Limiting**: Production'da rate limiting ekleyin.

4. **Error Handling**: API hataları için fallback mekanizmaları ekleyin.

5. **Loading States**: Tüm sayfalarda loading state'leri mevcut.

## 📝 Lisans

Bu proje MIT lisansı altındadır. Aniwatch API'nin kendi lisansı vardır.
