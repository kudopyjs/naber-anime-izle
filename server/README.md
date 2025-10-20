# Video Proxy Server

Bu sunucu, Cloudflare korumasını bypass ederek video streaming'i mümkün kılar.

## 🚀 Kurulum

```bash
cd server
npm install
```

## ▶️ Çalıştırma

### Development
```bash
npm start
```

### Development (Auto-reload)
```bash
npm run dev
```

Sunucu `http://localhost:5003` adresinde çalışacak.

## 📋 Endpoint'ler

### 1. Video Proxy
```
GET /proxy/video?url=<video_url>
```

Video segment'lerini (`.ts` dosyaları) proxy'den geçirir.

**Örnek:**
```
http://localhost:5003/proxy/video?url=https://example.com/video.ts
```

### 2. Playlist Proxy
```
GET /proxy/playlist?url=<playlist_url>
```

M3U8 playlist dosyasını alır ve içindeki URL'leri proxy URL'lerine çevirir.

**Örnek:**
```
http://localhost:5003/proxy/playlist?url=https://example.com/master.m3u8
```

### 3. Health Check
```
GET /health
```

Sunucunun çalışıp çalışmadığını kontrol eder.

## 🔧 Nasıl Çalışır?

1. **Referer Header:** Video sunucularının gerektirdiği `Referer` header'ını ekler
2. **User-Agent:** Gerçek bir tarayıcı gibi görünmek için User-Agent ekler
3. **CORS Headers:** Frontend'in erişebilmesi için CORS header'larını ekler
4. **Stream Proxy:** Video stream'ini pipe ederek iletir
5. **URL Rewriting:** M3U8 içindeki URL'leri proxy URL'lerine çevirir

## 🌐 Frontend Entegrasyonu

### .env Dosyası
```env
VITE_VIDEO_PROXY_URL=http://localhost:5003
```

### Kullanım
Frontend otomatik olarak proxy'yi kullanacak. `Watch.jsx` dosyasında:

```javascript
const PROXY_URL = import.meta.env.VITE_VIDEO_PROXY_URL || 'http://localhost:5003'
const videoSrc = `${PROXY_URL}/proxy/playlist?url=${encodeURIComponent(originalUrl)}`
```

## 🐛 Sorun Giderme

### Port Zaten Kullanımda
```bash
# Windows
netstat -ano | findstr :5003
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5003 | xargs kill -9
```

### CORS Hatası
Sunucunun çalıştığından emin olun:
```bash
curl http://localhost:5003/health
```

### Video Oynatmıyor
1. Sunucunun çalıştığını kontrol edin
2. Console'da proxy URL'lerini kontrol edin
3. Network sekmesinde istekleri kontrol edin

## 📊 Loglar

Sunucu şu logları gösterir:
- `🎬 Proxying video:` - Video isteği
- `📋 Proxying playlist:` - Playlist isteği
- `❌ Proxy error:` - Hata durumu

## 🚀 Production Deployment

### Heroku
```bash
# Heroku CLI ile
heroku create your-app-name
git subtree push --prefix server heroku main
```

### Vercel
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "video-proxy.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "video-proxy.js"
    }
  ]
}
```

### Railway
```bash
railway login
railway init
railway up
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5003
CMD ["npm", "start"]
```

## ⚙️ Environment Variables

```env
PORT=5003                    # Sunucu portu
NODE_ENV=production          # Production modu
```

## 📝 Notlar

- Sunucu sadece GET isteklerini kabul eder
- Video stream'leri gerçek zamanlı olarak proxy'den geçer
- Bandwidth kullanımı yüksek olabilir
- Rate limiting eklenebilir
- Cache mekanizması eklenebilir

## 🔒 Güvenlik

- CORS sadece gerekli origin'lere izin verilebilir
- Rate limiting eklenebilir
- API key authentication eklenebilir
- Request logging eklenebilir

## 📚 Bağımlılıklar

- `express` - Web framework
- `axios` - HTTP client
- `cors` - CORS middleware
- `nodemon` - Development auto-reload (dev dependency)
