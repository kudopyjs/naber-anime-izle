#!/usr/bin/env python3
"""
Bunny.net Video Bilgisi
Belirli bir video'nun detaylarını getirir
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
    
    def get_video_info(video_id):
        """Belirli bir video'nun bilgilerini getir"""
        try:
            bunny = BunnyUploader(BUNNY_API_KEY, BUNNY_LIBRARY_ID)
            
            # Bunny API'den video bilgisini al
            import requests
            response = requests.get(
                f"https://video.bunnycdn.com/library/{BUNNY_LIBRARY_ID}/videos/{video_id}",
                headers={"AccessKey": BUNNY_API_KEY}
            )
            
            if response.status_code == 200:
                video = response.json()
                return {
                    "success": True,
                    "video": video
                }
            else:
                return {
                    "success": False,
                    "error": f"Video bulunamadı (HTTP {response.status_code})"
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
            print(json.dumps({"error": "video_id required", "success": False}))
            sys.exit(1)
        
        video_id = sys.argv[1]
        result = get_video_info(video_id)
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
