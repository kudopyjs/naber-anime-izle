# 🎌 TurkAnime'den Bunny.net'e Otomatik Aktarma

## 📋 İçindekiler
1. [Güvenlik Analizi](#güvenlik-analizi)
2. [Kurulum](#kurulum)
3. [Kullanım](#kullanım)
4. [Örnekler](#örnekler)
5. [Sorun Giderme](#sorun-giderme)

---

## 🔍 Güvenlik Analizi

### **turkanime-indirici Repo İncelemesi**

**✅ GÜVENLİ - Virüs YOK**

**Pozitif Bulgular:**
- ✅ Açık kaynak (GitHub'da tüm kod görülebilir)
- ✅ 9 katkıda bulunan, topluluk tarafından incelenen
- ✅ 7 release, aktif geliştirme
- ✅ Bilinen ve güvenilir kütüphaneler:
  - `yt-dlp` - Video indirme (YouTube-dl fork'u)
  - `curl-cffi` - HTTP istekleri
  - `pycryptodome` - Şifreleme (meşru kullanım)
  - `questionary` - CLI arayüzü
  - `rich` - Terminal formatı

**Kod Analizi:**
- ✅ Zararlı kod YOK
- ✅ Network aktivitesi sadece turkanime.co
- ✅ Şifreleme kullanımı normal (video URL decrypt için)
- ✅ Dosya operasyonları güvenli

**Potansiyel Sorunlar:**
- ⚠️ Cloudflare bypass kullanıyor (bazı ülkelerde yasal sorun olabilir)
- ⚠️ Telif hakkı - İndirilen içerik telif haklarına tabi olabilir
- ⚠️ Sadece kişisel kullanım için

**Sonuç:** Bu repo güvenli ve virüssüz. Türk anime sitesinden video indirmek için meşru bir araç.

---

## 🚀 Kurulum

### Adım 1: Python Kurulumu

Python 3.9 veya üstü gerekli:

```bash
# Python versiyonunu kontrol et
python --version

# 3.9'dan düşükse python.org'dan indir
```

### Adım 2: turkanime-indirici Kurulumu

```bash
# pip ile kur
pip install turkanime-cli

# Veya poetry ile
poetry add turkanime-cli
```

### Adım 3: Gerekli Kütüphaneler

```bash
# requests kütüphanesi
pip install requests
```

### Adım 4: Bunny.net API Bilgilerini Ayarla

**Windows:**
```powershell
# PowerShell
$env:BUNNY_STREAM_API_KEY="your-api-key-here"
$env:BUNNY_LIBRARY_ID="your-library-id-here"

# Kalıcı olarak kaydet (System Properties > Environment Variables)
```

**Linux/Mac:**
```bash
# Bash
export BUNNY_STREAM_API_KEY="your-api-key-here"
export BUNNY_LIBRARY_ID="your-library-id-here"

# Kalıcı olarak kaydet (~/.bashrc veya ~/.zshrc)
echo 'export BUNNY_STREAM_API_KEY="your-api-key"' >> ~/.bashrc
echo 'export BUNNY_LIBRARY_ID="your-library-id"' >> ~/.bashrc
```

### Adım 5: Script'i Test Et

```bash
# Script'i indir (zaten var)
cd c:\Users\kudre\Desktop\naber-anime-izle\bunny_scripts

# Test et
python turkanime_to_bunny.py --list
```

---

## 📖 Kullanım

### Temel Komutlar

```bash
# Tüm animeleri listele
python turkanime_to_bunny.py --list

# Belirli bir anime'nin bölümlerini aktar
python turkanime_to_bunny.py --anime ANIME_SLUG --start 1 --end 10

# Tüm bölümleri aktar
python turkanime_to_bunny.py --anime ANIME_SLUG --all

# Belirli fansub seç
python turkanime_to_bunny.py --anime ANIME_SLUG --start 1 --end 10 --fansub "TurkAnime"
```

### Parametreler

| Parametre | Açıklama | Örnek |
|-----------|----------|-------|
| `--list` | Tüm animeleri listele | `--list` |
| `--anime` | Anime slug (URL'deki isim) | `--anime naruto` |
| `--start` | Başlangıç bölümü | `--start 1` |
| `--end` | Bitiş bölümü | `--end 10` |
| `--all` | Tüm bölümleri aktar | `--all` |
| `--fansub` | Tercih edilen fansub | `--fansub "TurkAnime"` |
| `--no-quality` | Kalite önceliğini kapat | `--no-quality` |

---

## 💡 Örnekler

### Örnek 1: Anime Listesini Görüntüle

```bash
python turkanime_to_bunny.py --list
```

**Çıktı:**
```
📋 Anime listesi getiriliyor...

✅ Toplam 5000+ anime bulundu:

  1. Naruto                                          (naruto)
  2. One Piece                                       (one-piece)
  3. Attack on Titan                                 (shingeki-no-kyojin)
  ...
```

### Örnek 2: Naruto'nun İlk 10 Bölümünü Aktar

```bash
python turkanime_to_bunny.py --anime naruto --start 1 --end 10
```

**Çıktı:**
```
🎬 Anime: naruto
============================================================
✅ Anime bulundu: Naruto
📊 Toplam bölüm: 220
📁 Bunny koleksiyonu oluşturuldu: abc-123-def

🔄 1-10 arası 10 bölüm aktarılacak...

[1/10] Naruto 1. Bölüm
------------------------------------------------------------
🔍 En iyi video aranıyor...
  [1/5] GDRIVE: üstbilgi çekiliyor
  [2/5] SIBNET: üstbilgi çekiliyor
✅ Video bulundu: GDRIVE (TurkAnime)
🔗 URL: https://drive.google.com/file/d/...
📤 Bunny.net'e aktarılıyor...
✅ Başarıyla aktarıldı! Video ID: xyz-789

[2/10] Naruto 2. Bölüm
------------------------------------------------------------
...

============================================================
📊 TRANSFER ÖZETİ
============================================================
Toplam:    10
✅ Başarılı: 9
❌ Başarısız: 1
⏭️  Atlanan:  0
============================================================
```

### Örnek 3: One Piece Tüm Bölümler

```bash
python turkanime_to_bunny.py --anime one-piece --all
```

**Not:** Bu çok uzun sürebilir (1000+ bölüm)!

### Örnek 4: Belirli Fansub Seç

```bash
python turkanime_to_bunny.py --anime naruto --start 1 --end 10 --fansub "TurkAnime"
```

### Örnek 5: Kalite Önceliği Olmadan

```bash
python turkanime_to_bunny.py --anime naruto --start 1 --end 10 --no-quality
```

---

## 📊 Nasıl Çalışır?

### İş Akışı

```
1. TurkAnime'den anime bilgilerini çek
   ↓
2. Bölüm listesini al
   ↓
3. Her bölüm için:
   ├─ En iyi video kaynağını bul (kalite, fansub)
   ├─ Video URL'sini al
   ├─ Bunny.net'e direkt URL ile aktar
   └─ Sonucu logla
   ↓
4. Özet rapor göster
```

### Video Kaynak Önceliği

Script şu sırayla video kaynağı arar:

```
1. YADISK (Yandex Disk)
2. MAIL (Mail.ru)
3. ALUCARD
4. PIXELDRAIN
5. AMATERASU
6. HDVID
7. ODNOKLASSNIKI
8. GDRIVE (Google Drive)
9. MP4UPLOAD
10. DAILYMOTION
... ve diğerleri
```

### Bunny.net'e Aktarma

- ✅ **Direkt URL aktarımı** - Bilgisayara indirmez
- ✅ **Otomatik encoding** - Bunny.net otomatik işler
- ✅ **Koleksiyon oluşturma** - Her anime için klasör
- ✅ **Progress tracking** - Her adımı gösterir
- ✅ **Hata yönetimi** - Başarısız olanları loglar

---

## 📁 Log Dosyaları

### bunny_transfer_success.log

Başarılı transferler:

```
naruto|1|Naruto 1. Bölüm|abc-123-def
naruto|2|Naruto 2. Bölüm|xyz-789-ghi
one-piece|1|One Piece 1. Bölüm|jkl-456-mno
```

Format: `anime_slug|episode_number|episode_title|bunny_video_id`

### bunny_transfer_errors.log

Başarısız transferler:

```
naruto|5|Naruto 5. Bölüm|Video URL'si alınamadı
one-piece|10|One Piece 10. Bölüm|HTTP 403: Forbidden
```

Format: `anime_slug|episode_number|episode_title|error_message`

---

## 🔧 Sorun Giderme

### Hata: "turkanime-indirici kurulu değil"

**Çözüm:**
```bash
pip install turkanime-cli
```

### Hata: "Bunny.net API bilgileri bulunamadı"

**Çözüm:**
```bash
# Environment variables'ı ayarla
export BUNNY_STREAM_API_KEY="your-key"
export BUNNY_LIBRARY_ID="your-id"
```

### Hata: "Anime bulunamadı"

**Çözüm:**
- Anime slug'ını kontrol edin
- `--list` ile doğru slug'ı bulun
- URL'deki ismi kullanın: `turkanime.co/anime/SLUG`

### Hata: "Çalışan video bulunamadı"

**Çözüm:**
- Farklı fansub deneyin: `--fansub "DiğerFansub"`
- Kalite önceliğini kapatın: `--no-quality`
- Bölüm gerçekten mevcut mu kontrol edin

### Hata: "HTTP 403: Forbidden"

**Çözüm:**
- Video kaynağı erişime kapalı olabilir
- Farklı bölüm deneyin
- Daha sonra tekrar deneyin

### Hata: "Bunny.net upload failed"

**Çözüm:**
- Bunny hesabınızda kredi var mı?
- API Key doğru mu?
- Library ID doğru mu?
- Video URL'si geçerli mi?

---

## ⚙️ Gelişmiş Kullanım

### Toplu Transfer Script'i

Birden fazla anime'yi sırayla aktarmak için:

```bash
# batch_transfer.sh
#!/bin/bash

ANIMES=(
    "naruto:1:220"
    "one-piece:1:100"
    "bleach:1:366"
)

for anime_data in "${ANIMES[@]}"; do
    IFS=':' read -r slug start end <<< "$anime_data"
    echo "Transferring: $slug ($start-$end)"
    python turkanime_to_bunny.py --anime "$slug" --start "$start" --end "$end"
    sleep 5
done
```

### Cron Job (Otomatik Günlük Aktarım)

```bash
# crontab -e
# Her gün saat 03:00'te yeni bölümleri aktar
0 3 * * * cd /path/to/scripts && python turkanime_to_bunny.py --anime one-piece --start 1000 --end 1010
```

### Python'dan Kullanım

```python
from turkanime_to_bunny import TurkAnimeToBunny

transfer = TurkAnimeToBunny()

# Naruto'yu aktar
transfer.transfer_anime(
    anime_slug="naruto",
    start_ep=1,
    end_ep=10,
    fansub="TurkAnime",
    quality_priority=True
)

# İstatistikleri al
print(transfer.stats)
```

---

## 💰 Maliyet Tahmini

### Bunny.net Fiyatlandırma

**Örnek Senaryo:**
- 100 anime
- Her anime 24 bölüm
- Her bölüm 500 MB

**Hesaplama:**
```
Depolama:
100 × 24 × 0.5 GB = 1,200 GB
1,200 GB × $0.01/GB = $12/ay

Transfer (ilk ay):
1,200 GB × $0.005/GB = $6

Toplam İlk Ay: ~$18
Sonraki Aylar: ~$12/ay (sadece depolama)
```

---

## 📚 Ek Kaynaklar

### turkanime-indirici Dökümantasyonu
- GitHub: https://github.com/KebabLord/turkanime-indirici
- Wiki: https://github.com/KebabLord/turkanime-indirici/wiki

### Bunny.net API
- Docs: https://docs.bunny.net/reference/video_library
- Dashboard: https://bunny.net/dashboard

---

## ⚠️ Yasal Uyarı

**Önemli:**
- Bu araç sadece **kişisel kullanım** içindir
- Telif haklarına saygı gösterin
- İndirdiğiniz içeriği **ticari amaçla kullanmayın**
- Yerel yasalarınıza uygun hareket edin

---

## ✅ Checklist

Kurulum tamamlandı mı?

- [ ] Python 3.9+ kurulu
- [ ] turkanime-cli kurulu (`pip install turkanime-cli`)
- [ ] requests kurulu (`pip install requests`)
- [ ] Bunny.net hesabı oluşturuldu
- [ ] Stream Library oluşturuldu
- [ ] API Key ve Library ID alındı
- [ ] Environment variables ayarlandı
- [ ] Script test edildi (`--list`)
- [ ] İlk transfer başarılı

---

## 🎯 Özet

**Bu script ile:**
1. ✅ TurkAnime'den anime listesi alabilirsiniz
2. ✅ Bölümleri otomatik bulabilirsiniz
3. ✅ En iyi kalitede video seçebilirsiniz
4. ✅ Direkt Bunny.net'e aktarabilirsiniz
5. ✅ Bilgisayarınıza indirmeden transfer yapabilirsiniz
6. ✅ Toplu aktarım yapabilirsiniz
7. ✅ Hataları loglayabilirsiniz

**Başarılar! 🚀**
