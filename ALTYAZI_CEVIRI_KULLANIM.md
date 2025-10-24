# 🌍 Yapay Zeka ile Altyazı Çevirisi - Kullanım Kılavuzu

## 🎯 Özellikler

✅ **Akıllı Çeviri Sistemi**
- Google Gemini AI ile profesyonel çeviri
- Özel isimleri korur (karakter adları, yer adları)
- Anime terimlerini çevirmez (sensei, senpai, jutsu vb.)
- Doğal ve akıcı Türkçe

✅ **Cache Sistemi**
- Bir kere çevirir, sonsuza kadar kullanır
- Tekrar çeviri yapmaz, hızlı yükleme
- Disk alanı tasarrufu

✅ **Kolay Kullanım**
- Otomatik Türkçe altyazı seçeneği
- Tek tıkla çeviri
- Zaman damgalarını korur

---

## 📋 Kurulum Adımları

### 1️⃣ Google Gemini API Key Alma

1. **Google AI Studio'ya git:** https://aistudio.google.com/app/apikey
2. Google hesabınla giriş yap
3. **"Create API Key"** butonuna tıkla
4. **"Create API key in new project"** seç
5. API key'i kopyala (örnek: `AIzaSyD...`)

### 2️⃣ API Key'i Projeye Ekle

#### Windows PowerShell:
```powershell
cd c:\Users\kudre\Desktop\yeni\naber-anime-izle\server
notepad .env
```

#### .env dosyasına ekle:
```env
GEMINI_API_KEY=buraya_api_keyini_yapistir
PROXY_PORT=5000
```

**Örnek:**
```env
GEMINI_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PROXY_PORT=5000
```

### 3️⃣ Sunucuyu Başlat

```powershell
# Server klasörüne git
cd c:\Users\kudre\Desktop\yeni\naber-anime-izle\server

# Sunucuyu başlat
npm run hianime
```

Şu mesajı görmelisin:
```
============================================================
🚀 HiAnime Video Proxy Server
============================================================
✅ Server running on http://localhost:5000
📺 Proxy endpoint: http://localhost:5000/proxy?url=<video_url>
🔍 Video info: POST http://localhost:5000/get-video-info
🌍 Translate subtitle: POST http://localhost:5000/translate-subtitle
💚 Health check: http://localhost:5000/health
============================================================
```

### 4️⃣ Frontend'i Başlat

Yeni bir terminal aç:
```powershell
cd c:\Users\kudre\Desktop\yeni\naber-anime-izle\anime-streaming-ui
npm run dev
```

---

## 🎬 Nasıl Kullanılır?

### Adım 1: Anime İzlemeye Başla
1. Siteye git ve bir anime seç
2. Bir bölüm aç

### Adım 2: Türkçe Altyazı Seç
1. Video oynatıcıda **altyazı ikonuna** (CC) tıkla
2. **"Turkish (AI Translated)"** seçeneğini seç
3. İlk seçimde çeviri başlayacak (10-30 saniye sürer)
4. Çeviri tamamlandığında otomatik olarak gösterilecek

### Adım 3: Sonraki Kullanımlar
- Aynı bölümü tekrar izlediğinde çeviri **anında** yüklenir
- Tekrar çeviri yapmaz, cache'den kullanır
- Hızlı ve sorunsuz

---

## 🔧 Teknik Detaylar

### Cache Sistemi
- Çeviriler `server/subtitle_cache/` klasöründe saklanır
- Her altyazı için benzersiz bir hash oluşturulur
- Aynı altyazı tekrar çevrilmez

### Çeviri Kalitesi
Google Gemini'nin çeviri kalitesi:
- ✅ Doğal Türkçe
- ✅ Bağlam anlama
- ✅ Özel isimleri koruma
- ✅ Anime terminolojisi bilgisi

### Limitler
- **Ücretsiz:** Günde 1500 istek
- **Dakikada:** 60 istek
- **Bir bölüm:** ~1 istek (tüm altyazılar birlikte çevrilir)
- **Yeterli mi?** Evet! Günde 1500 bölüm izleyebilirsin 😄

---

