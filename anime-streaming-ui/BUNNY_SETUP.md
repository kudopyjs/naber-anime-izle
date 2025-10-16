# 🐰 Bunny.net Stream Kurulum Rehberi

## 403 Forbidden Hatası Çözümü

Video oynatılırken **403 Forbidden** hatası alıyorsanız, Bunny.net güvenlik ayarlarını yapılandırmanız gerekiyor.

### 1️⃣ Bunny.net Dashboard'a Giriş

1. https://bunny.net adresine gidin
2. Giriş yapın
3. Sol menüden **Stream** sekmesine tıklayın
4. Library'nizi seçin

### 2️⃣ Security Ayarları

#### Allowed Referrers (Önemli!)

```
Dashboard → Stream → [Your Library] → Security → Allowed Referrers
```

**Eklenecek domain'ler:**
- `localhost`
- `127.0.0.1`
- `localhost:5173` (Vite dev server)
- `yourdomain.com` (production için)

**Veya:**
- Boş bırakın (tüm domain'lere izin verir - development için önerilir)

#### Token Authentication

```
Dashboard → Stream → [Your Library] → Security → Token Authentication
```

**Ayar:** ❌ **KAPALI** (Disabled)

> Token authentication açıksa, her video URL'ine token eklemeniz gerekir. Development için kapalı tutun.

#### Block Direct Access

```
Dashboard → Stream → [Your Library] → Security → Block Direct Access
```

**Ayar:** ❌ **KAPALI** (Disabled)

> Bu açıksa, playlist.m3u8 dosyasına direkt erişim engellenir.

### 3️⃣ Player Ayarları

#### Enable MP4 Fallback

```
Dashboard → Stream → [Your Library] → Player → Enable MP4 Fallback
```

**Ayar:** ✅ **AÇIK** (Enabled)

> HLS desteklemeyen tarayıcılar için MP4 fallback sağlar.

#### CORS Settings

```
Dashboard → Stream → [Your Library] → Player → CORS Settings
```

**Ayar:** ✅ **Allow All Origins** (Development için)

### 4️⃣ Video Ayarları (Her Video İçin)

Her video için ayrı ayrı da ayar yapabilirsiniz:

```
Dashboard → Stream → [Your Library] → Videos → [Video] → Settings
```

- **Public:** ✅ Açık
- **Unlisted:** ❌ Kapalı (veya açık, fark etmez)
- **Private:** ❌ Kapalı

### 5️⃣ .env Dosyası Kontrolü

`.env` dosyanızda şu değerlerin doğru olduğundan emin olun:

```env
VITE_BUNNY_STREAM_API_KEY=your-api-key-here
VITE_BUNNY_LIBRARY_ID=your-library-id-here
VITE_BUNNY_CDN_HOSTNAME=vz-xxxxx.b-cdn.net
```

**CDN Hostname nasıl bulunur:**
```
Dashboard → Stream → [Your Library] → Overview → CDN Hostname
```

### 6️⃣ Test

1. Tarayıcıda video sayfasını açın
2. F12 ile Developer Console'u açın
3. Network sekmesinde `playlist.m3u8` isteğini bulun
4. Status Code: **200 OK** olmalı (403 değil!)

### 🔍 Hala Çalışmıyorsa?

#### Console'da Hata Kontrol Edin

```javascript
// Console'da göreceğiniz hatalar:
// ❌ 403 Forbidden → Security ayarları yanlış
// ❌ 404 Not Found → Video ID veya CDN hostname yanlış
// ❌ CORS Error → CORS ayarları yanlış
// ✅ 200 OK → Her şey doğru!
```

#### Video Status Kontrol Edin

Debug panelinde video status'ünü kontrol edin:
- **Status 4:** Video hazır ✅
- **Status 5:** Encoding devam ediyor ⏳
- **Diğer:** Video henüz hazır değil ⚠️

#### Bunny.net Dashboard'da Video Kontrol Edin

```
Dashboard → Stream → [Your Library] → Videos → [Video]
```

- Video **Finished** durumunda mı?
- **Available Resolutions** var mı?
- **Thumbnail** oluşturulmuş mu?

### 📝 Önerilen Development Ayarları

En kolay kurulum için:

1. **Allowed Referrers:** Boş bırakın
2. **Token Authentication:** Kapalı
3. **Block Direct Access:** Kapalı
4. **CORS:** Allow All Origins
5. **All Videos:** Public

> ⚠️ **Uyarı:** Bu ayarlar sadece development içindir. Production'da güvenlik ayarlarını sıkılaştırın!

### 🚀 Production Ayarları

Production'a geçerken:

1. **Allowed Referrers:** Sadece domain'inizi ekleyin
2. **Token Authentication:** İsteğe bağlı (ekstra güvenlik için)
3. **CORS:** Sadece domain'inize izin verin
4. **Videos:** Unlisted veya Private (isteğe bağlı)

### 🆘 Destek

Hala sorun yaşıyorsanız:
- Bunny.net Support: https://support.bunny.net
- Discord: https://discord.gg/bunnycdn
