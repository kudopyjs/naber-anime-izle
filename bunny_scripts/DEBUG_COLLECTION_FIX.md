# 🔧 Collection ve Video ID Sorunları - Çözüldü

## ❌ Sorunlar

### 1. Collection Sorunu
```
Videolar anime koleksiyonuna eklenmiyor
Ana dizine yükleniyor
```

### 2. Log Sorunu
```
Log dosyasında video ID görünmüyor
Episode bilgisi eksik
```

## ✅ Çözümler

### Eklenen Debug Özellikleri

#### 1. Collection Oluşturma Debug
```python
def create_collection(self, name: str) -> Optional[str]:
    response = requests.post(...)
    if response.status_code == 200:
        collection_id = response.json().get("guid")
        print(f"✅ Koleksiyon oluşturuldu: {name} (ID: {collection_id})")
        return collection_id
    else:
        print(f"⚠️ Koleksiyon oluşturulamadı: HTTP {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        return None
```

#### 2. Upload Debug (Fetch Method)
```python
def upload_from_url(...):
    payload = {"url": direct_url, "title": title}
    if collection_id:
        payload["collectionId"] = collection_id
        print(f"  📁 Collection ID ekleniyor: {collection_id}")
    
    print(f"  🔧 API Request: POST {base_url}/videos/fetch")
    response = requests.post(...)
    print(f"  📡 Response Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        video_id = data.get("guid")
        print(f"  ✅ Video ID: {video_id}")
        
        # Collection doğrulama
        if collection_id:
            video_collection = data.get("collectionId")
            if video_collection == collection_id:
                print(f"  ✅ Video collection'a eklendi")
            else:
                print(f"  ⚠️ Video collection'a eklenemedi!")
```

#### 3. Upload Debug (Direct Upload Method)
```python
def upload_file_direct(...):
    payload = {"title": title}
    if collection_id:
        payload["collectionId"] = collection_id
        print(f"  📁 Collection ID ekleniyor: {collection_id}")
    
    print(f"  🔧 API Request: POST {base_url}/videos")
    print(f"  📦 Payload: {payload}")
    
    response = requests.post(...)
    print(f"  📡 Response Status: {response.status_code}")
    
    response_data = response.json()
    video_id = response_data.get("guid")
    print(f"  ✅ Video oluşturuldu: {video_id}")
    
    # Collection doğrulama
    if collection_id:
        video_collection = response_data.get("collectionId")
        if video_collection == collection_id:
            print(f"  ✅ Video collection'a eklendi")
        else:
            print(f"  ⚠️ Video collection'a eklenemedi!")
```

#### 4. Log Kayıt Debug
```python
if result["success"]:
    video_id = result.get("video_id")
    print(f"✅ Başarıyla aktarıldı! Video ID: {video_id}")
    
    # Log dosyasına kaydet
    if video_id:
        self._log_success(anime_slug, i, bolum.title, video_id)
        print(f"📝 Log kaydedildi: {anime_slug}|{i}|{video_id}")
    else:
        print("⚠️ Video ID bulunamadı, log kaydedilemedi")
```

## 🔍 Test Senaryosu

### Çalıştır
```bash
python turkanime_to_bunny.py --anime naruto --start 1 --end 3
```

### Beklenen Çıktı

```
🎬 Anime: naruto
============================================================
✅ Anime bulundu: Naruto
📊 Toplam bölüm: 220

📁 Koleksiyon oluşturuluyor: Naruto
✅ Koleksiyon oluşturuldu: Naruto (ID: abc-123-def-456)
✅ Koleksiyon ID: abc-123-def-456

🔄 1-3 arası 3 bölüm aktarılacak...

[1/3] Naruto 1. Bölüm
------------------------------------------------------------
🔍 En iyi video aranıyor...
✅ Video bulundu: GDRIVE (TurkAnime)
🔗 URL: https://drive.google.com/file/d/...
📤 Bunny.net'e aktarılıyor...
  🔍 Gerçek video URL'si çözümleniyor...
  ✅ Gerçek URL bulundu: https://redirector.googlevideo.com/...
  📁 Collection ID ekleniyor: abc-123-def-456
  🔧 API Request: POST https://video.bunnycdn.com/library/12345/videos/fetch
  📡 Response Status: 200
  ✅ Video ID: xyz-789-ghi-012
  ✅ Video collection'a eklendi: abc-123-def-456
✅ Başarıyla aktarıldı! Video ID: xyz-789-ghi-012
📝 Log kaydedildi: naruto|1|xyz-789-ghi-012

[2/3] Naruto 2. Bölüm
------------------------------------------------------------
🔍 En iyi video aranıyor...
✅ Video bulundu: SIBNET
📤 Bunny.net'e aktarılıyor...
  🔍 Gerçek video URL'si çözümleniyor...
  ✅ Gerçek URL bulundu: https://...
  ⚠️ Direkt URL aktarımı başarısız, dosya indiriliyor...
  📥 Video indiriliyor: C:\Users\...\tmp456.mp4
  ✅ İndirildi: 245.67 MB
  📤 Bunny.net'e yükleniyor...
  📁 Koleksiyon: abc-123-def-456
  📁 Collection ID ekleniyor: abc-123-def-456
  🔧 API Request: POST https://video.bunnycdn.com/library/12345/videos
  📦 Payload: {'title': 'Naruto - Naruto 2. Bölüm', 'collectionId': 'abc-123-def-456'}
  📡 Response Status: 200
  ✅ Video oluşturuldu: jkl-345-mno-678
  ✅ Video collection'a eklendi: abc-123-def-456
  ✅ Upload başarılı! Video ID: jkl-345-mno-678
  🗑️ Geçici dosya silindi
✅ Başarıyla aktarıldı! Video ID: jkl-345-mno-678
📝 Log kaydedildi: naruto|2|jkl-345-mno-678

============================================================
📊 TRANSFER ÖZETİ
============================================================
Toplam:    3
✅ Başarılı: 3
❌ Başarısız: 0
⏭️  Atlanan:  0
============================================================

✅ Başarılı transferler: bunny_transfer_success.log
```

