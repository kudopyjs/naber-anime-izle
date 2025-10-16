# 🚀 Encoding Hızlandırma Rehberi

## ⏱️ Encoding Süreleri (1 saatlik 1080p video)

| Yöntem | Süre | Dosya Boyutu | Kalite |
|--------|------|--------------|--------|
| **libx265 ultrafast** | ~5 dakika | 800 MB | İyi |
| **libx265 veryfast** | ~8 dakika | 600 MB | Çok İyi |
| **libx265 fast** | ~12 dakika | 500 MB | Mükemmel ✅ |
| **libx265 medium** | ~20 dakika | 450 MB | Mükemmel |
| **libx265 slow** | ~35 dakika | 400 MB | Mükemmel |
| **hevc_nvenc (GPU)** | ~2 dakika | 550 MB | Çok İyi 🚀 |

---

## 🎯 Önerilen Ayarlar

### Localhost Test İçin
```python
'-preset', 'veryfast',  # Hızlı test
'-crf', '30',           # Biraz daha düşük kalite
```

### Production İçin
```python
'-preset', 'fast',      # Hız/kalite dengesi ✅
'-crf', '28',           # Optimal kalite
```

---

## 🎮 GPU Encoding (NVIDIA)

### Kontrol Et
```bash
ffmpeg -encoders | grep hevc
```

**Beklenen çıktı:**
```
V..... hevc_nvenc           NVIDIA NVENC hevc encoder
```

### Kullanım

**turkanime_to_b2.py** dosyasında değiştir:

```python
cmd = [
    'ffmpeg',
    '-i', input_path,
    '-c:v', 'hevc_nvenc',   # GPU encoding!
    '-preset', 'fast',      # GPU preset
    '-cq', '28',            # CRF yerine CQ
    '-tag:v', 'hvc1',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-hls_time', '10',
    '-hls_playlist_type', 'vod',
    '-hls_segment_filename', segment_pattern,
    playlist_path
]
```

**Hız:** 10x daha hızlı! ⚡

---

## 🔧 Diğer Optimizasyonlar

### 1. Daha Küçük Segment Boyutu
```python
'-hls_time', '6',  # 10 yerine (daha küçük parçalar)
```

### 2. Daha Düşük Çözünürlük (Test için)
```python
'-vf', 'scale=1280:720',  # 1080p yerine 720p
```

### 3. İki Geçişli Encoding (Daha İyi Kalite)
```bash
# 1. Geçiş
ffmpeg -i input.mp4 -c:v libx265 -preset fast -b:v 2M -pass 1 -f null /dev/null

# 2. Geçiş
ffmpeg -i input.mp4 -c:v libx265 -preset fast -b:v 2M -pass 2 output.mp4
```

---

## 📊 Preset Karşılaştırması

### ultrafast
- **Hız:** ⚡⚡⚡⚡⚡
- **Boyut:** 📦📦📦📦
- **Kalite:** ⭐⭐⭐
- **Kullanım:** Test, preview

### veryfast
- **Hız:** ⚡⚡⚡⚡
- **Boyut:** 📦📦📦
- **Kalite:** ⭐⭐⭐⭐
- **Kullanım:** Hızlı production

### fast ✅
- **Hız:** ⚡⚡⚡
- **Boyut:** 📦📦
- **Kalite:** ⭐⭐⭐⭐⭐
- **Kullanım:** Önerilen!

### medium
- **Hız:** ⚡⚡
- **Boyut:** 📦
- **Kalite:** ⭐⭐⭐⭐⭐
- **Kullanım:** En iyi kalite

### slow
- **Hız:** ⚡
- **Boyut:** 📦
- **Kalite:** ⭐⭐⭐⭐⭐
- **Kullanım:** Arşiv

---

## 💡 Hızlı Test Komutu

```bash
# Sadece ilk 30 saniyeyi encode et (test için)
ffmpeg -i input.mp4 -t 30 \
  -c:v libx265 -preset fast -crf 28 \
  -c:a aac -b:a 128k \
  test_output.mp4
```

---

## 🎯 Sonuç

**Localhost için önerilen:**
```python
'-preset', 'fast',      # 2x hızlı
'-crf', '28',           # Kalite korunuyor
```

**GPU varsa:**
```python
'-c:v', 'hevc_nvenc',   # 10x hızlı!
'-preset', 'fast',
'-cq', '28',
```

**Şu anki değişiklik:** `medium` → `fast` = **2x daha hızlı!** 🚀

Artık 20 dakika yerine **~10 dakika** sürecek!
