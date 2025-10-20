#!/usr/bin/env python3
"""
On-Demand Anime API - İhtiyaç anında anime detaylarını yükle
"""
import sys
import json
import os
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'turkanime-indirici-8.2.2'))
import turkanime_api as ta

class AnimeCache:
    """Anime verilerini cache'leyen sınıf"""
    
    def __init__(self, cache_dir="anime_cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        # Anime listesini yükle (hızlı)
        self.anime_list_file = self.cache_dir / "anime-list.json"
        self.anime_list = self._load_anime_list()
    
    def _load_anime_list(self):
        """Anime listesini yükle veya oluştur"""
        if self.anime_list_file.exists():
            print("📂 Cache'den anime listesi yükleniyor...")
            with open(self.anime_list_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            print("🔍 TürkAnime'den anime listesi alınıyor...")
            anime_list = ta.Anime.get_anime_listesi()
            
            data = [
                {"slug": slug, "title": title}
                for slug, title in anime_list
            ]
            
            # Cache'e kaydet
            with open(self.anime_list_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"✅ {len(data)} anime listesi cache'lendi")
            return data
    
    def get_anime_details(self, slug):
        """Bir anime'nin detaylarını al (cache'den veya scrape et)"""
        cache_file = self.cache_dir / f"{slug}.json"
        
        # Cache'de varsa onu kullan
        if cache_file.exists():
            print(f"📂 Cache'den yükleniyor: {slug}")
            with open(cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # Yoksa scrape et
        print(f"🔍 Scraping: {slug}")
        try:
            anime = ta.Anime(slug)
            
            anime_data = {
                "slug": slug,
                "title": anime.title,
                "episodes": []
            }
            
            # Bölümleri işle
            for bolum_idx, bolum in enumerate(anime.bolumler, 1):
                episode_data = {
                    "episode_number": bolum_idx,
                    "title": bolum.title,
                    "slug": bolum.slug,
                    "videos": []
                }
                
                # Videoları al
                for video in bolum.videos:
                    if video.is_supported:
                        video_data = {
                            "player": video.player,
                            "resolution": video.resolution,
                            "fansub": video.fansub,
                            "url": video.url
                        }
                        episode_data["videos"].append(video_data)
                
                if episode_data["videos"]:
                    anime_data["episodes"].append(episode_data)
            
            # Cache'e kaydet
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(anime_data, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Cache'lendi: {slug} ({len(anime_data['episodes'])} bölüm)")
            return anime_data
            
        except Exception as e:
            print(f"❌ Hata: {slug} - {str(e)}")
            return None
    
    def search_anime(self, query):
        """Anime ara"""
        query_lower = query.lower()
        results = [
            anime for anime in self.anime_list
            if query_lower in anime['title'].lower() or query_lower in anime['slug']
        ]
        return results


# Kullanım örneği
if __name__ == "__main__":
    cache = AnimeCache()
    
    print(f"\n📺 Toplam {len(cache.anime_list)} anime mevcut")
    
    # Örnek: Naruto ara
    print("\n🔍 'naruto' araması:")
    results = cache.search_anime("naruto")
    for anime in results[:5]:
        print(f"  - {anime['title']} ({anime['slug']})")
    
    # Örnek: Bir anime'nin detaylarını al
    if results:
        slug = results[0]['slug']
        print(f"\n📥 Detayları yükleniyor: {slug}")
        details = cache.get_anime_details(slug)
        
        if details:
            print(f"✅ {details['title']}")
            print(f"   Bölüm sayısı: {len(details['episodes'])}")
            if details['episodes']:
                print(f"   İlk bölüm: {details['episodes'][0]['title']}")
                print(f"   Video sayısı: {len(details['episodes'][0]['videos'])}")
