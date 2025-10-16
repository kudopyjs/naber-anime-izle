# 🎬 H.265 (HEVC) Video Encoding

## ✅ Güncelleme Tamamlandı!

Tüm video encoding işlemleri artık **H.265 (HEVC)** codec'i kullanıyor.

---

## 📊 H.265 vs H.264 Karşılaştırması

| Özellik | H.264 (AVC) | H.265 (HEVC) |
|---------|-------------|--------------|
| **Dosya Boyutu** | 1.0x | **0.5x** ✅ |
| **Kalite** | İyi | **Aynı/Daha İyi** ✅ |
| **Encoding Süresi** | Hızlı | Biraz Yavaş |
| **Tarayıcı Desteği** | %100 | %95+ |
| **Storage Maliyeti** | Normal | **%50 Daha Az** ✅ |
| **Bandwidth** | Normal | **%50 Daha Az** ✅ |

---

## 💰 Maliyet Tasarrufu

### Örnek: 100GB video koleksiyonu

**H.264 ile:**
- Storage: 100GB × $0.005 = **$0.50/ay**
- Bandwidth: 1TB × $0.01 = **$10.00/ay** (B2'den)
- **Toplam: $10.50/ay**

**H.265 ile:**
- Storage: 50GB × $0.005 = **$0.25/ay** ✅
- Bandwidth: 500GB × $0.01 = **$5.00/ay** (B2'den)
- **Toplam: $5.25/ay** ✅

**Tasarruf: %50!** 🎉

*Not: Cloudflare CDN kullanırsanız bandwidth ücretsiz olur!*

---

## 🔧 Güncellenmiş Dosyalar

### 1. Backend API (Node.js)
**Dosya:** `anime-streaming-ui/server/b2-upload-api.js`

```javascript
ffmpeg(inputPath)
  .outputOptions([
    '-c:v libx265',        // H.265 codec
    '-crf 28',             // CRF 28 (optimal)
    '-preset medium',
    '-tag:v hvc1',         // Apple uyumluluğu
    '-c:a aac',
    '-b:a 128k',
    // ...
  ])
```

### 2. Python Script
**Dosya:** `bunny_scripts/turkanime_to_b2.py`

```python
cmd = [
    'ffmpeg',
    '-i', input_path,
    '-c:v', 'libx265',      # H.265 codec
    '-crf', '28',           # CRF 28
    '-preset', 'medium',
    '-tag:v', 'hvc1',       # Apple uyumluluğu
    # ...
]
```

### 3. Dokümantasyon
- ✅ `B2_CLOUDFLARE_SETUP.md` - H.265 örnekleri eklendi
- ✅ `B2_QUICK_START.md` - Encoding ayarları güncellendi

---

## 🎯 Encoding Parametreleri

### CRF (Constant Rate Factor)
- **H.264:** CRF 23 (standart)
- **H.265:** CRF 28 (eşdeğer kalite)

**CRF Değerleri:**
- `18-22`: Çok yüksek kalite (büyük dosya)
- `23-28`: Yüksek kalite (önerilen) ✅
- `29-34`: Orta kalite (küçük dosya)

### Preset
- `ultrafast`: En hızlı, en büyük dosya
- `fast`: Hızlı, büyük dosya
- `medium`: Dengeli (önerilen) ✅
- `slow`: Yavaş, küçük dosya
- `veryslow`: En yavaş, en küçük dosya

**Öneri:** `medium` preset kullanın. `slow` sadece %5-10 daha küçük dosya üretir ama 2-3x daha yavaştır.

### Tag (hvc1)
```bash
-tag:v hvc1
```
Bu parametre **Apple cihazlarda** (iPhone, iPad, Safari) H.265 oynatımı için gereklidir.

---

## 🌐 Tarayıcı Desteği

### H.265 Desteği
- ✅ **Chrome/Edge** (90+): Destekliyor
- ✅ **Safari** (11+): Destekliyor
- ✅ **Firefox** (120+): Destekliyor (yeni)
- ⚠️ **Eski Tarayıcılar**: Desteklemiyor

### Fallback Stratejisi
Eski tarayıcılar için otomatik fallback:

1. **İlk deneme:** H.265 (HEVC)
2. **Fallback:** H.264 (AVC) - gerekirse

**Uygulama:** Video player otomatik olarak desteklenen codec'i seçer.

---

## 📱 Mobil Uyumluluk

### iOS/Safari
- ✅ **iOS 11+**: H.265 tam destek
- ✅ **Safari 11+**: H.265 tam destek
- ⚠️ **Eski iOS**: H.264 fallback gerekir

### Android
- ✅ **Android 5.0+**: H.265 hardware decode
- ✅ **Chrome Android**: Tam destek
- ⚠️ **Eski cihazlar**: Performans sorunu olabilir

---

## ⚡ Encoding Süresi

### Örnek: 1 saatlik 1080p video

**H.264:**
- CPU: ~10-15 dakika
- GPU (NVENC): ~5 dakika

**H.265:**
- CPU: ~20-30 dakika (2x yavaş)
- GPU (NVENC): ~8-10 dakika

**Öneri:** Eğer NVIDIA GPU'nuz varsa, hardware encoding kullanın:
```bash
-c:v hevc_nvenc -crf 28
```

---

## 🔍 Kalite Kontrolü

### Video'yu Test Etme

```bash
# Video bilgilerini göster
ffprobe -v error -show_entries stream=codec_name,width,height,bit_rate \
  -of default=noprint_wrappers=1 video.mp4

# Beklenen çıktı:
# codec_name=hevc
# width=1920
# height=1080
```

### Dosya Boyutu Karşılaştırma

```bash
# H.264 ile encode et
ffmpeg -i input.mp4 -c:v libx264 -crf 23 output_h264.mp4

# H.265 ile encode et
ffmpeg -i input.mp4 -c:v libx265 -crf 28 output_h265.mp4

# Boyutları karşılaştır
ls -lh output_*.mp4
```

**Beklenen sonuç:** H.265 dosyası %40-50 daha küçük olmalı.

---

## 🐛 Sorun Giderme

### Problem: "Unknown encoder 'libx265'"

**Çözüm:** FFmpeg'in H.265 desteği ile kurulu olduğundan emin olun:

```bash
# FFmpeg codec'lerini kontrol et
ffmpeg -codecs | grep hevc

# Beklenen çıktı:
# DEV.LS h265    H.265 / HEVC (High Efficiency Video Coding)
```

Eğer yoksa, FFmpeg'i yeniden kurun:
```bash
# Windows
choco install ffmpeg-full

# Linux
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

### Problem: Video oynatılamıyor

**Çözüm 1:** Tarayıcı H.265 destekliyor mu kontrol edin:
```javascript
// Browser console'da çalıştırın
document.createElement('video').canPlayType('video/mp4; codecs="hvc1"')
// "probably" veya "maybe" dönmeli
```

**Çözüm 2:** `-tag:v hvc1` parametresini ekleyin (Apple cihazlar için).

### Problem: Encoding çok yavaş

**Çözüm:** Preset'i hızlandırın:
```bash
-preset fast    # medium yerine
-preset veryfast # çok hızlı ama büyük dosya
```

Veya GPU encoding kullanın:
```bash
-c:v hevc_nvenc  # NVIDIA GPU
-c:v hevc_qsv    # Intel Quick Sync
-c:v hevc_videotoolbox  # macOS
```

---

## 📚 Ek Kaynaklar

### FFmpeg Dokümantasyonu
- H.265 Encoding Guide: https://trac.ffmpeg.org/wiki/Encode/H.265
- CRF Guide: https://trac.ffmpeg.org/wiki/Encode/H.265#ConstantRateFactorCRF

### Tarayıcı Desteği
- Can I Use HEVC: https://caniuse.com/hevc
- MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs#hevc_h.265

### Performans
- Hardware Encoding: https://trac.ffmpeg.org/wiki/HWAccelIntro

---

## ✅ Checklist

H.265 encoding doğru çalışıyor mu?

- [ ] FFmpeg H.265 desteği var (`ffmpeg -codecs | grep hevc`)
- [ ] Backend API güncellenmiş (`b2-upload-api.js`)
- [ ] Python script güncellenmiş (`turkanime_to_b2.py`)
- [ ] Test video encode edildi
- [ ] Video tarayıcıda oynatılıyor
- [ ] Dosya boyutu %40-50 daha küçük
- [ ] Mobil cihazlarda test edildi

---

## 🎉 Sonuç

Artık tüm videolarınız **H.265 (HEVC)** ile encode ediliyor!

**Faydalar:**
- ✅ %50 daha az storage maliyeti
- ✅ %50 daha az bandwidth kullanımı
- ✅ Aynı video kalitesi
- ✅ Daha hızlı yükleme süreleri

**Sonraki adımlar:**
1. Yeni videoları H.265 ile yükleyin
2. Mevcut videoları kademeli olarak yeniden encode edin (opsiyonel)
3. Maliyet tasarrufunun keyfini çıkarın! 💰

---

**Son Güncelleme:** 2025-01-16
