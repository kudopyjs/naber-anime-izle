# Video Oynatma Sorunu ve Çözümler

## 🔴 Sorun

Video sunucuları (megacloud, haildrop, vb.) CORS (Cross-Origin Resource Sharing) kısıtlaması uyguluyor ve `Referer` header kontrolü yapıyor. Bu nedenle tarayıcıdan direkt video oynatma engellenebiliyor.

**Hata:**
```
Access to XMLHttpRequest at 'https://haildrop77.pro/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## ✅ Çözümler

### Çözüm 1: Backend Proxy Kullanın (Önerilen)

Backend'de bir proxy endpoint oluşturun:

```javascript
// server/video-proxy.js
const express = require('express');
const axios = require('axios');
const app = express();

app.get('/proxy/video', async (req, res) => {
  const { url, referer } = req.query;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Referer': referer || 'https://megacloud.blog/',
        'User-Agent': 'Mozilla/5.0...'
      },
      responseType: 'stream'
    });
    
    // Headers'ı kopyala
    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });
    
    // CORS header'larını ekle
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Stream'i pipe et
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5003, () => console.log('Video proxy running on :5003'));
```

Frontend'de kullanım:
```javascript
const proxyUrl = `http://localhost:5003/proxy/video?url=${encodeURIComponent(videoUrl)}&referer=${encodeURIComponent(referer)}`;
hls.loadSource(proxyUrl);
```

### Çözüm 2: Browser Extension Kullanın

**CORS Unblock** gibi bir tarayıcı eklentisi kullanın (sadece development için):
- Chrome: "CORS Unblock" veya "Allow CORS"
- Firefox: "CORS Everywhere"

⚠️ **Dikkat:** Bu sadece development için! Production'da kullanmayın.

### Çözüm 3: HiAnime'de İzle Linki

Kullanıcıyı direkt HiAnime'ye yönlendirin:
```
https://hianime.to/watch/one-piece-100?ep=2142
```

Bu şu anda uygulamada mevcut (sarı uyarı mesajı).

### Çözüm 4: Cloudflare Worker Proxy

Cloudflare Worker kullanarak bir proxy oluşturun:

```javascript
// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  const referer = url.searchParams.get('referer')
  
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }
  
  const response = await fetch(targetUrl, {
    headers: {
      'Referer': referer || 'https://megacloud.blog/',
      'User-Agent': request.headers.get('User-Agent')
    }
  })
  
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  
  return newResponse
}
```

Deploy:
```bash
wrangler deploy
```

### Çözüm 5: Nginx Reverse Proxy

Production'da Nginx kullanarak proxy:

```nginx
location /video-proxy/ {
    proxy_pass https://haildrop77.pro/;
    proxy_set_header Referer "https://megacloud.blog/";
    proxy_set_header User-Agent "Mozilla/5.0...";
    
    # CORS headers
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
    
    # Cache
    proxy_cache video_cache;
    proxy_cache_valid 200 1h;
}
```

## 🎯 Önerilen Yaklaşım

**Development:**
- CORS browser extension kullanın (hızlı test için)
- Veya HiAnime linkini kullanın

**Production:**
- Backend proxy (Node.js/Express) - En güvenilir
- Veya Cloudflare Worker - Ücretsiz ve hızlı
- Veya Nginx reverse proxy - Sunucu kontrolü varsa

## 📝 Notlar

1. Video sunucuları sürekli değişebilir (haildrop, sunshinerays, vb.)
2. Referer kontrolü her sunucuda farklı olabilir
3. Rate limiting olabilir
4. IP bazlı kısıtlamalar olabilir

## 🔧 Mevcut Durum

Şu anda uygulama:
- ✅ HLS.js ile video oynatmayı deniyor
- ✅ CORS hatası durumunda kullanıcıya bilgi veriyor
- ✅ HiAnime'de izle linki sunuyor
- ❌ Backend proxy henüz yok (eklenebilir)

## 🚀 Sonraki Adımlar

1. Backend proxy endpoint'i ekleyin (`server/video-proxy.js`)
2. Frontend'de proxy URL'ini kullanın
3. Production'da Cloudflare Worker veya Nginx kullanın
4. Rate limiting ve caching ekleyin
