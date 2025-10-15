# ⚡ Hızlı .env Kurulumu

## ❌ Hata: "library/undefined/collections"

Bu hata `.env` dosyasında `VITE_BUNNY_LIBRARY_ID` tanımlı olmadığında oluşur.

### **Console Çıktısı:**
```
❌ Collection yüklenemedi: Collection listelenemedi
video.bunnycdn.com/library/undefined/collections: 400 (Bad Request)
```

---

## ✅ Çözüm

### **1. .env Dosyası Oluştur**

```bash
# Proje kök dizininde
cd anime-streaming-ui
cp .env.example .env
```

### **2. .env Dosyasını Düzenle**

```bash
# .env dosyasını aç
notepad .env
```

### **3. Bunny.net Bilgilerini Ekle**

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# Bunny Stream Configuration
VITE_BUNNY_STREAM_API_KEY=your-actual-api-key-here
VITE_BUNNY_LIBRARY_ID=123456
VITE_BUNNY_CDN_HOSTNAME=your-cdn-hostname.b-cdn.net
```

---

## 🔑 Bunny.net Bilgilerini Alma

### **1. Bunny.net'e Giriş Yap**
```
https://bunny.net/dashboard
```

### **2. Stream Library Oluştur/Seç**
```
Dashboard → Stream → Libraries → Create Library (veya mevcut library'yi seç)
```

### **3. API Bilgilerini Al**

#### **Library ID:**
```
Stream → Library seç → URL'de görünür
https://dash.bunny.net/stream/library/123456
                                    ^^^^^^ (Library ID)
```

#### **API Key:**
```
Stream → Library seç → API → API Key
(Kopyala ve .env'ye yapıştır)
```

#### **CDN Hostname:**
```
Stream → Library seç → Settings → CDN Hostname
Örnek: vz-abc123.b-cdn.net
```

---

## 🧪 Test Et

### **1. Dev Server'ı Yeniden Başlat**
```bash
# Ctrl+C ile durdur
npm run dev
```

### **2. Console'u Kontrol Et**
```
F12 → Console

Beklenen:
🔑 Bunny.net Yapılandırması:
  API Key: ✅ Var
  Library ID: ✅ Var
  CDN Hostname: ✅ Var
📋 Bunny.net collection'ları yükleniyor...
✅ X anime bulundu: [...]
```

### **3. Upload Sayfasını Aç**
```
http://localhost:5173/upload
```

---

## 📋 Kontrol Listesi

- [ ] `.env` dosyası oluşturuldu
- [ ] `VITE_BUNNY_STREAM_API_KEY` eklendi
- [ ] `VITE_BUNNY_LIBRARY_ID` eklendi
- [ ] `VITE_BUNNY_CDN_HOSTNAME` eklendi
- [ ] Dev server yeniden başlatıldı
- [ ] Console'da "✅ Var" mesajları görünüyor
- [ ] Anime dropdown doluyor

---

## 🔍 Debug Console Çıktıları

### **✅ Başarılı:**
```
🔑 Bunny.net Yapılandırması:
  API Key: ✅ Var
  Library ID: ✅ Var
  CDN Hostname: ✅ Var
📋 Bunny.net collection'ları yükleniyor...
📦 Collection sonucu: {success: true, collections: Array(5)}
✅ 5 anime bulundu: ['Naruto', 'Bleach', ...]
```

### **❌ API Key Yok:**
```
🔑 Bunny.net Yapılandırması:
  API Key: ❌ Yok
  Library ID: ✅ Var
  CDN Hostname: ✅ Var
❌ Bunny.net yapılandırılmamış! .env dosyasını kontrol edin.
⚠️ Bunny.net yapılandırılmamış, anime listesi yüklenemedi
```

### **❌ Library ID Yok:**
```
🔑 Bunny.net Yapılandırması:
  API Key: ✅ Var
  Library ID: ❌ Yok
  CDN Hostname: ✅ Var
❌ Bunny.net yapılandırılmamış! .env dosyasını kontrol edin.
⚠️ Bunny.net yapılandırılmamış, anime listesi yüklenemedi
```

---

## 🚨 Yaygın Hatalar

### **1. "library/undefined/collections"**
**Sebep:** `VITE_BUNNY_LIBRARY_ID` tanımlı değil

**Çözüm:**
```env
VITE_BUNNY_LIBRARY_ID=123456
```

### **2. "401 Unauthorized"**
**Sebep:** API Key yanlış veya geçersiz

**Çözüm:**
- Bunny.net dashboard'dan API Key'i kontrol et
- Doğru library'nin API Key'ini kullandığından emin ol

### **3. "403 Forbidden"**
**Sebep:** API Key'in izinleri yok

**Çözüm:**
- Bunny.net dashboard'dan API Key izinlerini kontrol et
- Stream API erişimi olmalı

### **4. "Dev server yeniden başlatmadım"**
**Sebep:** `.env` değişiklikleri için server restart gerekli

**Çözüm:**
```bash
# Ctrl+C ile durdur
npm run dev
```

---

## 📝 Örnek .env Dosyası

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com

# Bunny Stream Configuration
VITE_BUNNY_STREAM_API_KEY=a1b2c3d4-e5f6-7890-abcd-ef1234567890
VITE_BUNNY_LIBRARY_ID=512139
VITE_BUNNY_CDN_HOSTNAME=vz-abc123.b-cdn.net
```

---

## ✅ Başarı Kriterleri

Console'da şunları görmelisiniz:

```
✅ 🔑 Bunny.net Yapılandırması:
✅   API Key: ✅ Var
✅   Library ID: ✅ Var
✅   CDN Hostname: ✅ Var
✅ 📋 Bunny.net collection'ları yükleniyor...
✅ ✅ X anime bulundu: [...]
```

Upload sayfasında:
```
✅ Anime dropdown dolu
✅ Collection sayısı gösteriliyor
✅ Hata mesajı yok
```

---

## 🎉 Tamamlandı!

Artık:
- ✅ Bunny.net yapılandırıldı
- ✅ Anime dropdown çalışıyor
- ✅ Collection'lar yükleniyor
- ✅ Video yükleme hazır

**Test edin ve video yükleyin!** 🎌✨
