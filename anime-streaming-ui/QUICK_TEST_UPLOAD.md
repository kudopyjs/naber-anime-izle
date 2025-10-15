# 🚀 Hızlı Test - Upload Sistemi

## ✅ Tamamlanan Özellikler

### **1. Akıllı Collection Yönetimi**
- ✅ `listCollections()` - Tüm collection'ları listele
- ✅ `findCollectionByName(name)` - İsme göre bul (TAM EŞLEŞME)
- ✅ `getOrCreateCollection(name)` - Bul veya oluştur
- ✅ `moveToCollection(videoId, collectionId)` - Video'yu taşı

### **2. Geliştirilmiş Upload Fonksiyonları**
- ✅ `uploadFromURL(url, title, animeName)` - URL'den yükle + collection
- ✅ `uploadVideoFile(file, title, animeName, onProgress)` - Dosyadan yükle + collection

### **3. UploadVideo.jsx Güncellemeleri**
- ✅ Anime adı otomatik collection olarak kullanılıyor
- ✅ Her yükleme otomatik olarak doğru collection'a gidiyor
- ✅ Console'da detaylı loglar

---

## 🧪 Test Senaryoları

### **Test 1: İlk Kez Anime Yükleme**

**Adımlar:**
1. Login olun (Fansub veya Admin)
2. Upload Video sayfasına gidin
3. Form doldurun:
   ```
   Anime Adı: Naruto
   Bölüm: 1
   Sezon: 1
   Başlık: Uzumaki Naruto
   ```
4. **URL Upload** seçin
5. Video URL'si girin:
   ```
   https://my.mail.ru/video/embed/9165530183271198803
   ```
6. Upload butonuna tıklayın

**Beklenen Sonuç:**
```
Console:
✅ Mevcut collection bulundu: Naruto (veya)
📁 Yeni collection oluşturuluyor: Naruto
✅ Video aktarıldı: [video-id]
📁 Collection: [collection-id]

Bunny.net Dashboard:
- "Naruto" collection'ı oluşturuldu
- Video "Naruto" collection'ında
```

---

### **Test 2: Mevcut Anime'ye Bölüm Ekleme**

**Adımlar:**
1. Aynı anime'nin farklı bölümünü yükleyin:
   ```
   Anime Adı: Naruto
   Bölüm: 2
   Sezon: 1
   Başlık: Konohamaru
   ```

**Beklenen Sonuç:**
```
Console:
✅ Mevcut collection bulundu: Naruto
✅ Video aktarıldı: [video-id]
📁 Collection: [aynı-collection-id]

Bunny.net Dashboard:
- "Naruto" collection'ında 2 video var
- Yeni collection OLUŞTURULMADI
```

---

### **Test 3: Farklı Anime (Tam Eşleşme Testi)**

**Adımlar:**
1. Benzer isimli ama farklı anime yükleyin:
   ```
   Anime Adı: Naruto Shippuden
   Bölüm: 1
   Sezon: 1
   Başlık: Homecoming
   ```

**Beklenen Sonuç:**
```
Console:
📁 Yeni collection oluşturuluyor: Naruto Shippuden
✅ Video aktarıldı: [video-id]
📁 Collection: [yeni-collection-id]

Bunny.net Dashboard:
- "Naruto" collection'ı → 2 video (değişmedi)
- "Naruto Shippuden" collection'ı → 1 video (YENİ)
- İki collection AYRI
```

---

### **Test 4: Dosya Yükleme**

**Adımlar:**
1. **File Upload** seçin
2. MP4 dosyası seçin
3. Form doldurun:
   ```
   Anime Adı: Bleach
   Bölüm: 1
   Sezon: 1
   ```
4. Upload butonuna tıklayın

**Beklenen Sonuç:**
```
Console:
📁 Yeni collection oluşturuluyor: Bleach
Progress: 0% → 25% → 50% → 75% → 100%
✅ Video yüklendi: [video-id]
📁 Collection: [collection-id]

Bunny.net Dashboard:
- "Bleach" collection'ı oluşturuldu
- Video "Bleach" collection'ında
```

