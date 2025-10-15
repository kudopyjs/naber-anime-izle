# 🚀 Bunny.net Hızlı Başlangıç

## ✅ Yapılanlar

### 1. Bunny.net Entegrasyonu Eklendi
- ✅ `src/utils/bunnyUpload.js` - Bunny API fonksiyonları
- ✅ Upload sayfası güncellendi (2 yöntem: Dosya + URL)
- ✅ Progress bar eklendi
- ✅ Hata yönetimi
- ✅ Türkçe arayüz

### 2. Özellikler

**Upload Yöntemleri:**
1. **📁 Dosya Yükle** - Bilgisayardan video yükle
2. **🔗 URL'den Aktar** - Başka sunucudan direkt aktar

**Bunny.net Fonksiyonları:**
- `uploadVideoFile()` - Dosya yükleme (progress tracking ile)
- `uploadFromURL()` - URL'den aktarma
- `getVideoInfo()` - Video bilgisi alma
- `deleteVideo()` - Video silme
- `createCollection()` - Klasör oluşturma
- `listVideos()` - Tüm videoları listeleme

## 🎯 Nasıl Kullanılır?

### Adım 1: Bunny.net Hesabı Oluştur

1. https://bunny.net → Kayıt ol
2. Dashboard → **Stream** → **Add Stream Library**
3. İsim ver: `anime-videos`
4. Bölge seç: **Europe**
5. Oluştur

### Adım 2: API Bilgilerini Al

1. Library'nize tıklayın
2. **API** sekmesine gidin
3. Kopyalayın:
   - API Key: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Library ID: `12345`
4. **Overview** sekmesinden:
   - CDN Hostname: `vz-xxxxxxxx-xxx.b-cdn.net`

### Adım 3: .env Dosyasını Güncelle

`.env` dosyasını açın ve ekleyin:

```env
# Bunny Stream Configuration
VITE_BUNNY_STREAM_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_BUNNY_LIBRARY_ID=12345
VITE_BUNNY_CDN_HOSTNAME=vz-xxxxxxxx-xxx.b-cdn.net
```

**Gerçek değerlerinizi yazın!**

### Adım 4: Dev Server'ı Yeniden Başlat

```bash
# Ctrl+C ile durdur
npm run dev
```

### Adım 5: Test Et!

1. http://localhost:5173/signup → Admin hesabı oluştur
2. Login yap
3. Avatar → **"📤 Upload Video"**
4. Formu doldur ve video yükle
5. Başarı! 🎉

## 📊 Upload Sayfası Özellikleri

### Dosya Yükleme
```
1. "📁 Dosya Yükle" seçeneğini seç
2. Anime başlığı gir
3. Açıklama yaz
4. Genre, Season, Episode seç
5. Thumbnail yükle (opsiyonel)
6. Video dosyası seç
7. "Video Yükle" butonuna tıkla
8. Progress bar'ı izle
9. Başarı mesajı! ✓
```

### URL'den Aktarma
```
1. "🔗 URL'den Aktar" seçeneğini seç
2. Anime başlığı gir
3. Açıklama yaz
4. Video URL'sini yapıştır
   Örn: https://example.com/video.mp4
5. Genre, Season, Episode seç
6. "URL'den Aktar" butonuna tıkla
7. Bunny.net'e aktarılıyor...
8. Başarı! ✓
```

## 🔄 Eski Arşivden Toplu Aktarma

### Python Script ile

