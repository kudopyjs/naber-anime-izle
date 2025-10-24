# 🔑 Google Gemini API Key Alma Rehberi

## Adım 1: Google AI Studio'ya Git
1. Tarayıcınızda şu adresi açın: https://aistudio.google.com/app/apikey
2. Google hesabınızla giriş yapın (Gmail hesabınız)

## Adım 2: API Key Oluştur
1. Sayfada **"Create API Key"** butonuna tıklayın
2. Bir proje seçin veya **"Create API key in new project"** seçeneğini seçin
3. API key otomatik oluşturulacak (örnek: `AIzaSyD...`)
4. **"Copy"** butonuna tıklayarak kopyalayın

## Adım 3: API Key'i Projeye Ekle

### Windows PowerShell için:
```powershell
cd c:\Users\kudre\Desktop\yeni\naber-anime-izle\server
notepad .env
```

### .env dosyasına şunu ekleyin:
```
GEMINI_API_KEY=buraya_kopyaladiginiz_api_key_yapistirin
```

Örnek:
```
GEMINI_API_KEY=AIzaSyCk1KLggBBtJZebORjyH6KLcLvvDzlqK1w
```

## Adım 4: Sunucuyu Yeniden Başlat
```powershell
# Ctrl+C ile mevcut sunucuyu durdurun
# Sonra tekrar başlatın:
npm start
```

## ✅ Hazır!
API key'iniz artık kullanıma hazır. Günde 1500 ücretsiz istek hakkınız var.

## 🔒 Güvenlik Notu
- API key'inizi kimseyle paylaşmayın
- .env dosyası .gitignore'da olmalı (zaten var)
- GitHub'a yüklemeden önce kontrol edin

## 📊 Limitler
- **Ücretsiz:** Günde 1500 istek
- **Dakikada:** 60 istek
- **Çok yeterli:** Bir anime bölümü ~100-300 altyazı satırı = 1 istek

## ❓ Sorun mu Yaşıyorsunuz?
1. API key'in doğru kopyalandığından emin olun
2. .env dosyasında boşluk veya tırnak işareti olmamalı
3. Sunucuyu yeniden başlatmayı unutmayın