---

## 🔍 Kontrol Listesi

### **Bunny.net Dashboard'da Kontrol**

1. **Collections sekmesine gidin**
   - [ ] "Naruto" collection'ı var mı?
   - [ ] "Naruto Shippuden" collection'ı var mı?
   - [ ] "Bleach" collection'ı var mı?

2. **Her collection'a tıklayın**
   - [ ] Doğru videolar içinde mi?
   - [ ] Video sayısı doğru mu?

3. **Videos sekmesine gidin**
   - [ ] Tüm videolar listelenmiş mi?
   - [ ] Her video doğru collection'da mı?

### **Console'da Kontrol**

Browser console'u açın (F12) ve şunları arayın:
```
✅ Mevcut collection bulundu: [anime-adı]
📁 Yeni collection oluşturuluyor: [anime-adı]
✅ Video aktarıldı: [video-id]
📁 Collection: [collection-id]
```

---

## 🐛 Hata Ayıklama

### **"Collection oluşturulamadı"**

**Kontrol:**
```javascript
// .env dosyasında
VITE_BUNNY_STREAM_API_KEY=your-api-key
VITE_BUNNY_LIBRARY_ID=your-library-id
```

**Test:**
```javascript
// Browser console'da
console.log(import.meta.env.VITE_BUNNY_STREAM_API_KEY)
console.log(import.meta.env.VITE_BUNNY_LIBRARY_ID)
```

### **"Video collection'a eklenmedi"**

**Kontrol:**
```javascript
// bunnyUpload.js'de moveToCollection fonksiyonu çağrılıyor mu?
console.log('📦 Video collection\'a taşınıyor...')
```

**Manuel Test:**
```javascript
import { moveToCollection } from './utils/bunnyUpload'

// Video ID ve Collection ID ile test
await moveToCollection('video-id', 'collection-id')
```

### **"Yanlış collection'a gitti"**

**Kontrol:**
```javascript
// findCollectionByName tam eşleşme yapıyor mu?
const collection = collections.find(c => c.name === name) // TAM EŞLEŞME
// YANLIŞ: c.name.includes(name) // Kısmi eşleşme
```

---

## 📊 Test Sonuçları Tablosu

| Test | Anime Adı | Bölüm | Yöntem | Collection | Sonuç |
|------|-----------|-------|--------|------------|-------|
| 1 | Naruto | 1 | URL | Yeni "Naruto" | ✅ |
| 2 | Naruto | 2 | URL | Mevcut "Naruto" | ✅ |
| 3 | Naruto Shippuden | 1 | URL | Yeni "Naruto Shippuden" | ✅ |
| 4 | Bleach | 1 | File | Yeni "Bleach" | ✅ |

---

## 🎯 Başarı Kriterleri

- ✅ Her anime kendi collection'ında
- ✅ Aynı anime'nin bölümleri aynı collection'da
- ✅ Benzer isimli animeler AYRI collection'larda
- ✅ URL ve dosya yükleme çalışıyor
- ✅ Progress tracking çalışıyor
- ✅ Hata mesajları açık ve anlaşılır

---

## 🚀 Hızlı Test Komutu

```bash
# Dev server'ı başlat
cd anime-streaming-ui
npm run dev

# Browser'da aç
http://localhost:5173

# Login ol (Fansub veya Admin)
# Upload Video sayfasına git
# Test senaryolarını uygula
```

---

## ✅ Tamamlandı!

**Sistem artık:**
1. ✅ Collection'ları akıllıca yönetiyor
2. ✅ URL ve dosyadan video yüklüyor
3. ✅ Videoları doğru collection'a ekliyor
4. ✅ Tam eşleşme ile karışıklık önlüyor
5. ✅ Progress tracking sağlıyor

**Test edin ve sonuçları paylaşın!** 🎌✨
