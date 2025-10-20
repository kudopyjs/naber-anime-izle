# CORS Hatası Çözümü

## 🔴 Hata
```
Access to fetch at 'http://localhost:4000/api/v2/hianime/home' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Çözüm: Aniwatch API'de CORS'u Etkinleştirin

### Adım 1: Aniwatch API `.env` Dosyasını Düzenleyin

`aniwatch-api/.env` dosyasını açın (yoksa `.env.example`'dan kopyalayın):

```bash
cd aniwatch-api
cp .env.example .env
```

### Adım 2: CORS Ayarlarını Ekleyin

`.env` dosyasına şunu ekleyin veya güncelleyin:

```env
# Port
ANIWATCH_API_PORT=4000

# CORS - Localhost için
ANIWATCH_API_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Deployment Environment
ANIWATCH_API_DEPLOYMENT_ENV="nodejs"
```

**Önemli:** `ANIWATCH_API_CORS_ALLOWED_ORIGINS` satırındaki `<>` işaretlerini kaldırın ve gerçek URL'leri yazın.

### Adım 3: Aniwatch API'yi Yeniden Başlatın

```bash
# Ctrl+C ile durdurun, sonra tekrar başlatın
npm start
```

## 🔄 Alternatif Çözüm: Vite Proxy Kullanın

Eğer aniwatch-api'nin `.env` dosyasını değiştiremiyorsanız, frontend'de proxy kullanabilirsiniz.

### `anime-streaming-ui/vite.config.js` Dosyasını Güncelleyin:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

### `aniwatchApi.js` Dosyasını Güncelleyin:

```javascript
// Değiştir:
const ANIWATCH_API_BASE = import.meta.env.VITE_ANIWATCH_API_URL || 'http://localhost:4000'

// Şununla:
const ANIWATCH_API_BASE = import.meta.env.VITE_ANIWATCH_API_URL || ''
```

Bu durumda `.env` dosyasında:
```env
# Boş bırakın veya kaldırın
# VITE_ANIWATCH_API_URL=
```

## 🎯 Önerilen Çözüm

**Çözüm 1'i kullanın** (Aniwatch API'de CORS'u etkinleştirin). Bu daha temiz ve production'a daha uygun bir çözümdür.

## 🧪 Test Edin

Değişiklikleri yaptıktan sonra:

1. Aniwatch API'yi yeniden başlatın
2. Frontend'i yenileyin (F5)
3. Console'da hata olmamalı
4. Ana sayfada animeler görünmeli

## 📝 Production İçin

Production'da `.env` dosyasını şöyle güncelleyin:

```env
ANIWATCH_API_CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Tüm production domain'lerinizi virgülle ayırarak ekleyin.