## 🐛 Sorun Giderme

### ❌ "GEMINI_API_KEY not found" Hatası
**Çözüm:**
1. `.env` dosyasını kontrol et
2. API key'in doğru kopyalandığından emin ol
3. Sunucuyu yeniden başlat

### ❌ "Translation failed" Hatası
**Olası Sebepler:**
1. API key geçersiz veya süresi dolmuş
2. İnternet bağlantısı yok
3. Günlük limit aşıldı (1500 istek)

**Çözüm:**
1. API key'i kontrol et: https://aistudio.google.com/app/apikey
2. İnternet bağlantını kontrol et
3. Yarın tekrar dene (limit sıfırlanır)

### ❌ Altyazı Görünmüyor
**Çözüm:**
1. Altyazı menüsünden "Turkish (AI Translated)" seçili mi kontrol et
2. Tarayıcı konsolunu aç (F12) ve hata var mı bak
3. Sayfayı yenile (F5)

### ❌ Çeviri Çok Yavaş
**Normal Süre:** 10-30 saniye (ilk çeviri)
**Çok Yavaş:** 1+ dakika

**Çözüm:**
1. İnternet hızını kontrol et
2. Gemini API'nin durumunu kontrol et
3. Sunucuyu yeniden başlat

---

## 📊 Cache Yönetimi

### Cache Boyutu
- Her çevrilmiş altyazı: ~50-200 KB
- 100 bölüm: ~5-20 MB
- Çok yer kaplamaz!

### Cache Temizleme
Eski çevirileri silmek istersen:
```powershell
cd c:\Users\kudre\Desktop\yeni\naber-anime-izle\server
Remove-Item subtitle_cache\* -Force
```

---

## 🎨 Özelleştirme

### Çeviri Dilini Değiştir
`server/subtitleTranslator.js` dosyasında:
```javascript
// Satır 118'de prompt'u değiştir
const prompt = `Sen profesyonel bir anime altyazı çevirmenisin. İngilizce altyazıları İspanyolca'ya çevir.`
```

### Batch Boyutunu Ayarla
Daha hızlı çeviri için:
```javascript
// Satır 166'da batch size'ı artır
const batchSize = 20; // Varsayılan: 10
```

---

## 🔒 Güvenlik

### API Key Güvenliği
- ✅ `.env` dosyası `.gitignore`'da
- ✅ GitHub'a yüklenmez
- ✅ Sadece sunucuda kullanılır
- ❌ Frontend'e gönderilmez

### Öneriler
1. API key'ini kimseyle paylaşma
2. Public repo'larda `.env` dosyasını commit etme
3. Düzenli olarak API key'i yenile

---

## 📈 Performans İpuçları

### Hızlı Çeviri İçin
1. İyi internet bağlantısı kullan
2. Batch size'ı artır (max 20)
3. Cache'i temizleme, biriken çeviriler hızlandırır

### Maliyet Optimizasyonu
- Ücretsiz limit: Günde 1500 istek
- Bir bölüm: ~1 istek
- Cache sayesinde tekrar maliyet yok
- **Sonuç:** Tamamen ücretsiz! 🎉

---

## 🆘 Destek

### Hata Raporlama
Sorun yaşıyorsan:
1. Tarayıcı konsolunu kontrol et (F12)
2. Server loglarını kontrol et
3. Hata mesajını not al

### Faydalı Komutlar
```powershell
# Server loglarını göster
cd server
npm run hianime

# Cache durumunu kontrol et
dir subtitle_cache

# .env dosyasını kontrol et
type .env
```

---

## ✨ Gelecek Özellikler

Planladığımız özellikler:
- [ ] Çoklu dil desteği (İspanyolca, Fransızca vb.)
- [ ] Çeviri kalitesi ayarları
- [ ] Offline çeviri cache'i
- [ ] Toplu çeviri (tüm sezon)
- [ ] Çeviri önizleme

---

## 🎉 Başarıyla Kuruldu!

Artık anime izlerken yapay zeka destekli Türkçe altyazıların keyfini çıkarabilirsin!

**İyi Seyirler! 🍿**
