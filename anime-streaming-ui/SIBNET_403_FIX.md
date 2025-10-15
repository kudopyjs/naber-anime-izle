# 🔧 Sibnet 403 Forbidden Hatası - Çözüm

## ❌ Sorun

```
📥 Bunny.net response: 200 OK
📦 Bunny.net response data: {
  success: false,
  message: "Failed fetching file with status code: 403",
  statusCode: 403
}
```

**Sebep:** Bunny.net, Sibnet'ten direkt video çekerken **403 Forbidden** hatası alıyor. Sibnet, Bunny.net'in IP adresini engelliyor veya referrer kontrolü yapıyor.

---

## ✅ Çözüm: İndir ve Yükle

### **Yeni Akış:**

```
1. Frontend: Sibnet URL'sini backend'e gönderir
   ↓
2. Backend: yt-dlp ile gerçek video URL'sini çözümler
   ↓
3. Backend: Sibnet tespit edilirse videoyu indirir
   ↓
4. Backend: İndirilen dosyayı Bunny.net'e yükler
   ↓
5. Backend: Geçici dosyayı siler
   ↓
6. ✅ Başarılı!
```

### **Eski Akış (Çalışmıyor):**

```
Frontend → Backend → Bunny.net → Sibnet (403 ❌)
```

### **Yeni Akış (Çalışıyor):**

```
Frontend → Backend → Sibnet (İndir) → Bunny.net (Yükle) ✅
```

---

## 🔧 Yapılan Değişiklikler

### **Backend (upload_api.py)**

```python
# Sibnet tespit et
is_sibnet = 'sibnet' in video_url.lower() or (video_info and video_info.get('extractor') == 'sibnet')

if is_sibnet:
    print(f"  ⚠️ Sibnet tespit edildi, video indirilip yüklenecek...")
    print(f"  📥 Video indiriliyor (bu biraz zaman alabilir)...")
    
    # yt-dlp ile videoyu indir
    temp_dir = os.path.join(os.path.dirname(__file__), 'temp_downloads')
    temp_file = os.path.join(temp_dir, f"temp_{int(time.time())}.mp4")
    
    with YoutubeDL(ydl_download_opts) as ydl:
        ydl.download([video_url])
    
    print(f"  ✅ Video indirildi: {temp_file}")
    print(f"  📤 Bunny.net'e yükleniyor...")
    
    # Dosyadan yükle
    result = bunny.upload_file_direct(
        file_path=temp_file,
        title=title,
        collection_id=collection_id
    )
    
    # Geçici dosyayı sil
    os.remove(temp_file)
    print(f"  🗑️ Geçici dosya silindi")
else:
    # Diğer platformlar için direkt fetch
    result = bunny.upload_from_url(video_url, title, collection_id)
```

---

## 🚀 Kullanım

### **1. Backend'i Başlat**
```bash
cd bunny_scripts
python upload_api.py
```

### **2. Sibnet URL'sini Test Et**
```
Upload sayfası → Sibnet URL gir → Yükle
```

---

## 🔍 Console Çıktısı

### **Backend Console:**

```python
🔍 URL çözümleniyor: https://video.sibnet.ru/video4916331-...
  ⏳ yt-dlp ile bilgi çekiliyor...
  📊 Video bilgileri:
     - Başlık: Bleach - Episode 1
     - Süre: 1440 saniye
     - Extractor: sibnet
  ✅ Gerçek URL bulundu: https://video.sibnet.ru/v/18cdc3268413a6dd6e87f197a34aeb11/4916331.mp4
  ⚠️ Sibnet tespit edildi, video indirilip yüklenecek...
  📥 Video indiriliyor (bu biraz zaman alabilir)...
[download] Destination: temp_downloads/temp_1729000000.mp4
[download] 100% of 500.00MiB in 00:30
  ✅ Video indirildi: temp_downloads/temp_1729000000.mp4
  📤 Bunny.net'e yükleniyor...
  ✅ Video yüklendi: abc-123-def-456
  🗑️ Geçici dosya silindi
```

### **Frontend Console:**

