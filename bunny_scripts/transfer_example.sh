#!/bin/bash
# TurkAnime'den Bunny.net'e Transfer - Örnek Bash Script
# Linux/Mac için hızlı başlangıç

echo "========================================"
echo "TurkAnime to Bunny.net Transfer"
echo "========================================"
echo ""

# Bunny.net API bilgilerini ayarla
# Bu değerleri kendi bilgilerinizle değiştirin!
export BUNNY_STREAM_API_KEY="your-api-key-here"
export BUNNY_LIBRARY_ID="your-library-id-here"

# API bilgileri kontrol
if [ "$BUNNY_STREAM_API_KEY" = "your-api-key-here" ]; then
    echo "❌ HATA: Bunny.net API bilgilerini ayarlayın!"
    echo "Bu dosyayı düzenleyin ve API bilgilerinizi girin."
    exit 1
fi

echo "✅ API bilgileri ayarlandı."
echo ""

# Kullanıcıdan seçim al
echo "Ne yapmak istersiniz?"
echo ""
echo "1. Anime listesini gör"
echo "2. Belirli bir anime'nin bölümlerini aktar"
echo "3. Örnek: Naruto 1-10 bölümler"
echo "4. Örnek: One Piece 1-50 bölümler"
echo "5. Toplu transfer (birden fazla anime)"
echo "6. Çıkış"
echo ""

read -p "Seçiminiz (1-6): " choice

case $choice in
    1)
        echo ""
        echo "📋 Anime listesi getiriliyor..."
        python3 turkanime_to_bunny.py --list
        ;;
    2)
        echo ""
        read -p "Anime slug (örnek: naruto): " anime_slug
        read -p "Başlangıç bölümü: " start_ep
        read -p "Bitiş bölümü: " end_ep
        
        echo ""
        echo "🔄 Transfer başlatılıyor: $anime_slug ($start_ep-$end_ep)"
        python3 turkanime_to_bunny.py --anime "$anime_slug" --start "$start_ep" --end "$end_ep"
        ;;
    3)
        echo ""
        echo "🎬 Naruto 1-10 bölümleri aktarılıyor..."
        python3 turkanime_to_bunny.py --anime naruto --start 1 --end 10
        ;;
    4)
        echo ""
        echo "🎬 One Piece 1-50 bölümleri aktarılıyor..."
        python3 turkanime_to_bunny.py --anime one-piece --start 1 --end 50
        ;;
    5)
        echo ""
        echo "📦 Toplu transfer başlatılıyor..."
        echo ""
        
        # Anime listesi
        declare -a animes=(
            "naruto:1:10"
            "bleach:1:10"
            "one-piece:1:20"
        )
        
        for anime_data in "${animes[@]}"; do
            IFS=':' read -r slug start end <<< "$anime_data"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🎬 Transfer: $slug ($start-$end)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            python3 turkanime_to_bunny.py --anime "$slug" --start "$start" --end "$end"
            echo ""
            echo "⏳ 5 saniye bekleniyor..."
            sleep 5
        done
        
        echo ""
        echo "✅ Toplu transfer tamamlandı!"
        ;;
    6)
        echo ""
        echo "👋 Çıkış yapılıyor..."
        exit 0
        ;;
    *)
        echo "❌ Geçersiz seçim!"
        exit 1
        ;;
esac

echo ""
echo "✅ İşlem tamamlandı!"