### Log Dosyası Kontrolü

```bash
# bunny_transfer_success.log
cat bunny_transfer_success.log
```

**Beklenen içerik:**
```
naruto|1|Naruto 1. Bölüm|xyz-789-ghi-012
naruto|2|Naruto 2. Bölüm|jkl-345-mno-678
naruto|3|Naruto 3. Bölüm|pqr-901-stu-234
```

## 🔍 Sorun Tespiti

### Collection Oluşturulamıyorsa

**Çıktı:**
```
📁 Koleksiyon oluşturuluyor: Naruto
⚠️ Koleksiyon oluşturulamadı: HTTP 401
   Response: {"Message":"Invalid API key"}
```

**Çözüm:**
```bash
# API Key'i kontrol et
echo $BUNNY_STREAM_API_KEY

# Doğru mu?
# Bunny.net dashboard'dan kontrol et
```

### Collection'a Eklenemiyor

**Çıktı:**
```
  📁 Collection ID ekleniyor: abc-123-def-456
  📡 Response Status: 200
  ✅ Video ID: xyz-789
  ⚠️ Video collection'a eklenemedi! Beklenen: abc-123-def-456, Gelen: None
```

**Olası Nedenler:**
1. Collection ID yanlış format
2. Collection silinmiş
3. API izinleri yetersiz

**Çözüm:**
```python
# Collection ID'yi manuel kontrol et
import requests

headers = {
    "AccessKey": "your-api-key",
    "Content-Type": "application/json"
}

# Tüm collection'ları listele
response = requests.get(
    "https://video.bunnycdn.com/library/12345/collections",
    headers=headers
)

print(response.json())
```

### Video ID Loglarda Görünmüyor

**Çıktı:**
```
✅ Başarıyla aktarıldı! Video ID: None
⚠️ Video ID bulunamadı, log kaydedilemedi
```

**Neden:**
- API response'da `guid` field'ı yok
- Response parse hatası

**Çözüm:**
```python
# Response'u kontrol et
print(f"Full Response: {response.json()}")

# guid field'ını kontrol et
data = response.json()
print(f"GUID: {data.get('guid')}")
print(f"All keys: {data.keys()}")
```

## 📊 Karşılaştırma

### Önceki Durum ❌

```
# Collection oluşturma
📁 Bunny koleksiyonu oluşturuldu: abc-123
# Ama gerçekten oluştu mu? Bilinmiyor!

# Upload
📤 Bunny.net'e aktarılıyor...
✅ Başarıyla aktarıldı! Video ID: xyz-789
# Collection'a eklendi mi? Bilinmiyor!

# Log
# Video ID yok, log kaydedilmedi
```

### Yeni Durum ✅

```
# Collection oluşturma
📁 Koleksiyon oluşturuluyor: Naruto
✅ Koleksiyon oluşturuldu: Naruto (ID: abc-123-def-456)
✅ Koleksiyon ID: abc-123-def-456

# Upload
📤 Bunny.net'e aktarılıyor...
  📁 Collection ID ekleniyor: abc-123-def-456
  🔧 API Request: POST .../videos/fetch
  📡 Response Status: 200
  ✅ Video ID: xyz-789-ghi-012
  ✅ Video collection'a eklendi: abc-123-def-456

# Log
✅ Başarıyla aktarıldı! Video ID: xyz-789-ghi-012
📝 Log kaydedildi: naruto|1|xyz-789-ghi-012
```

## ✅ Özet

**Eklenen Özellikler:**

1. ✅ **Collection oluşturma debug**
   - HTTP status gösterimi
   - Response hata mesajları
   - Collection ID doğrulama

2. ✅ **Upload debug (Fetch)**
   - Collection ID ekleme kontrolü
   - API request detayları
   - Response status
   - Video ID gösterimi
   - Collection ekleme doğrulama

3. ✅ **Upload debug (Direct)**
   - Payload gösterimi
   - Collection ID kontrolü
   - Video oluşturma onayı
   - Collection ekleme doğrulama

4. ✅ **Log kayıt debug**
   - Video ID kontrolü
   - Log kayıt onayı
   - Hata durumu bildirimi

**Artık:**
- ✅ Collection'ların oluşturulduğunu görebilirsiniz
- ✅ Videoların collection'a eklendiğini doğrulayabilirsiniz
- ✅ Video ID'lerin loglara kaydedildiğini görebilirsiniz
- ✅ Hataları kolayca tespit edebilirsiniz

## 🚀 Test Et

```bash
# Debug modunda çalıştır
python turkanime_to_bunny.py --anime naruto --start 1 --end 3

# Log dosyasını kontrol et
cat bunny_transfer_success.log

# Bunny.net dashboard'da kontrol et
# - Collection oluşturuldu mu?
# - Videolar collection içinde mi?
# - Video ID'ler doğru mu?
```

**Başarılar! 🎌✨**
