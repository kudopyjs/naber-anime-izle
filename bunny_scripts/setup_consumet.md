# 🚀 Consumet API Local Kurulum

## 1. Consumet API'yi İndir

```bash
cd c:\Users\kudre\Desktop\naber-anime-izle
git clone https://github.com/consumet/api.consumet.org.git consumet-api
cd consumet-api
```

## 2. Bağımlılıkları Yükle

```bash
npm install
# veya
yarn install
# veya
pnpm install
```

## 3. Çalıştır

### Development Mode
```bash
npm run dev
# http://localhost:3000
```

### Production Mode
```bash
npm start
# http://localhost:3000
```

## 4. Test Et

```bash
# Anime ara
curl http://localhost:3000/anime/9anime/naruto

# Anime detayı
curl http://localhost:3000/anime/9anime/info?id=one-piece

# Bölüm izle
curl http://localhost:3000/anime/9anime/watch?episodeId=...
```

## 5. Python API'yi Güncelle

`api_server.py` dosyasında Consumet URL'ini değiştir:

```python
# Önceki (public API)
CONSUMET_BASE_URL = "https://api.consumet.org"

# Yeni (local API)
CONSUMET_BASE_URL = "http://localhost:3000"
```

## 🎯 Avantajlar

✅ **Daha Hızlı** - Network latency yok
✅ **Daha Güvenilir** - Rate limit yok
✅ **Özelleştirilebilir** - Kaynak kodu değiştirilebilir
✅ **Offline Çalışma** - İnternet bağlantısı gerekmez (cache ile)

## 📝 Not

- Node.js 18+ gerekli
- Port 3000 kullanılıyor (değiştirilebilir)
- Redis opsiyonel (cache için)
