# 🎬 Anime Upload Sistemi - Bunny.net Entegrasyonu

## ✨ Özellikler

### **1. Akıllı Collection Yönetimi**
- ✅ **Otomatik collection bulma:** Anime adı ile collection arar
- ✅ **Tam eşleşme:** "Naruto" ≠ "Naruto Shippuden"
- ✅ **Otomatik oluşturma:** Collection yoksa oluşturur
- ✅ **Düzenli arşiv:** Her anime kendi klasöründe

### **2. İki Yükleme Yöntemi**

#### **A. URL'den Yükleme** (Mail.ru, Sibnet, Google Drive vb.)
```javascript
// Kullanım
const result = await uploadFromURL(
  'https://my.mail.ru/video/embed/...',
  'Naruto - S01E01: Uzumaki Naruto',
  'Naruto' // Anime adı (collection için)
)
```

**Desteklenen Platformlar:**
- Mail.ru
- Sibnet
- Google Drive
- Yandex Disk
- Pixeldrain
- HDVID
- ve daha fazlası...

#### **B. Dosya Yükleme** (MP4, MKV, AVI vb.)
```javascript
// Kullanım
const result = await uploadVideoFile(
  file, // File object
  'Naruto - S01E01: Uzumaki Naruto',
  'Naruto', // Anime adı (collection için)
  '', // collectionId (otomatik bulunur)
  (progress) => console.log(`${progress}%`)
)
```

**Desteklenen Formatlar:**
- MP4
- MKV
- AVI
- MOV
- WEBM

---

## 🚀 Kullanım

### **1. Web Arayüzünden**

#### Upload Sayfası
1. **Login olun** (Fansub veya Admin rolü gerekli)
2. **Upload Video** sayfasına gidin
3. **Yükleme yöntemini seçin:**
   - 📁 **File Upload:** Bilgisayarınızdan video yükleyin
   - 🔗 **URL Upload:** Video linkini yapıştırın

#### Form Alanları
```
Anime Adı: Naruto
Bölüm: 1
Sezon: 1
Başlık: Uzumaki Naruto
Açıklama: İlk bölüm...
Tür: Action
```

#### URL Yükleme Örneği
```
Video URL: https://my.mail.ru/video/embed/9165530183271198803
```

**Sistem otomatik olarak:**
1. ✅ "Naruto" collection'ını arar
2. ✅ Yoksa oluşturur
3. ✅ Videoyu collection'a yükler
4. ✅ Embed URL'sini oluşturur

---

## 🔧 Teknik Detaylar

### **Collection Yönetimi**

#### `getOrCreateCollection(name)`
```javascript
// Önce var mı kontrol et
const existingId = await findCollectionByName('Naruto')
if (existingId) {
  return existingId // Mevcut collection'ı kullan
}

// Yoksa oluştur
const newCollection = await createCollection('Naruto')
return newCollection.collectionId
```

#### `findCollectionByName(name)`
```javascript
// TAM EŞLEŞME kontrolü
const collections = await listCollections()
const collection = collections.find(c => c.name === name)
return collection ? collection.guid : null
```

**Örnekler:**
| Aranan | Mevcut Collection'lar | Sonuç |
|--------|----------------------|-------|
| "Naruto" | Naruto, Naruto Shippuden | ✅ "Naruto" bulunur |
| "Naruto Shippuden" | Naruto, Naruto Shippuden | ✅ "Naruto Shippuden" bulunur |
| "Bleach" | Naruto, One Piece | ❌ Bulunamaz → Yeni oluşturulur |

### **Video Yükleme**

#### URL'den Yükleme
```javascript
export async function uploadFromURL(videoUrl, title, animeName = null) {
  // 1. Collection bul/oluştur
  const collResult = await getOrCreateCollection(animeName)
  const collectionId = collResult.collectionId
  
  // 2. Bunny.net'e fetch
  const response = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/fetch`,
    {
      method: 'POST',
      body: JSON.stringify({
        url: videoUrl,
        title: title,
        collectionId: collectionId
      })
    }
  )
  
  // 3. Collection'a taşı (gerekirse)
  if (collectionId && videoId) {
    await moveToCollection(videoId, collectionId)
  }
  
  return { success: true, videoId, collectionId }
}
```

#### Dosyadan Yükleme
```javascript
export async function uploadVideoFile(file, title, animeName = null, onProgress) {
  // 1. Collection bul/oluştur
  const collResult = await getOrCreateCollection(animeName)
  const collectionId = collResult.collectionId
  
  // 2. Video oluştur
  const createResponse = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
    {
      method: 'POST',
      body: JSON.stringify({ title, collectionId })
    }
  )
  
  const videoId = createResponse.json().guid
  
  // 3. Dosyayı yükle (progress tracking)
  const xhr = new XMLHttpRequest()
  xhr.upload.addEventListener('progress', (e) => {
    const progress = (e.loaded / e.total) * 100
    onProgress(progress)
  })
  xhr.open('PUT', `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`)
  xhr.send(file)
  
  return { success: true, videoId, collectionId }
}
```

---

## 📊 İş Akışı

### **Senaryo 1: İlk Kez Anime Yükleme**

```
1. Kullanıcı "Naruto" anime'sinin 1. bölümünü yükler
   ↓
