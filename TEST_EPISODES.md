# Test Episodes

## Sorun
Episode 2146 bulundu ama video kaynağı yok:
- Episode ID: `one-piece-100?ep=2146`
- API Hatası: `THE LINK:` boş geliyor
- Hata: `cheerio.load() expects a string`

Bu, HiAnime'nin o episode sayfasında video embed linki bulamadığı anlamına geliyor.

## Test Edilecek Episodes

### 1. İlk Episode (En Güvenli)
```
http://localhost:5001/watch-new.html?anime=one-piece-100&ep=2142
```
Episode 1, ID: `one-piece-100?ep=2142`

### 2. Son Episode
```
http://localhost:5001/watch-new.html?anime=one-piece-100&ep=146179
```
Episode 1146, ID: `one-piece-100?ep=146179`

### 3. Orta Bir Episode
```
http://localhost:5001/watch-new.html?anime=one-piece-100&ep=50000
```

### 4. Farklı Anime Deneyin
```
http://localhost:5001/watch-new.html?anime=attack-on-titan-112
```

## Neden 2146 Çalışmıyor?

Olası sebepler:
1. **Episode henüz yayınlanmadı** - HiAnime'de mevcut değil
2. **Episode kaldırıldı** - Telif hakları nedeniyle
3. **Server sorunu** - `vidstreaming` sunucusunda yok
4. **Episode ID yanlış** - API'nin döndürdüğü ID gerçekte mevcut değil

## Çözüm

Farklı bir episode deneyin veya farklı bir server kullanın.
