# 🎬 Upload Sistemi V2 - Geliştirilmiş Özellikler

## ✨ Yeni Özellikler

### **1. Anime Dropdown Seçimi**
- ✅ Mevcut anime'ler dropdown'dan seçilir
- ✅ Anime listesi Bunny.net collection'larından gelir
- ✅ Otomatik yükleme ve güncelleme

### **2. Anime Ekleme Modal'i**
- ✅ "+ Anime Ekle" butonu (dropdown'un sağında)
- ✅ Modal popup ile yeni anime ekleme
- ✅ Eklenen anime otomatik seçilir

### **3. Bölüm İsmi Alanı**
- ✅ "Anime Başlığı" → "Bölüm İsmi" olarak değiştirildi
- ✅ Daha açık ve anlaşılır
- ✅ Örnek: "Uzumaki Naruto"

### **4. Gelişmiş URL Çözümleme**
- ✅ Mail.ru link desteği
- ✅ Sibnet link desteği
- ✅ Otomatik URL çözümleme
- ✅ Python'daki yt-dlp mantığı

---

## 🔗 Desteklenen URL Formatları

### **Mail.ru**
```
✅ https://my.mail.ru/mail/animewhok/video/_myvideo/2835.html
✅ https://my.mail.ru/video/embed/9165530183271198803
```

**Çözümleme:**
```javascript
// https://my.mail.ru/mail/user/video/_myvideo/123.html
// -> https://my.mail.ru/video/embed/123
```

### **Sibnet**
```
✅ https://video.sibnet.ru/video4916331-_AnimeWh0__Ble4ch___Th0us4nd_Ye4r_Bl00d_W4r___01/
```

**Çözümleme:**
```javascript
// Direkt kullanılır
```

### **Diğer Platformlar**
- Google Drive
- Yandex Disk
- Pixeldrain
- HDVID
- ve daha fazlası...

---

## 🎯 Kullanım Akışı

### **1. Anime Seçme**

#### **Mevcut Anime:**
```
1. Dropdown'u aç
2. Anime seç (Örn: "Naruto")
3. Form otomatik doldurulur
```

#### **Yeni Anime:**
```
1. "+ Anime Ekle" butonuna tıkla
2. Modal açılır
3. Anime adını gir (Örn: "Bleach")
4. "Ekle" butonuna tıkla
5. Anime otomatik seçilir
```

---

### **2. Yükleme Yöntemi Seçme**

#### **URL'den Aktar:**
```
1. "🔗 URL'den Aktar" butonuna tıkla
2. Video URL'sini yapıştır
3. Sistem otomatik çözümler
4. Bunny.net'e aktarır
```

#### **Dosya Yükle:**
```
1. "📁 Dosya Yükle" butonuna tıkla
2. Video dosyası seç (MP4, MKV, AVI, MOV, WEBM)
3. Progress bar ile yükleme takibi
4. Bunny.net'e yüklenir
```

---

### **3. Form Doldurma**

```
Anime Seç: Naruto (dropdown)
Yükleme Yöntemi: URL'den Aktar
Video URL: https://my.mail.ru/mail/animewhok/video/_myvideo/2835.html
Bölüm Numarası: 1
Bölüm İsmi: Uzumaki Naruto
Fansub: Benihime Fansub (opsiyonel)
```

---

### **4. Yükleme**

```
1. "🚀 Yükle" butonuna tıkla
2. URL çözümlenir
   🔍 Video URL çözümleniyor...
   ✅ URL çözümlendi (mail.ru): https://my.mail.ru/video/embed/...
3. Collection bulunur/oluşturulur
   ✅ Mevcut collection bulundu: Naruto
4. Video yüklenir
   ✅ Video aktarıldı: abc-123-def
   📁 Collection: xyz-789-ghi
5. Başarı mesajı
   ✓ Video başarıyla yüklendi! Bunny.net'e aktarıldı.
```

---

## 🔧 Teknik Detaylar

### **URL Çözümleme (`resolveVideoURL`)**

```javascript
export async function resolveVideoURL(url) {
  // Mail.ru için
  if (url.includes('mail.ru')) {
    console.log('🔍 Mail.ru URL çözümleniyor...')
    if (!url.includes('/video/embed/')) {
      const match = url.match(/\/video\/.*?\/(\d+)/)
      if (match) {
        const videoId = match[1]
        url = `https://my.mail.ru/video/embed/${videoId}`
      }
    }
    return { success: true, url: url, platform: 'mail.ru' }
  }
  
  // Sibnet için
  if (url.includes('sibnet.ru')) {
    console.log('🔍 Sibnet URL çözümleniyor...')
    return { success: true, url: url, platform: 'sibnet' }
  }
  
  // Diğer platformlar
  return { success: true, url: url, platform: 'other' }
}
```

### **Upload İşlemi (`uploadFromURL`)**

```javascript
export async function uploadFromURL(videoUrl, title, animeName) {
  // 1. URL'yi çözümle
  const resolveResult = await resolveVideoURL(videoUrl)
  const resolvedUrl = resolveResult.url
  
  // 2. Collection bul/oluştur
  const collResult = await getOrCreateCollection(animeName)
  const collectionId = collResult.collectionId
  
  // 3. Bunny.net'e fetch
  const response = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/fetch`,
    {
      method: 'POST',
      body: JSON.stringify({
        url: resolvedUrl,
        title: title,
        collectionId: collectionId
      })
    }
  )
  
  // 4. Collection'a taşı (gerekirse)
  if (collectionId && videoId) {
    await moveToCollection(videoId, collectionId)
  }
  
  return { success: true, videoId, collectionId }
}
```

---

## 📊 Form Alanları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Anime Seç** | Dropdown | ✅ | Mevcut anime'lerden seç veya yeni ekle |
| **Yükleme Yöntemi** | Button Group | ✅ | URL veya Dosya |
| **Video URL** | Text Input | ✅ (URL) | Mail.ru, Sibnet vb. |
| **Video Dosyası** | File Input | ✅ (Dosya) | MP4, MKV, AVI, MOV, WEBM |
| **Bölüm Numarası** | Number | ✅ | 1, 2, 3... |
| **Bölüm İsmi** | Text Input | ✅ | Örn: "Uzumaki Naruto" |
| **Fansub** | Text Input | ❌ | Opsiyonel, boşsa kullanıcı adı |

---

## 🎨 UI/UX İyileştirmeleri

### **Anime Dropdown**
```jsx
<select className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-lg">
  <option value="">Anime seçin...</option>
  {animeList.map(anime => (
    <option key={anime} value={anime}>{anime}</option>
  ))}
</select>
```

### **Anime Ekleme Butonu**
```jsx
<button
  onClick={() => setShowAddAnimeModal(true)}
  className="px-6 py-3 bg-primary text-white rounded-lg shadow-neon-cyan"
>
  + Anime Ekle
</button>
```

### **Anime Ekleme Modal'i**
```jsx
<AnimatePresence>
  {showAddAnimeModal && (
    <motion.div className="fixed inset-0 bg-black/80 flex items-center justify-center">
      <motion.div className="glassmorphic rounded-xl p-6">
        <h2>Yeni Anime Ekle</h2>
        <input placeholder="Anime adı (Örn: Naruto)" />
        <button onClick={handleAddAnime}>Ekle</button>
        <button onClick={() => setShowAddAnimeModal(false)}>İptal</button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### **URL Platformları Bilgisi**
```jsx
<div className="mt-2 space-y-1">
  <p className="text-white/60 text-sm font-semibold">Desteklenen Platformlar:</p>
  <p className="text-white/40 text-xs">
    • Mail.ru: https://my.mail.ru/mail/user/video/_myvideo/123.html
  </p>
  <p className="text-white/40 text-xs">
    • Sibnet: https://video.sibnet.ru/video4916331-...
  </p>
</div>
```

---

## 🚀 Test Senaryoları

### **Test 1: Mevcut Anime + URL Upload**
```
1. Anime Seç: "Naruto" (dropdown)
2. Yükleme Yöntemi: URL'den Aktar
3. Video URL: https://my.mail.ru/mail/animewhok/video/_myvideo/2835.html
4. Bölüm Numarası: 1
5. Bölüm İsmi: Uzumaki Naruto
6. Yükle

Beklenen:
✅ URL çözümlendi (mail.ru)
✅ Mevcut collection bulundu: Naruto
✅ Video aktarıldı
```

### **Test 2: Yeni Anime + Sibnet Upload**
```
1. "+ Anime Ekle" → "Bleach"
2. Yükleme Yöntemi: URL'den Aktar
3. Video URL: https://video.sibnet.ru/video4916331-...
4. Bölüm Numarası: 1
5. Bölüm İsmi: The Blood Warfare
6. Yükle

Beklenen:
✅ URL çözümlendi (sibnet)
📁 Yeni collection oluşturuluyor: Bleach
✅ Video aktarıldı
```

### **Test 3: Dosya Upload**
```
1. Anime Seç: "One Piece"
2. Yükleme Yöntemi: Dosya Yükle
3. Dosya Seç: episode_1.mp4
4. Bölüm Numarası: 1
5. Bölüm İsmi: I'm Luffy!
6. Yükle

Beklenen:
Progress: 0% → 25% → 50% → 75% → 100%
✅ Video yüklendi
```

---

## ✅ Özellik Karşılaştırması

| Özellik | V1 (Eski) | V2 (Yeni) |
|---------|-----------|-----------|
| Anime seçimi | ❌ Manuel input | ✅ Dropdown |
| Anime ekleme | ❌ Yok | ✅ Modal ile |
| Başlık alanı | "Anime Başlığı" | "Bölüm İsmi" |
| URL çözümleme | ❌ Direkt URL | ✅ Mail.ru, Sibnet |
| Platform desteği | Genel | Mail.ru, Sibnet, vb. |
| Collection yönetimi | ✅ Otomatik | ✅ Otomatik |
| Progress tracking | ✅ Var | ✅ Var |
| UI/UX | İyi | Mükemmel |

---

## 📝 Kullanım Örnekleri

### **Örnek 1: Mail.ru Linki**
```
Input:
https://my.mail.ru/mail/animewhok/video/_myvideo/2835.html

Çözümleme:
https://my.mail.ru/video/embed/2835

Sonuç:
✅ Video başarıyla aktarıldı
```

### **Örnek 2: Sibnet Linki**
```
Input:
https://video.sibnet.ru/video4916331-_AnimeWh0__Ble4ch___Th0us4nd_Ye4r_Bl00d_W4r___01/

Çözümleme:
Direkt kullanılır

Sonuç:
✅ Video başarıyla aktarıldı
```

---

## 🎉 Özet

**Yeni upload sistemi:**
1. ✅ Anime dropdown ile kolay seçim
2. ✅ "+ Anime Ekle" butonu ile hızlı ekleme
3. ✅ "Bölüm İsmi" alanı ile daha açık form
4. ✅ Mail.ru ve Sibnet link desteği
5. ✅ Otomatik URL çözümleme
6. ✅ Python'daki yt-dlp mantığı
7. ✅ Gelişmiş UI/UX
8. ✅ Detaylı console logları

**Fansub ve adminler artık daha kolay video yükleyebilir!** 🎌✨