2. Sistem "Naruto" collection'ını arar
   ↓
3. Bulunamaz → Yeni "Naruto" collection'ı oluşturulur
   ↓
4. Video "Naruto" collection'ına yüklenir
   ↓
5. ✅ Başarılı!
```

### **Senaryo 2: Mevcut Anime'ye Bölüm Ekleme**

```
1. Kullanıcı "Naruto" anime'sinin 2. bölümünü yükler
   ↓
2. Sistem "Naruto" collection'ını arar
   ↓
3. ✅ Bulunur → Mevcut collection kullanılır
   ↓
4. Video "Naruto" collection'ına yüklenir
   ↓
5. ✅ Başarılı!
```

### **Senaryo 3: Farklı Anime (Naruto Shippuden)**

```
1. Kullanıcı "Naruto Shippuden" anime'sinin 1. bölümünü yükler
   ↓
2. Sistem "Naruto Shippuden" collection'ını arar
   ↓
3. Bulunamaz → Yeni "Naruto Shippuden" collection'ı oluşturulur
   ↓
4. Video "Naruto Shippuden" collection'ına yüklenir
   ↓
5. ✅ "Naruto" collection'ına EKLENMEZ (tam eşleşme sayesinde)
```

---

## 🎯 Avantajlar

### **Fansub/Admin İçin:**
- ✅ **Kolay yükleme:** URL veya dosya
- ✅ **Otomatik düzenleme:** Collection'lar otomatik
- ✅ **Progress tracking:** Yükleme ilerlemesi görünür
- ✅ **Hata yönetimi:** Açık hata mesajları

### **Sistem İçin:**
- ✅ **Düzenli arşiv:** Her anime kendi klasöründe
- ✅ **Tekrar kullanım:** Mevcut collection'lar kullanılır
- ✅ **Tam eşleşme:** Karışıklık yok
- ✅ **Bunny.net entegrasyonu:** CDN streaming

---

## 🔐 Güvenlik

### **Rol Tabanlı Erişim**
```javascript
// Sadece Fansub ve Admin yükleyebilir
if (!canUploadVideo()) {
  return <AccessDenied />
}
```

**Roller:**
- 👤 **User:** Sadece izleme
- 🎨 **Fansub:** Video yükleme + izleme
- 👑 **Admin:** Tüm yetkiler

---

## 📝 Örnek Kullanım

### **React Component'te**

```jsx
import { uploadFromURL, uploadVideoFile } from '../utils/bunnyUpload'

function UploadForm() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const handleURLUpload = async () => {
    setUploading(true)
    
    const result = await uploadFromURL(
      'https://my.mail.ru/video/embed/...',
      'Naruto - S01E01: Uzumaki Naruto',
      'Naruto' // Anime adı
    )
    
    if (result.success) {
      console.log('✅ Video ID:', result.videoId)
      console.log('📁 Collection:', result.collectionId)
      console.log('🎬 Embed URL:', result.embedUrl)
    }
    
    setUploading(false)
  }
  
  const handleFileUpload = async (file) => {
    setUploading(true)
    
    const result = await uploadVideoFile(
      file,
      'Naruto - S01E01: Uzumaki Naruto',
      'Naruto', // Anime adı
      '', // collectionId (otomatik)
      (progress) => setProgress(progress)
    )
    
    if (result.success) {
      console.log('✅ Video ID:', result.videoId)
      console.log('📁 Collection:', result.collectionId)
    }
    
    setUploading(false)
  }
  
  return (
    <div>
      {uploading && <p>Yükleniyor... {progress.toFixed(0)}%</p>}
      {/* Form UI */}
    </div>
  )
}
```

---

## 🆘 Sorun Giderme

### **"Collection oluşturulamadı"**
- API Key'i kontrol edin
- Library ID'yi kontrol edin
- Bunny.net dashboard'dan izinleri kontrol edin

### **"Video yüklenemedi"**
- Dosya boyutu kontrolü (max 5GB)
- Dosya formatı kontrolü (MP4, MKV, AVI, MOV, WEBM)
- İnternet bağlantısı kontrolü

### **"Video collection'a eklenmedi"**
- Collection ID'nin doğru olduğundan emin olun
- `moveToCollection` fonksiyonu çağrılıyor mu kontrol edin
- Bunny.net dashboard'dan manuel kontrol edin

---

## ✅ Özet

**Sistem artık:**
1. ✅ URL veya dosyadan video yükleyebilir
2. ✅ Collection'ları otomatik bulur/oluşturur
3. ✅ Tam eşleşme ile karışıklık önler
4. ✅ Videoları doğru collection'a ekler
5. ✅ Progress tracking ile kullanıcı bilgilendirir
6. ✅ Rol tabanlı erişim kontrolü sağlar

**Fansub ve adminler artık kolayca anime yükleyebilir!** 🎌✨
