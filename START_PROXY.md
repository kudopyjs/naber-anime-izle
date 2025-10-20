# 🚀 Proxy Server Başlatma

## Hızlı Başlatma

```bash
cd server
node hianime_proxy.js
```

## Özellikler

✅ **Ultra-Strong Cloudflare Bypass**
- 5 farklı User-Agent rotation
- Dynamic Origin/Referer (sunburst, haildrop)
- SSL certificate bypass
- 3 retry attempts
- 1 saniye retry delay

✅ **Advanced CORS Bypass**
- All origins allowed
- All headers exposed
- Credentials support

✅ **Smart Headers**
- Otomatik origin detection
- Video URL'e göre referer
- Range requests support

## Test

```bash
# Health check
curl http://localhost:5000/health

# Proxy test
curl "http://localhost:5000/proxy?url=https://sunburst93.live/test.m3u8"
```

## Logs

Server şu bilgileri gösterir:
- 🎬 Proxying video: [URL]
- 🔓 Using headers: [Origin, Referer, User-Agent]
- 📊 Range request: [Range]
- ⚠️ Retry X/3 after error: [Error]
- ✅ Streaming started

## Sorun Giderme

### 403 Forbidden
- User-Agent rotation devrede
- Origin/Referer otomatik ayarlanıyor
- 3 retry attempt yapılıyor

### Timeout
- 60 saniye timeout
- Retry mekanizması var
- SSL bypass aktif

### CORS
- Tüm originler izinli
- Credentials support var
- Headers exposed

## Production

Production'da:
1. Rate limiting ekle
2. Specific origins kullan
3. API key protection
4. Logging/monitoring

## Restart

Değişiklik yaptıysan restart et:
```bash
# Ctrl+C ile durdur
# Tekrar başlat
node hianime_proxy.js
```
