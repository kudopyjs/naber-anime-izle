# 📦 Bunny.net Collections - Anime Dropdown

## ✅ Nasıl Çalışıyor?

Upload sayfası açıldığında:

1. **Otomatik Yükleme:**
   ```javascript
   useEffect(() => {
     loadAnimeList() // Bunny.net'ten collection'ları çek
   }, [])
   ```

2. **API Çağrısı:**
   ```javascript
   const result = await listCollections()
   // GET https://video.bunnycdn.com/library/{LIBRARY_ID}/collections
   ```

3. **Collection'ları Listele:**
   ```javascript
   const animeNames = result.collections.map(c => c.name)
   setAnimeList(animeNames)
   ```

4. **Dropdown'u Doldur:**
   ```jsx
   <select>
     <option value="">📺 Anime seçin (5 anime)</option>
     <option value="Naruto">Naruto</option>
     <option value="Bleach">Bleach</option>
     <option value="One Piece">One Piece</option>
   </select>
   ```

---

## 🔍 Console Çıktısı

### **Başarılı Yükleme:**
```
📋 Bunny.net collection'ları yükleniyor...
📦 Collection sonucu: {success: true, collections: Array(5)}
✅ 5 anime bulundu: ['Naruto', 'Bleach', 'One Piece', 'Attack on Titan', 'Death Note']
```

### **Boş Collection:**
```
📋 Bunny.net collection'ları yükleniyor...
📦 Collection sonucu: {success: true, collections: []}
✅ 0 anime bulundu: []
⚠️ Hiç collection bulunamadı. Bunny.net dashboard'dan collection oluşturun.
```

### **Hata Durumu:**
```
📋 Bunny.net collection'ları yükleniyor...
❌ Collection yüklenemedi: Invalid API key
```

---

## 🎨 UI Durumları

### **1. Yükleniyor:**
```jsx
<option value="">📋 Yükleniyor...</option>
```

### **2. Boş Liste:**
```jsx
<option value="">⚠️ Collection bulunamadı - Yeni ekleyin</option>
<p>⚠️ Henüz collection yok. "+ Anime Ekle" ile yeni anime ekleyin.</p>
```

### **3. Dolu Liste:**
```jsx
<option value="">📺 Anime seçin (5 anime)</option>
<option value="Naruto">Naruto</option>
<option value="Bleach">Bleach</option>
...
<p>✅ 5 anime yüklendi (Bunny.net collection'ları)</p>
<p>Mevcut anime'ler: Naruto, Bleach, One Piece ve 2 daha...</p>
```

---

## 🧪 Test Senaryoları

### **Test 1: Mevcut Collection'lar Var**

**Bunny.net Dashboard:**
- "Naruto" collection
- "Bleach" collection
- "One Piece" collection

**Beklenen Sonuç:**
```
Dropdown:
📺 Anime seçin (3 anime)
  - Naruto
  - Bleach
  - One Piece

Mesaj:
✅ 3 anime yüklendi (Bunny.net collection'ları)
Mevcut anime'ler: Naruto, Bleach, One Piece
```

---

### **Test 2: Hiç Collection Yok**

**Bunny.net Dashboard:**
- (Boş)

**Beklenen Sonuç:**
```
Dropdown:
⚠️ Collection bulunamadı - Yeni ekleyin

Mesaj:
⚠️ Henüz collection yok. "+ Anime Ekle" ile yeni anime ekleyin.
```

---

### **Test 3: API Hatası**

**Durum:**
- Yanlış API Key
- veya Network hatası

**Beklenen Sonuç:**
```
Console:
❌ Collection yüklenemedi: Invalid API key

UI:
Hata mesajı: "Anime listesi yüklenemedi: Invalid API key"
```

---

## 🔧 Sorun Giderme

### **"Collection bulunamadı" Hatası**

**Kontrol 1: API Key**
```javascript
// .env dosyasında
VITE_BUNNY_STREAM_API_KEY=your-api-key
VITE_BUNNY_LIBRARY_ID=your-library-id
```

**Kontrol 2: Bunny.net Dashboard**
```
1. https://dash.bunny.net/ → Login
2. Stream → Library seç
3. Collections sekmesi → Collection'lar var mı?
```

**Kontrol 3: Browser Console**
```
F12 → Console → Hata mesajları var mı?
```

---

### **"CORS Hatası"**

**Sorun:**
```
Access to fetch at 'https://video.bunnycdn.com/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Çözüm:**
Bunny.net API'si CORS destekler, bu hata olmamalı. Eğer oluyorsa:
1. API Key'i kontrol edin
2. Library ID'yi kontrol edin
3. Bunny.net dashboard'dan izinleri kontrol edin

---

### **"Yükleniyor..." Sonsuz Döngü**

**Sorun:**
Dropdown sürekli "📋 Yükleniyor..." gösteriyor

**Çözüm:**
```javascript
// Console'da kontrol et
console.log('Loading state:', loadingAnime)
console.log('Anime list:', animeList)
```

**Muhtemel Sebepler:**
1. API çağrısı hiç tamamlanmıyor
2. `finally` bloğu çalışmıyor
3. Network hatası

---

## 📝 Kod Akışı

```javascript
// 1. Component mount
useEffect(() => {
  loadAnimeList()
}, [])

// 2. Collection'ları yükle
const loadAnimeList = async () => {
  setLoadingAnime(true)
  
  try {
    // 3. Bunny.net API çağrısı
    const result = await listCollections()
    
    // 4. Başarılı ise listeyi doldur
    if (result.success) {
      const animeNames = result.collections.map(c => c.name)
      setAnimeList(animeNames)
    }
  } catch (err) {
    setError(err.message)
  } finally {
    // 5. Loading state'i kapat
    setLoadingAnime(false)
  }
}

// 6. Dropdown render
<select disabled={loadingAnime}>
  <option value="">
    {loadingAnime ? 'Yükleniyor...' : 'Anime seçin...'}
  </option>
  {animeList.map(anime => (
    <option value={anime}>{anime}</option>
  ))}
</select>
```

---

## ✅ Özet

**Anime dropdown artık:**
1. ✅ Bunny.net collection'larından otomatik doldurulur
2. ✅ Sayfa açıldığında otomatik yüklenir
3. ✅ Loading state gösterir
4. ✅ Boş durum mesajı gösterir
5. ✅ Hata mesajları gösterir
6. ✅ Collection sayısını gösterir
7. ✅ İlk 3 anime'yi preview olarak gösterir
8. ✅ "+ Anime Ekle" ile yeni anime eklenebilir

**Test edin ve sonuçları paylaşın!** 🎌✨
