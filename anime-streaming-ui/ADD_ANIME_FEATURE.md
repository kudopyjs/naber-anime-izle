# ➕ Anime Ekleme Özelliği

## ✨ Yeni Özellik

**"+ Anime Ekle" butonu ile:**
1. ✅ Modal açılır
2. ✅ Anime adı girilir
3. ✅ Bunny.net'te collection oluşturulur
4. ✅ Anime listesi yenilenir
5. ✅ Yeni anime otomatik seçilir

---

## 🎯 Kullanım Akışı

### **1. "+ Anime Ekle" Butonuna Tıkla**
```
Upload sayfası → Anime Seç dropdown'unun yanında
```

### **2. Modal Açılır**
```
🎬 Yeni Anime Ekle
[Anime adı input]
[Ekle] [İptal]
```

### **3. Anime Adını Gir**
```
Örnek: "Bleach"
```

### **4. "Ekle" Butonuna Tıkla**
```
📁 Anime Ekleniyor...
[Loading spinner]
Bunny.net'te collection oluşturuluyor...
```

### **5. İşlem Tamamlanır**
```
✅ Collection oluşturuldu
🔄 Anime listesi yenilendi
📺 "Bleach" otomatik seçildi
```

---

## 🔍 Console Çıktısı

### **Yeni Anime Ekleme:**
```javascript
📁 Yeni anime ekleniyor: Bleach
📁 Yeni collection oluşturuluyor: Bleach
✅ Collection oluşturuldu/bulundu: Bleach
📦 Collection ID: abc-123-def-456
🆕 Yeni collection oluşturuldu
🔄 Anime listesi yenileniyor...
📋 Bunny.net collection'ları yükleniyor...
✅ 6 anime bulundu: ['Naruto', 'Bleach', ...]
✅ Anime başarıyla eklendi: Bleach
```

### **Mevcut Anime Ekleme (Tekrar):**
```javascript
📁 Yeni anime ekleniyor: Naruto
✅ Mevcut collection bulundu: Naruto
✅ Collection oluşturuldu/bulundu: Naruto
📦 Collection ID: xyz-789-ghi-012
♻️ Mevcut collection kullanıldı
🔄 Anime listesi yenileniyor...
✅ 6 anime bulundu: ['Naruto', 'Bleach', ...]
✅ Anime başarıyla eklendi: Naruto
```

---

## 🎨 UI Durumları

### **1. Normal Durum**
```jsx
Modal Başlık: 🎬 Yeni Anime Ekle
Input: Aktif
Ekle Butonu: Aktif
İptal Butonu: Aktif
```

### **2. Loading Durumu**
```jsx
Modal Başlık: 📁 Anime Ekleniyor...
Input: Disabled
Loading Spinner: Görünür
Mesaj: "Bunny.net'te collection oluşturuluyor..."
Ekle Butonu: Disabled, "Ekleniyor..."
İptal Butonu: Disabled
```

### **3. Başarı Durumu**
```jsx
Modal: Kapanır
Dropdown: Yeni anime seçili
Anime Listesi: Güncellenmiş
```

### **4. Hata Durumu**
```jsx
Modal: Açık kalır
Hata Mesajı: Gösterilir
Input: Aktif
Butonlar: Aktif
```

---

## 🔧 Teknik Detaylar

### **handleAddAnime Fonksiyonu**

```javascript
const handleAddAnime = async () => {
  const animeName = newAnimeName.trim()
  setAddingAnime(true)
  
  try {
    // 1. Bunny.net'te collection oluştur
    if (bunnyConfigured) {
      const { getOrCreateCollection } = await import('../utils/bunnyUpload')
      const result = await getOrCreateCollection(animeName)
      
      if (!result.success) {
        setError(`Collection oluşturulamadı: ${result.error}`)
        return
      }
      
      console.log(`Collection ID: ${result.collectionId}`)
      console.log(result.created ? '🆕 Yeni' : '♻️ Mevcut')
    }
    
    // 2. Anime listesini yenile
    if (bunnyConfigured) {
      await loadAnimeList()
    } else {
      setAnimeList([...animeList, animeName])
    }
    
    // 3. Yeni anime'yi seç
    setSelectedAnime(animeName)
    setShowAddAnimeModal(false)
    
  } catch (err) {
    setError(`Anime eklenemedi: ${err.message}`)
  } finally {
    setAddingAnime(false)
  }
}
```

### **getOrCreateCollection Fonksiyonu**

```javascript
export async function getOrCreateCollection(name) {
  // 1. Önce var mı kontrol et
  const existingId = await findCollectionByName(name)
  if (existingId) {
    return {
      success: true,
      collectionId: existingId,
      created: false // Mevcut collection
    }
  }
  
  // 2. Yoksa oluştur
  const result = await createCollection(name)
  return {
    ...result,
    created: true // Yeni collection
  }
}
```

