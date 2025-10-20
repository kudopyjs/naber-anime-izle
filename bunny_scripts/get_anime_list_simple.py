#!/usr/bin/env python3
"""
TürkAnime'den tüm anime listesini al (basit versiyon)
"""
import sys
import json
import os

# turkanime_api modülünü import et
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'turkanime-indirici-8.2.2'))

try:
    import turkanime_api as ta
    
    print("🔍 TürkAnime'den anime listesi alınıyor...")
    
    # Tüm anime listesini al (çok hızlı - 5-10 saniye)
    anime_list = ta.Anime.get_anime_listesi()
    
    print(f"📺 Toplam {len(anime_list)} anime bulundu!")
    
    # JSON formatına çevir
    anime_data = [
        {
            "slug": slug,
            "title": title
        }
        for slug, title in anime_list
    ]
    
    # Dosyaya yaz
    output_file = "anime-list-full.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(anime_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Liste kaydedildi: {output_file}")
    print(f"📊 Toplam: {len(anime_data)} anime")
    
    # İlk 5 anime'yi göster
    print("\n📋 İlk 5 anime:")
    for anime in anime_data[:5]:
        print(f"  - {anime['title']} ({anime['slug']})")
    
except Exception as e:
    print(f"❌ Hata: {str(e)}")
    import traceback
    traceback.print_exc()
