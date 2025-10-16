#!/usr/bin/env python3
"""
TürkAnime Anime Detayları Script'i
Anime bilgilerini ve bölüm listesini getirir
"""

import sys
import json
import os

# turkanime_api modülünü import et
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'bunny_scripts', 'turkanime-indirici-8.2.2'))

try:
    from turkanime_api import create_webdriver, Anime
    
    def get_anime_details(slug):
        """Anime detaylarını ve bölüm listesini getir"""
        driver = None
        try:
            # WebDriver'ı başlat
            driver = create_webdriver(preload_ta=False)
            driver.get("https://turkanime.co/kullanici/anonim")
            
            # Anime objesini oluştur
            anime = Anime(driver, slug, parse_fansubs=False)
            
            # Bölüm listesini al
            episodes = [
                {
                    "slug": ep.slug,
                    "title": ep.title,
                    "number": idx + 1
                }
                for idx, ep in enumerate(anime.bolumler)
            ]
            
            # Anime bilgilerini hazırla
            result = {
                "info": {
                    "title": anime.title,
                    "image": anime.info.get("Resim"),
                    "genre": anime.info.get("Anime Türü", []),
                    "rating": anime.info.get("Puanı", 0),
                    "summary": anime.info.get("Özet", ""),
                    "studio": anime.info.get("Stüdyo", ""),
                    "episodeCount": len(episodes),
                    "category": anime.info.get("Kategori", ""),
                    "startDate": anime.info.get("Başlama Tarihi", ""),
                    "endDate": anime.info.get("Bitiş Tarihi", ""),
                    "japanese": anime.info.get("Japonca", "")
                },
                "episodes": episodes,
                "slug": slug
            }
            
            return result
            
        finally:
            if driver:
                driver.quit()
    
    if __name__ == '__main__':
        # Windows encoding fix
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        
        if len(sys.argv) < 2:
            print(json.dumps({"error": "Anime slug required"}))
            sys.exit(1)
        
        slug = sys.argv[1]
        result = get_anime_details(slug)
        print(json.dumps(result, ensure_ascii=False))
        
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
