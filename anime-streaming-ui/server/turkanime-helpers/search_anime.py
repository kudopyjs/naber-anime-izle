#!/usr/bin/env python3
"""
TürkAnime Anime Arama Script'i
Node.js backend'den çağrılır
"""

import sys
import json
import os

# turkanime_api modülünü import et
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'bunny_scripts', 'turkanime-indirici-8.2.2'))

try:
    from turkanime_api import create_webdriver, Anime
    
    def search_anime(query):
        """Anime ara ve sonuçları döndür"""
        driver = None
        try:
            # WebDriver'ı başlat
            driver = create_webdriver(preload_ta=False)
            driver.get("https://turkanime.co/kullanici/anonim")
            
            # Tüm anime listesini çek
            all_anime = Anime.get_anime_listesi(driver)
            
            # Arama terimine göre filtrele
            query_lower = query.lower()
            results = [
                {"slug": slug, "name": name}
                for slug, name in all_anime
                if query_lower in name.lower() or query_lower in slug.lower()
            ]
            
            # İlk 50 sonucu döndür
            return {"results": results[:50], "total": len(results)}
            
        finally:
            if driver:
                driver.quit()
    
    if __name__ == '__main__':
        # Windows encoding fix
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        
        if len(sys.argv) < 2:
            print(json.dumps({"error": "Query parameter required"}))
            sys.exit(1)
        
        query = sys.argv[1]
        result = search_anime(query)
        print(json.dumps(result, ensure_ascii=False))
        
except Exception as e:
    print(json.dumps({"error": str(e), "results": []}))
    sys.exit(1)