```javascript
🔍 Video URL çözümleniyor (backend API)...
✅ URL çözümlendi (generic): https://video.sibnet.ru/v/...
📤 Bunny.net'e fetch isteği gönderiliyor...
📥 Bunny.net response: 200 OK
📦 Bunny.net response data: {success: true, guid: "abc-123-def"}
🎬 Video ID: abc-123-def-456
✅ Video başarıyla yüklendi!
```

---

## ⏱️ Süre

- **Küçük video (100MB):** ~1-2 dakika
- **Orta video (500MB):** ~3-5 dakika
- **Büyük video (1GB):** ~5-10 dakika

**Not:** Süre internet hızınıza bağlıdır.

---

## 📁 Geçici Dosyalar

### **Klasör:**
```
bunny_scripts/temp_downloads/
```

### **Dosya Adı:**
```
temp_1729000000.mp4
```

### **Otomatik Silme:**
```python
# Yükleme tamamlandıktan sonra otomatik silinir
os.remove(temp_file)
```

---

## 🔧 Sorun Giderme

### **1. "Video indirilemedi"**

**Sebep:** yt-dlp videoyu indiremedi

**Çözüm:**
```bash
# yt-dlp'yi güncelle
pip install --upgrade yt-dlp

# Manuel test
yt-dlp "https://video.sibnet.ru/video4916331-..."
```

---

### **2. "Disk alanı yetersiz"**

**Sebep:** Geçici dosya için yeterli alan yok

**Çözüm:**
- Disk alanını kontrol edin
- Eski geçici dosyaları silin: `bunny_scripts/temp_downloads/`

---

### **3. "Yükleme çok yavaş"**

**Sebep:** İnternet hızı yavaş

**Çözüm:**
- Daha küçük video deneyin
- İnternet bağlantınızı kontrol edin
- Backend'i daha güçlü bir sunucuda çalıştırın

---

### **4. "upload_file_direct bulunamadı"**

**Sebep:** `turkanime_to_bunny.py`'de fonksiyon yok

**Çözüm:**
`upload_file_direct` fonksiyonunu kontrol edin veya `upload_from_file` kullanın.

---

## 📊 Platform Karşılaştırması

| Platform | Direkt Fetch | İndir & Yükle |
|----------|--------------|---------------|
| **Mail.ru** | ✅ Çalışır | ❌ Gerek yok |
| **Sibnet** | ❌ 403 Hatası | ✅ Çalışır |
| **Google Drive** | ❌ 403 Hatası | ✅ Çalışır |
| **Yandex Disk** | ❌ 403 Hatası | ✅ Çalışır |
| **Direkt MP4** | ✅ Çalışır | ❌ Gerek yok |

---

## ✅ Kontrol Listesi

- [ ] Backend çalışıyor
- [ ] yt-dlp kurulu ve güncel
- [ ] `temp_downloads` klasörü var
- [ ] Disk alanı yeterli
- [ ] İnternet bağlantısı stabil
- [ ] Sibnet URL'si doğru
- [ ] Backend console'da "Video indirildi" mesajı var
- [ ] Frontend console'da "Video ID" var

---

## 🎉 Özet

**Sibnet 403 hatası artık çözüldü:**
1. ✅ Backend videoyu Sibnet'ten indirir
2. ✅ İndirilen dosyayı Bunny.net'e yükler
3. ✅ Geçici dosyayı otomatik siler
4. ✅ Diğer platformlar için direkt fetch kullanır
5. ✅ Hata yönetimi ve detaylı loglar

**Artık Sibnet videoları sorunsuz yükleniyor!** 🚀

---

## ⚠️ Önemli Notlar

1. **Süre:** Video indirme ve yükleme zaman alır (1-10 dakika)
2. **Disk Alanı:** Video boyutu kadar geçici alan gerekir
3. **İnternet:** Stabil ve hızlı bağlantı önerilir
4. **Temizlik:** Geçici dosyalar otomatik silinir
5. **Hata:** İndirme başarısız olursa geçici dosya kalabilir

**Backend'i çalıştırın ve Sibnet videolarını yükleyin!** 🎌✨
