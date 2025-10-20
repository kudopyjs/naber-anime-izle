# HiAnime Video Streaming Kurulum Rehberi

Bu rehber, aniwatch-api kullanarak HiAnime videolarını kendi sitenizde nasıl yayınlayacağınızı gösterir.

## 🎯 Sorun ve Çözüm

### ❌ Sorun
- HiAnime.to'yu iframe ile yüklemeye çalışıyordunuz
- CORS hatası alıyordunuz: `Access to XMLHttpRequest at 'https://hianime.to/ajax/login-state' from origin 'http://localhost:5001' has been blocked by CORS policy`
- HiAnime.to, iframe embedding'e izin vermiyor

### ✅ Çözüm
1. **Aniwatch API** kullanarak video kaynaklarını alıyoruz
2. **Proxy sunucu** ile CORS sorununu aşıyoruz
3. **HLS.js** ile videoları kendi sitemizde oynatıyoruz

## 📋 Gereksinimler

1. **Node.js** (v18 veya üzeri)
2. **Aniwatch API** (zaten kurulu: `aniwatch-api/`)
3. **Proxy Server** (zaten mevcut: `server/hianime_proxy.js`)

## 🚀 Kurulum Adımları

### 1. Aniwatch API'yi Başlatın

```powershell
cd aniwatch-api
npm install
npm start
```

API şu adreste çalışacak: `http://localhost:4000`

**Test edin:**
```powershell
curl http://localhost:4000/health
# Yanıt: "daijoubu"
```

### 2. Proxy Sunucusunu Başlatın

Yeni bir terminal açın:

```powershell
cd server
npm install
node hianime_proxy.js
```

Proxy şu adreste çalışacak: `http://localhost:5000`

**Test edin:**
```powershell
curl http://localhost:5000/health
```

### 3. HTML Sayfasını Açın

`html/public_html/watch-new.html` dosyasını bir web sunucusu ile açın.

**Seçenek 1: Python ile**
```powershell
cd html/public_html
python -m http.server 5001
```

**Seçenek 2: Node.js http-server ile**
```powershell
cd html/public_html
npx http-server -p 5001 --cors
```

Tarayıcıda açın: `http://localhost:5001/watch-new.html?anime=one-piece-100&ep=2146`

## 🎬 Kullanım

### URL Parametreleri

- `anime`: Anime ID (örn: `one-piece-100`, `naruto-shippuden-355`)
- `ep`: Episode ID (opsiyonel, belirtilmezse ilk bölüm oynatılır)

### Örnekler

```
http://localhost:5001/watch-new.html?anime=one-piece-100&ep=2146
http://localhost:5001/watch-new.html?anime=attack-on-titan-112
http://localhost:5001/watch-new.html?anime=demon-slayer-kimetsu-no-yaiba-47&ep=1251
```

### Anime ID Nasıl Bulunur?

1. HiAnime.to'da anime arayın
2. URL'den anime ID'yi alın
   - Örnek: `https://hianime.to/watch/one-piece-100?ep=2146`
   - Anime ID: `one-piece-100`
   - Episode ID: `2146`

## 🔧 API Endpoints

### Aniwatch API (Port 4000)

```javascript
// Anime bilgisi
GET /api/v2/hianime/anime/{animeId}

// Bölümler listesi
GET /api/v2/hianime/anime/{animeId}/episodes

// Video kaynakları
GET /api/v2/hianime/episode/sources?animeEpisodeId={episodeId}&server=vidstreaming&category=sub

// Arama
GET /api/v2/hianime/search?q={query}&page=1
```

### Proxy Server (Port 5000)

```javascript
// Video proxy
GET /proxy?url={encodedVideoUrl}

// Health check
GET /health
```

## 🎨 Özellikler

### ✅ Mevcut Özellikler

- ✅ HLS video streaming
- ✅ Otomatik bölüm listesi
- ✅ Sub/Dub seçimi
- ✅ Responsive tasarım
- ✅ Modern UI (Tailwind CSS)
- ✅ Loading ve error handling
- ✅ Episode navigation

### 🔄 Gelecek Özellikler (Eklenebilir)

- Quality selector (720p, 1080p, etc.)
- Subtitle support
- Auto-play next episode
- Watch history
- Favorites list
- Search functionality
- Anime recommendations

## 🐛 Sorun Giderme

### Video Yüklenmiyor

**1. API çalışıyor mu kontrol edin:**
```powershell
curl http://localhost:4000/health
```

**2. Proxy çalışıyor mu kontrol edin:**
```powershell
curl http://localhost:5000/health
```

**3. Console'da hata var mı kontrol edin:**
- Tarayıcıda F12 ile Developer Tools'u açın
- Console sekmesine bakın
- Network sekmesinde başarısız istekleri kontrol edin

### CORS Hatası

Eğer hala CORS hatası alıyorsanız:

1. Proxy sunucusunun çalıştığından emin olun
2. HTML dosyasındaki API URL'lerini kontrol edin:
   ```javascript
   const CONFIG = {
       ANIWATCH_API: 'http://localhost:4000/api/v2/hianime',
       PROXY_SERVER: 'http://localhost:5000'
   };
   ```

### Video Kaynağı Bulunamadı

Bazı animelerde bazı bölümler eksik olabilir. Farklı bir bölüm deneyin veya farklı bir server seçin.

## 📝 Notlar

### Sunucu Seçenekleri

Aniwatch API şu sunucuları destekler:
- `vidstreaming` (varsayılan, en stabil)
- `megacloud`
- `streamsb`
- `streamtape`

HTML dosyasında sunucu değiştirmek için:
```javascript
let currentServer = 'megacloud'; // veya 'vidstreaming', 'streamsb', etc.
```

### Kategori Seçenekleri

- `sub`: Altyazılı (varsayılan)
- `dub`: İngilizce dublaj
- `raw`: Ham (altyazısız)

## 🔒 Güvenlik Notları

1. **Production'da kullanım için:**
   - Rate limiting ekleyin
   - API key authentication ekleyin
   - HTTPS kullanın
   - Origin kontrolü yapın

2. **Proxy sunucusu:**
   - Sadece güvenilir kaynaklara izin verin
   - Request logging ekleyin
   - Bandwidth limitleri koyun

## 📚 Ek Kaynaklar

- [Aniwatch API Dökümantasyonu](https://github.com/ghoshRitesh12/aniwatch-api)
- [HLS.js Dökümantasyonu](https://github.com/video-dev/hls.js/)
- [HiAnime.to](https://hianime.to)

## 🎉 Başarılı Kurulum Kontrolü

Eğer her şey doğru çalışıyorsa:

1. ✅ Aniwatch API çalışıyor (port 4000)
2. ✅ Proxy server çalışıyor (port 5000)
3. ✅ HTML sayfası açılıyor (port 5001)
4. ✅ Video oynatılıyor
5. ✅ Bölüm listesi görünüyor
6. ✅ Sub/Dub değiştirme çalışıyor

## 💡 İpuçları

1. **Hızlı test için:** One Piece gibi popüler bir anime kullanın
2. **Episode ID'yi bilmiyorsanız:** Sadece anime ID'yi verin, ilk bölüm otomatik yüklenecek
3. **Farklı serverlar deneyin:** Bir server çalışmazsa başka bir server deneyin
4. **Console logları:** Debugging için console'u açık tutun

## 🤝 Katkıda Bulunma

Sorun yaşarsanız veya öneriniz varsa:
1. Console loglarını kontrol edin
2. Network sekmesinde API isteklerini inceleyin
3. Hata mesajlarını kaydedin

---

**Son Güncelleme:** 2025-01-20
**Versiyon:** 1.0.0
