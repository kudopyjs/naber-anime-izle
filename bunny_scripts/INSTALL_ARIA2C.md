# 🚀 aria2c Kurulumu - Süper Hızlı İndirme

## ⚡ aria2c Nedir?

**aria2c**, çok hızlı bir indirme aracıdır:
- **16 paralel bağlantı** (normal: 1)
- **5-10x daha hızlı** indirme
- Resume desteği (kesintide kaldığı yerden devam)
- Otomatik retry

---

## 📥 Kurulum

### Windows (Chocolatey)

```powershell
# Chocolatey ile kur (önerilen)
choco install aria2

# Kontrol et
aria2c --version
```

**Beklenen çıktı:**
```
aria2 version 1.36.0
```

### Windows (Manuel)

1. İndir: https://github.com/aria2/aria2/releases
2. `aria2c.exe` dosyasını `C:\Windows\System32\` klasörüne kopyala
3. Kontrol et: `aria2c --version`

### Linux

```bash
sudo apt install aria2  # Ubuntu/Debian
sudo yum install aria2  # CentOS/RHEL
```

### macOS

```bash
brew install aria2
```

---

## 🎯 Kullanım

Script otomatik olarak aria2c'yi kullanacak:

```bash
python turkanime_to_b2.py --anime naruto --start 1 --end 1
```

**Çıktı:**
```
📥 Video indiriliyor (aria2c - 16x paralel)...
[#1 SIZE:45.2MiB/200MiB CN:16 DL:8.5MiB ETA:18s]
✅ İndirildi (aria2c): 200.00 MB
```

---

## 📊 Hız Karşılaştırması

| Yöntem | Paralel Bağlantı | Hız | Süre (200MB) |
|--------|------------------|-----|--------------|
| **aria2c** | 16 | ⚡⚡⚡⚡⚡ | ~30 saniye |
| **requests** | 1 | ⚡⚡⚡ | ~2 dakika |
| **yt-dlp** | 1 | ⚡⚡ | ~5 dakika |

---

## 🔧 Fallback Sistemi

Script otomatik olarak en hızlı yöntemi seçer:

```
1. aria2c dene (en hızlı)
   ↓ başarısız
2. requests dene (orta)
   ↓ başarısız
3. yt-dlp kullan (en yavaş ama her zaman çalışır)
```

---

## ✅ Test Et

```bash
# aria2c kurulu mu?
aria2c --version

# Test indirme
aria2c --max-connection-per-server=16 --split=16 https://example.com/test.mp4
```

---

## 💡 İpuçları

### 1. Daha Fazla Bağlantı (32x)
```bash
# Script'te değiştir:
'--max-connection-per-server=32',
'--split=32',
```

### 2. Bandwidth Limiti
```bash
# 5MB/s limit
aria2c --max-download-limit=5M <url>
```

### 3. Resume (Kesintiden Devam)
```bash
# Otomatik resume
aria2c --continue=true <url>
```

---

## 🎉 Sonuç

aria2c kurulumu ile:
- ✅ **5-10x daha hızlı** indirme
- ✅ **Kesintide kaldığı yerden devam**
- ✅ **Otomatik fallback** (aria2c yoksa requests/yt-dlp)

**Kurulum:**
```powershell
choco install aria2
```

**Test:**
```bash
python turkanime_to_b2.py --anime naruto --start 1 --end 1
```

Artık indirme çok daha hızlı! 🚀
