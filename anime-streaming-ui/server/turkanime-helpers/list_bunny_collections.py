#!/usr/bin/env python3
"""
Bunny.net Collection Listesi
Tüm collection'ları ve içlerindeki video sayısını getirir
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
    
    def list_collections():
        """Tüm collection'ları listele"""
        try:
            bunny = BunnyUploader(BUNNY_API_KEY, BUNNY_LIBRARY_ID)
            
            # Collection'ları getir
            collections = bunny.list_collections()
            
            # Her collection için sadece temel bilgileri al (videoları çekme!)
            result = []
            for collection in collections:
                collection_id = collection.get('guid')
                collection_name = collection.get('name', 'Unnamed')
                video_count = collection.get('videoCount', 0)
                
                result.append({
                    'id': collection_id,
                    'name': collection_name,
                    'videoCount': video_count
                })
            
            return {
                "success": True,
                "collections": result,
                "total": len(result)
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
        
        result = list_collections()
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