### **createCollection Fonksiyonu**

```javascript
export async function createCollection(name) {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/collections`,
    {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    }
  )
  
  const data = await response.json()
  return {
    success: true,
    collectionId: data.guid,
    created: true
  }
}
```

---

## 🧪 Test Senaryoları

### **Test 1: Yeni Anime Ekleme**

**Adımlar:**
1. Upload sayfasına git
2. "+ Anime Ekle" butonuna tıkla
3. "Bleach" yaz
4. "Ekle" butonuna tıkla

**Beklenen:**
```
✅ Modal açıldı
✅ "Bleach" yazıldı
✅ Loading gösterildi
✅ Bunny.net'te "Bleach" collection'ı oluşturuldu
✅ Anime listesi yenilendi
✅ "Bleach" otomatik seçildi
✅ Modal kapandı
```

**Console:**
```
📁 Yeni anime ekleniyor: Bleach
📁 Yeni collection oluşturuluyor: Bleach
✅ Collection oluşturuldu: Bleach
🆕 Yeni collection oluşturuldu
🔄 Anime listesi yenileniyor...
✅ 6 anime bulundu
✅ Anime başarıyla eklendi: Bleach
```

---

### **Test 2: Mevcut Anime Ekleme**

**Adımlar:**
1. "+ Anime Ekle" butonuna tıkla
2. "Naruto" yaz (zaten var)
3. "Ekle" butonuna tıkla

**Beklenen:**
```
✅ Modal açıldı
✅ "Naruto" yazıldı
✅ Loading gösterildi
✅ Mevcut "Naruto" collection'ı bulundu
✅ Anime listesi yenilendi
✅ "Naruto" otomatik seçildi
✅ Modal kapandı
```

**Console:**
```
📁 Yeni anime ekleniyor: Naruto
✅ Mevcut collection bulundu: Naruto
♻️ Mevcut collection kullanıldı
🔄 Anime listesi yenileniyor...
✅ 6 anime bulundu
✅ Anime başarıyla eklendi: Naruto
```

---

### **Test 3: Boş İsim**

**Adımlar:**
1. "+ Anime Ekle" butonuna tıkla
2. Boş bırak
3. "Ekle" butonuna tıkla

**Beklenen:**
```
✅ "Ekle" butonu disabled
✅ Hiçbir şey olmuyor
```

---

### **Test 4: Enter Tuşu**

**Adımlar:**
1. "+ Anime Ekle" butonuna tıkla
2. "One Piece" yaz
3. Enter tuşuna bas

**Beklenen:**
```
✅ Anime eklendi (Enter tuşu çalıştı)
✅ Modal kapandı
```

---

### **Test 5: İptal**

**Adımlar:**
1. "+ Anime Ekle" butonuna tıkla
2. "Attack on Titan" yaz
3. "İptal" butonuna tıkla

**Beklenen:**
```
✅ Modal kapandı
✅ Hiçbir şey eklenmedi
✅ Input temizlendi
```

---

## 📊 Özellik Karşılaştırması

| Özellik | Öncesi | Sonrası |
|---------|--------|---------|
| Anime ekleme | ❌ Yok | ✅ Modal ile |
| Collection oluşturma | ❌ Manuel | ✅ Otomatik |
| Liste yenileme | ❌ Manuel | ✅ Otomatik |
| Loading state | ❌ Yok | ✅ Var |
| Hata yönetimi | ❌ Basit | ✅ Detaylı |
| Console logları | ❌ Az | ✅ Çok |

---

## ✅ Kontrol Listesi

- [ ] "+ Anime Ekle" butonu görünüyor
- [ ] Modal açılıyor
- [ ] Anime adı giriliyor
- [ ] Loading state gösteriliyor
- [ ] Bunny.net'te collection oluşturuluyor
- [ ] Anime listesi yenileniyor
- [ ] Yeni anime otomatik seçiliyor
- [ ] Modal kapanıyor
- [ ] Console logları doğru

---

## 🎉 Özet

**Anime ekleme özelliği artık:**
1. ✅ Modal ile kullanıcı dostu
2. ✅ Bunny.net'te otomatik collection oluşturur
3. ✅ Anime listesini otomatik yeniler
4. ✅ Loading state gösterir
5. ✅ Hata yönetimi yapar
6. ✅ Console'da detaylı log verir
7. ✅ Enter tuşu ile çalışır
8. ✅ Mevcut anime'leri kontrol eder

**Artık anime eklemek çok kolay!** 🎌✨
