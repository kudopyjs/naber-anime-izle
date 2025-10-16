#!/usr/bin/env python3
"""
Bunny.net Collection Oluşturma
Yeni bir anime collection'ı oluşturur
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
    
    def create_collection(name, metadata=None):
        """Yeni collection oluştur"""
        try:
            bunny = BunnyUploader(BUNNY_API_KEY, BUNNY_LIBRARY_ID)
            
            # Önce aynı isimde collection var mı kontrol et
            existing_id = bunny.find_collection_by_name(name)
            if existing_id:
                return {
                    "success": False,
                    "error": f"'{name}' isimli collection zaten mevcut",
                    "existingId": existing_id
                }
            
            # Yeni collection oluştur
            collection_id = bunny.create_collection(name)
            
            if collection_id:
                return {
                    "success": True,
                    "collectionId": collection_id,
                    "name": name,
                    "metadata": metadata,
                    "message": f"'{name}' collection'ı başarıyla oluşturuldu"
                }
            else:
                return {
                    "success": False,
                    "error": "Collection oluşturulamadı"
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
            print(json.dumps({"error": "Collection name required", "success": False}))
            sys.exit(1)
        
        name = sys.argv[1]
        metadata = json.loads(sys.argv[2]) if len(sys.argv) > 2 else None
        
        result = create_collection(name, metadata)
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
