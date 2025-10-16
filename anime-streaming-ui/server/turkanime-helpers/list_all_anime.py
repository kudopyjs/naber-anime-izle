#!/usr/bin/env python3
"""
TürkAnime Tüm Anime Listesi Script'i
Tüm anime listesini getirir
"""

import sys
import json
import os

# turkanime_api modülünü import et
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'bunny_scripts', 'turkanime-indirici-8.2.2'))

try:
    from turkanime_api import create_webdriver, Anime
    
    def list_all_anime():
        """Tüm anime listesini getir"""
        driver = None
        try:
            # WebDriver'ı başlat
            driver = create_webdriver(preload_ta=False)
            driver.get("https://turkanime.co/kullanici/anonim")
            
            # Tüm anime listesini çek
            all_anime = Anime.get_anime_listesi(driver)
            
            results = [
                {"slug": slug, "name": name}
                for slug, name in all_anime
            ]
            
            return {"results": results, "total": len(results)}
            
        finally:
            if driver:
                driver.quit()
    
    if __name__ == '__main__':
        # Windows encoding fix
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        
        result = list_all_anime()
        print(json.dumps(result, ensure_ascii=False))
        
except Exception as e:
    print(json.dumps({"error": str(e), "results": []}))
    sys.exit(1)