1. `bunny_transfer.py` oluştur (BUNNY_SETUP_TR.md'de tam kod var)
2. API bilgilerini gir
3. Kaynak klasörü belirt
4. Çalıştır:

```bash
python bunny_transfer.py
```

### URL Listesinden

`video_urls.txt` oluştur:
```
https://eski-arsiv.com/anime/ep1.mp4|Anime - Bölüm 1
https://eski-arsiv.com/anime/ep2.mp4|Anime - Bölüm 2
```

Python scripti ile aktar (BUNNY_SETUP_TR.md'de kod var)

## 💾 Veri Yapısı

Yüklenen videolar localStorage'a şu formatta kaydedilir:

```javascript
{
  id: 1234567890,
  title: "Naruto",
  description: "Ninja anime",
  genre: "Action",
  season: 1,
  episode: 1,
  uploadedBy: "admin",
  uploaderId: "user123",
  uploadedAt: "2025-10-14T...",
  
  // Bunny.net bilgileri
  bunnyVideoId: "abc-123-def",
  bunnyEmbedUrl: "https://iframe.mediadelivery.net/embed/12345/abc-123-def",
  bunnyThumbnailUrl: "https://vz-xxx.b-cdn.net/thumbnail/abc-123-def.jpg",
  
  // Fallback (Bunny yoksa)
  thumbnailUrl: "blob:...",
  videoUrl: "blob:...",
  videoSourceUrl: "https://..."
}
```

## 🎬 Video Player Entegrasyonu

Watch sayfasında Bunny player kullanmak için:

```javascript
// src/pages/Watch.jsx
{anime.bunnyEmbedUrl && (
  <iframe
    src={anime.bunnyEmbedUrl}
    style={{
      border: 0,
      position: 'absolute',
      top: 0,
      height: '100%',
      width: '100%'
    }}
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
    allowFullScreen
  />
)}
```

## ⚠️ Önemli Notlar

### Bunny Yapılandırılmamışsa
- Upload sayfasında sarı uyarı görünür
- Videolar sadece localStorage'a kaydedilir
- URL'den aktarma çalışmaz
- Dosya yükleme lokal olarak çalışır

### Bunny Yapılandırıldıysa
- Videolar Bunny.net'e yüklenir
- Otomatik encoding yapılır
- CDN üzerinden stream edilir
- Progress tracking çalışır
- URL'den aktarma aktif olur

## 📚 Detaylı Dokümantasyon

**Tam kurulum rehberi:** `BUNNY_SETUP_TR.md`

İçerik:
- Adım adım Bunny.net kurulumu
- Python transfer scriptleri
- API kullanım örnekleri
- Güvenlik önerileri
- Maliyet hesaplama
- Sorun giderme

## 🎯 Hızlı Test

```bash
# 1. .env dosyasını kontrol et
cat .env

# 2. Dev server başlat
npm run dev

# 3. Tarayıcıda test et
# - Signup → Admin hesabı
# - Login
# - Avatar → Upload Video
# - Test upload yap
```

## ✅ Checklist

- [ ] Bunny.net hesabı oluşturuldu
- [ ] Stream Library oluşturuldu
- [ ] API Key ve Library ID alındı
- [ ] `.env` dosyası güncellendi
- [ ] Dev server yeniden başlatıldı
- [ ] Admin hesabı oluşturuldu
- [ ] Test upload yapıldı
- [ ] Video başarıyla yüklendi

## 🆘 Sorun mu Var?

### "Bunny.net yapılandırılmamış" uyarısı
**Çözüm:** `.env` dosyasını kontrol edin, dev server'ı yeniden başlatın

### "Video yüklenemedi" hatası
**Çözüm:** 
- API Key doğru mu?
- Bunny hesabında kredi var mı?
- Dosya boyutu 5GB'dan küçük mü?

### Progress bar çalışmıyor
**Çözüm:** Normal, sadece dosya upload'da çalışır. URL aktarmada çalışmaz.

### URL'den aktarma çalışmıyor
**Çözüm:** 
- Bunny.net yapılandırıldı mı?
- URL direkt video dosyası mı? (.mp4, .mkv vb.)
- URL erişilebilir mi?

## 🚀 Sonraki Adımlar

1. ✅ Bunny.net kurulumunu tamamla
2. ✅ Test upload yap
3. 🔄 Eski arşivden videoları aktar
4. 🔄 Watch sayfasına Bunny player ekle
5. 🔄 Backend API oluştur (güvenlik için)
6. 🔄 Production deployment

**Başarılar! 🎌✨**
