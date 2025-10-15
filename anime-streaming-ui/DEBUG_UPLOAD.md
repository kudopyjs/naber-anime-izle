# 🔍 Upload Hata Ayıklama Rehberi

## ❌ "Upload failed" Hatası

**Sorun:** Hata detayları gösterilmiyor, sadece "Upload failed" mesajı var.

---

## ✅ Detaylı Logları Aktif Ettik

### **Frontend (bunnyUpload.js)**
```javascript
console.log('📤 Bunny.net\'e fetch isteği gönderiliyor...')
console.log('  URL:', resolvedUrl)
console.log('  Title:', title)
console.log('  Collection ID:', collectionId)
console.log('📥 Bunny.net response:', response.status, response.statusText)
console.log('📦 Bunny.net response data:', data)
console.log('🎬 Video ID:', videoId)
```

### **Backend (upload_api.py)**
```python
print(f"🔍 URL çözümleniyor: {video_url}")
print(f"  ⏳ yt-dlp ile bilgi çekiliyor...")
print(f"  📊 Video bilgileri:")
print(f"     - Başlık: {info.get('title')}")
print(f"     - Süre: {info.get('duration')} saniye")
print(f"  ✅ Gerçek URL bulundu: {direct_url[:100]}...")
```

---

## 🧪 Test Adımları

### **1. Backend'i Başlat**
```bash
cd bunny_scripts
python upload_api.py
```

**Beklenen:**
```
🚀 Server başlatılıyor...
📍 URL: http://localhost:5000
```

---

### **2. Frontend'i Başlat**
```bash
cd anime-streaming-ui
npm run dev
```

---

### **3. Browser Console'u Aç (F12)**
```
Console sekmesi → Tüm logları göreceksiniz
```

---

### **4. Sibnet URL'sini Test Et**

**URL:**
```
https://video.sibnet.ru/video4916331-_AnimeWh0__Ble4ch___Th0us4nd_Ye4r_Bl00d_W4r___01
```

**Upload sayfasında:**
1. Anime: Bleach
2. Video URL: (yukarıdaki URL)
3. Bölüm: 1
4. İsim: The Blood Warfare
5. Yükle

---

## 🔍 Console'da Bakılacaklar

### **1. URL Çözümleme**
```javascript
🔍 Video URL çözümleniyor (backend API)...
✅ URL çözümlendi (sibnet): http://video.sibnet.ru/shell.php?...
```

**Sorun varsa:**
```javascript
❌ URL çözümleme hatası: Failed to fetch
🔄 Basit URL çözümleme yapılıyor...
⚠️ Sibnet URL'leri için backend API gerekli!
```

**Çözüm:** Backend çalıştırın

---

### **2. Bunny.net İsteği**
```javascript
📤 Bunny.net'e fetch isteği gönderiliyor...
  URL: http://video.sibnet.ru/shell.php?videoid=...
  Title: Bleach - Bölüm 1: The Blood Warfare
  Collection ID: abc-123-def
```

---

### **3. Bunny.net Response**
```javascript
📥 Bunny.net response: 200 OK
📦 Bunny.net response data: {guid: "...", success: true}
🎬 Video ID: xyz-789-ghi
```

**Sorun varsa:**
```javascript
📥 Bunny.net response: 400 Bad Request
❌ Bunny.net error response: {"Message": "Invalid file..."}
```

---

## 🚨 Yaygın Hatalar ve Çözümleri

### **1. "Failed to fetch" (Backend'e erişilemiyor)**

**Console:**
```
❌ URL çözümleme hatası: Failed to fetch
```

**Sebep:** Backend çalışmıyor

**Çözüm:**
```bash
cd bunny_scripts
python upload_api.py
```

**Kontrol:**
```
http://localhost:5000/api/health
```

---

### **2. "Invalid file" (Bunny.net dosyayı yükleyemiyor)**

**Console:**
```
📥 Bunny.net response: 400 Bad Request
❌ Bunny.net error response: Invalid file. Cannot load file...
```

**Sebep:** URL direkt video dosyası değil

**Çözüm:**
- Backend'in URL'yi doğru çözümlediğinden emin olun
- Backend console'da çözümlenmiş URL'yi kontrol edin

**Backend Console:**
```
✅ Gerçek URL bulundu: http://video.sibnet.ru/shell.php?videoid=...
```

---

### **3. "URL field'ı bulunamadı" (yt-dlp URL döndürmedi)**

