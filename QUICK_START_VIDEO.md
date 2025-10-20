# 🚀 Hızlı Başlangıç - HiAnime Video Streaming

## ⚡ 1 Dakikada Başlat

### Windows Kullanıcıları

**Çift tıklayın:**
```
start-all.bat
```

veya PowerShell ile:
```powershell
.\start-all.ps1
```

Bu kadar! Tarayıcınız otomatik açılacak ve video oynatmaya başlayacak.

---

## 📋 Manuel Başlatma

Eğer otomatik script çalışmazsa, 3 terminal açın:

### Terminal 1: Aniwatch API
```powershell
cd aniwatch-api
npm install  # İlk seferde
npm start
```

### Terminal 2: Proxy Server
```powershell
cd server
npm install  # İlk seferde
node hianime_proxy.js
```

### Terminal 3: Web Server
```powershell
cd html\public_html
python -m http.server 5001
```

### Tarayıcıda Açın
```
http://localhost:5001/watch-new.html?anime=one-piece-100&ep=2146
```

---

## 🎬 Farklı Anime İzleme

URL'yi değiştirin:

```
http://localhost:5001/watch-new.html?anime=ANIME_ID&ep=EPISODE_ID
```

**Örnekler:**
- One Piece: `?anime=one-piece-100&ep=2146`
- Attack on Titan: `?anime=attack-on-titan-112`
- Demon Slayer: `?anime=demon-slayer-kimetsu-no-yaiba-47&ep=1251`

**Anime ID nasıl bulunur?**
1. HiAnime.to'da anime arayın
2. URL'den ID'yi kopyalayın
   - Örnek: `hianime.to/watch/one-piece-100?ep=2146`
   - Anime ID: `one-piece-100`
   - Episode ID: `2146`

---

## ✅ Çalışıyor mu Kontrol

Tarayıcıda bu URL'leri açın:

- ✅ API: http://localhost:4000/health → "daijoubu" görmeli
- ✅ Proxy: http://localhost:5000/health → JSON response görmeli
- ✅ Web: http://localhost:5001/watch-new.html → Sayfa açılmalı

---

## ❌ Sorun mu Var?

### Video yüklenmiyor
1. F12 ile Console'u açın
2. Hataları kontrol edin
3. Network sekmesinde başarısız istekleri görün

### Port zaten kullanımda
Başka bir uygulama portları kullanıyor olabilir:
- 4000: Aniwatch API
- 5000: Proxy Server
- 5001: Web Server

Çözüm: Diğer uygulamaları kapatın veya portları değiştirin.

### "npm: command not found"
Node.js kurulu değil. [Node.js indirin](https://nodejs.org/)

### "python: command not found"
Python kurulu değil. [Python indirin](https://www.python.org/)

---

## 📚 Detaylı Dokümantasyon

Daha fazla bilgi için: [HIANIME_VIDEO_SETUP.md](./HIANIME_VIDEO_SETUP.md)

---

## 🎉 Başarılı!

Eğer video oynatılıyorsa, tebrikler! 🎊

**Özellikler:**
- ✅ HLS video streaming
- ✅ Bölüm listesi
- ✅ Sub/Dub seçimi
- ✅ Modern UI
- ✅ Responsive tasarım

**İyi seyirler!** 🍿
