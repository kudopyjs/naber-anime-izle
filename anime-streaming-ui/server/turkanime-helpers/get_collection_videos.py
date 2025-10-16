#!/usr/bin/env python3
"""
Bunny.net Collection Videoları
Belirli bir collection'ın tüm videolarını getirir
"""

import sys
import json
import os

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
    
    def get_collection_videos(collection_id):
        """Belirli bir collection'ın videolarını getir"""
        try:
            bunny = BunnyUploader(BUNNY_API_KEY, BUNNY_LIBRARY_ID)
            
            # Collection'daki videoları getir
            videos = bunny.list_videos(collection_id=collection_id, items_per_page=1000)
            
            # Videoları tarihe göre sırala (en eski en başta)
            sorted_videos = sorted(videos, key=lambda v: v.get('dateUploaded', ''))
            
            return {
                "success": True,
                "collectionId": collection_id,
                "videos": sorted_videos,
                "total": len(sorted_videos)
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
        
        if len(sys.argv) < 2:
            print(json.dumps({"error": "collection_id required", "success": False}))
            sys.exit(1)
        
        collection_id = sys.argv[1]
        result = get_collection_videos(collection_id)
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
