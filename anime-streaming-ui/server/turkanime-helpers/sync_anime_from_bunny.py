#!/usr/bin/env python3
"""
Bunny.net'ten Anime Detaylarını Senkronize Et
Bunny.net'teki collection'ları tarayıp anime detaylarını JSON'a kaydeder
"""

import sys
import json
import os
import re

# turkanime_to_bunny modülünü import et
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'bunny_scripts'))

try:
    from turkanime_to_bunny import BunnyUploader
    from dotenv import load_dotenv
    
    # .env dosyasını yükle
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    load_dotenv(env_path)
    
    # Bunny.net ayarları
    BUNNY_API_KEY = os.getenv('VITE_BUNNY_STREAM_API_KEY')
    BUNNY_LIBRARY_ID = os.getenv('VITE_BUNNY_LIBRARY_ID')
    
    def parse_collection_name(name):
        """Collection adından anime adı ve sezon numarasını çıkar"""
        # "One Punch Man Season 1" -> ("One Punch Man", 1)
        # "Bleach: Thousand Year Blood War Season 3" -> ("Bleach: Thousand Year Blood War", 3)
        match = re.match(r'^(.+?)\s+Season\s+(\d+)$', name, re.IGNORECASE)
        if match:
            anime_name = match.group(1).strip()
            season = int(match.group(2))
            return anime_name, season
        return name, 1  # Default sezon 1
    
    def sync_anime_from_bunny():
        """Bunny.net'ten anime detaylarını çek ve JSON'a kaydet"""
        try:
            bunny = BunnyUploader(BUNNY_API_KEY, BUNNY_LIBRARY_ID)
            
            # Tüm collection'ları getir
            collections = bunny.list_collections()
            
            # Anime'leri grupla (sezonlara göre)
            anime_dict = {}
            
            for collection in collections:
                coll_id = collection.get('guid')
                coll_name = collection.get('name', 'Unnamed')
                video_count = collection.get('videoCount', 0)
                
                # Collection adından anime ve sezon bilgisini çıkar
                anime_name, season = parse_collection_name(coll_name)
                
                # Anime'yi dict'e ekle veya güncelle
                if anime_name not in anime_dict:
                    anime_dict[anime_name] = {
                        'name': anime_name,
                        'seasons': {}
                    }
                
                # Sezon bilgisini ekle
                anime_dict[anime_name]['seasons'][season] = {
                    'season': season,
                    'collectionId': coll_id,
                    'collectionName': coll_name,
                    'episodeCount': video_count
                }
            
            # Anime listesini oluştur
            anime_list = []
            for anime_name, anime_data in anime_dict.items():
                seasons_list = sorted(anime_data['seasons'].values(), key=lambda s: s['season'])
                total_episodes = sum(s['episodeCount'] for s in seasons_list)
                
                anime_list.append({
                    'name': anime_name,
                    'totalEpisodes': total_episodes,
                    'totalSeasons': len(seasons_list),
                    'seasons': seasons_list
                })
            
            # JSON dosyasına kaydet
            data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
            os.makedirs(data_dir, exist_ok=True)
            
            output_file = os.path.join(data_dir, 'bunny_anime_sync.json')
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'success': True,
                    'animes': anime_list,
                    'total': len(anime_list)
                }, f, ensure_ascii=False, indent=2)
            
            return {
                "success": True,
                "animes": anime_list,
                "total": len(anime_list),
                "message": f"{len(anime_list)} anime senkronize edildi"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    if __name__ == '__main__':
        # Windows encoding fix
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        
        result = sync_anime_from_bunny()
        print(json.dumps(result, ensure_ascii=False))
        
except Exception as e:
    import traceback
    error_detail = traceback.format_exc()
    print(json.dumps({
        "error": str(e), 
        "success": False,
        "detail": error_detail
    }, ensure_ascii=False))
    sys.exit(1)
