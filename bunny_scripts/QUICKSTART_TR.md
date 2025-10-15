# 🚀 Hızlı Başlangıç - TurkAnime to Bunny.net

## ⚡ 5 Dakikada Kurulum

### 1️⃣ Gereksinimleri Kur

```bash
# Python 3.9+ gerekli
python --version

# turkanime-indirici kur
pip install turkanime-cli

# requests kur
pip install requests
```

### 2️⃣ Bunny.net API Bilgilerini Ayarla

**Windows (PowerShell):**
```powershell
$env:BUNNY_STREAM_API_KEY="your-api-key-here"
$env:BUNNY_LIBRARY_ID="your-library-id-here"
```

**Linux/Mac:**
```bash
export BUNNY_STREAM_API_KEY="your-api-key-here"
export BUNNY_LIBRARY_ID="your-library-id-here"
```

### 3️⃣ Test Et

```bash
# Anime listesini gör
python turkanime_to_bunny.py --list

# İlk transferi yap
python turkanime_to_bunny.py --anime naruto --start 1 --end 3
```

---

## 📖 Temel Kullanım

### Anime Listesi

```bash
python turkanime_to_bunny.py --list
```

### Belirli Bölümleri Aktar

```bash
# Naruto 1-10
python turkanime_to_bunny.py --anime naruto --start 1 --end 10

# One Piece 1-50
python turkanime_to_bunny.py --anime one-piece --start 1 --end 50

# Tüm bölümler
python turkanime_to_bunny.py --anime naruto --all
```

### Fansub Seç

```bash
python turkanime_to_bunny.py --anime naruto --start 1 --end 10 --fansub "TurkAnime"
```

---

## 🎯 Hızlı Örnekler

### Windows Batch Script

```bash
# transfer_example.bat dosyasını düzenle
# API bilgilerini gir
# Çift tıkla ve çalıştır
```

### Linux/Mac Bash Script

```bash
# Çalıştırılabilir yap
chmod +x transfer_example.sh

# Çalıştır
./transfer_example.sh
```

---

## 📊 Ne Olur?

```
1. TurkAnime'den anime bilgileri çekilir
2. Bölüm listesi alınır
3. Her bölüm için en iyi video bulunur
4. Video URL'si direkt Bunny.net'e aktarılır
5. Bunny.net otomatik encode eder
6. Sonuçlar loglanır
```

**Avantajlar:**
- ✅ Bilgisayara indirmez (disk alanı tasarrufu)
- ✅ Otomatik encoding (Bunny.net yapar)
- ✅ CDN streaming (hızlı izleme)
- ✅ Toplu transfer (birden fazla anime)
- ✅ Hata yönetimi (başarısızları loglar)

---

## 🔍 Güvenlik

**turkanime-indirici güvenli mi?**
- ✅ Açık kaynak
- ✅ Topluluk tarafından incelenen
- ✅ Virüs YOK
- ✅ Zararlı kod YOK

**Detaylı analiz:** `README_TURKANIME.md` dosyasına bakın.

---

## 📁 Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `turkanime_to_bunny.py` | Ana script |
| `README_TURKANIME.md` | Detaylı dokümantasyon |
| `transfer_example.bat` | Windows örnek script |
| `transfer_example.sh` | Linux/Mac örnek script |
| `QUICKSTART_TR.md` | Bu dosya |

---

## 🆘 Sorun mu Var?

### "turkanime-indirici kurulu değil"
```bash
pip install turkanime-cli
```

### "Bunny.net API bilgileri bulunamadı"
```bash
# Environment variables ayarla
export BUNNY_STREAM_API_KEY="your-key"
export BUNNY_LIBRARY_ID="your-id"
```

### "Anime bulunamadı"
```bash
# Doğru slug'ı bul
python turkanime_to_bunny.py --list
```

**Detaylı sorun giderme:** `README_TURKANIME.md` dosyasına bakın.

---

## 💡 İpuçları

1. **Küçük başlayın:** İlk transferde 3-5 bölüm deneyin
2. **Logları kontrol edin:** `bunny_transfer_success.log` ve `bunny_transfer_errors.log`
3. **Rate limiting:** Bölümler arası 2 saniye beklenir
4. **Kalite önceliği:** Varsayılan olarak en iyi kalite seçilir
5. **Fansub seçimi:** `--fansub` ile tercih edilen fansub'u belirtin

---

## 📚 Daha Fazla Bilgi

- **Detaylı dokümantasyon:** `README_TURKANIME.md`
- **turkanime-indirici:** https://github.com/KebabLord/turkanime-indirici
- **Bunny.net API:** https://docs.bunny.net/reference/video_library

---

## ✅ Checklist

- [ ] Python 3.9+ kurulu
- [ ] turkanime-cli kurulu
- [ ] Bunny.net hesabı var
- [ ] API bilgileri ayarlandı
- [ ] Script test edildi
- [ ] İlk transfer başarılı

**Hepsi tamam mı? Başlayın! 🚀**