**Backend Console:**
```
❌ 'url' field'ı bulunamadı!
📋 Mevcut field'lar: ['title', 'duration', 'formats', ...]
```

**Sebep:** Video korumalı veya yt-dlp desteklemiyor

**Çözüm:**
- Farklı format seçin: `'format': 'bestvideo+bestaudio'`
- veya `info.get('formats')[0]['url']` kullanın

---

### **4. "Collection ID undefined"**

**Console:**
```
📤 Bunny.net'e fetch isteği gönderiliyor...
  Collection ID: undefined
```

**Sebep:** Anime seçilmedi veya collection oluşturulamadı

**Çözüm:**
- Anime seçin veya "+ Anime Ekle" ile ekleyin
- Console'da collection oluşturma loglarını kontrol edin

---

### **5. "Video ID: YOK!"**

**Console:**
```
📦 Bunny.net response data: {success: true}
🎬 Video ID: YOK!
```

**Sebep:** Bunny.net response'da `guid` veya `id` field'ı yok

**Çözüm:**
- Response data'yı kontrol edin
- Bunny.net asenkron işlem başlatmış olabilir
- `data.guid` veya `data.videoGuid` deneyin

---

## 📊 Tam Console Çıktısı (Başarılı)

```javascript
// Frontend
🔍 Video URL çözümleniyor (backend API)...
✅ URL çözümlendi (sibnet): http://video.sibnet.ru/shell.php?videoid=4916331...
📤 Bunny.net'e fetch isteği gönderiliyor...
  URL: http://video.sibnet.ru/shell.php?videoid=4916331...
  Title: Bleach - Bölüm 1: The Blood Warfare
  Collection ID: abc-123-def-456
📥 Bunny.net response: 200 OK
📦 Bunny.net response data: {guid: "xyz-789-ghi-012", success: true, ...}
🎬 Video ID: xyz-789-ghi-012
📦 Video collection'a taşınıyor...
✅ Video başarıyla collection'a taşındı!
```

```python
# Backend
🔍 URL çözümleniyor: https://video.sibnet.ru/video4916331-...
  ⏳ yt-dlp ile bilgi çekiliyor...
  📊 Video bilgileri:
     - Başlık: Bleach - Episode 1
     - Süre: 1440 saniye
     - Format: best
     - Extractor: sibnet
  ✅ Gerçek URL bulundu: http://video.sibnet.ru/shell.php?videoid=4916331...
  🔗 URL tipi: <class 'str'>
```

---

## 📝 Kontrol Listesi

### **Backend:**
- [ ] Backend çalışıyor (`http://localhost:5000/api/health`)
- [ ] yt-dlp kurulu (`pip install yt-dlp`)
- [ ] Console'da URL çözümleme logları var
- [ ] Gerçek URL bulundu mesajı var

### **Frontend:**
- [ ] `.env` dosyasında `VITE_BACKEND_API_URL` var
- [ ] Dev server yeniden başlatıldı
- [ ] Console'da backend API çağrısı var
- [ ] URL çözümlendi mesajı var

### **Bunny.net:**
- [ ] API Key doğru
- [ ] Library ID doğru
- [ ] Collection oluşturuldu
- [ ] Response 200 OK

---

## 🎯 Hızlı Test

```bash
# Terminal 1: Backend
cd bunny_scripts
python upload_api.py

# Terminal 2: Frontend
cd anime-streaming-ui
npm run dev

# Browser
http://localhost:5173/upload
F12 → Console
Sibnet URL gir → Yükle
Console loglarını kontrol et
```

---

## 📞 Hata Raporlama

Hata devam ediyorsa, şunları paylaşın:

1. **Frontend Console (F12):**
   - Tüm loglar (baştan sona)
   - Hata mesajları (kırmızı)

2. **Backend Console:**
   - URL çözümleme logları
   - yt-dlp çıktısı
   - Hata mesajları

3. **Bunny.net Dashboard:**
   - Video oluşturuldu mu?
   - Hata mesajı var mı?

---

## ✅ Başarı Kriterleri

- ✅ Backend çalışıyor
- ✅ URL çözümleniyor
- ✅ Bunny.net 200 OK döndürüyor
- ✅ Video ID alınıyor
- ✅ Collection'a taşınıyor
- ✅ "Upload failed" hatası yok

**Şimdi test edin ve console loglarını kontrol edin!** 🔍
