#!/usr/bin/env python3
"""
TürkAnime Bölüm İçe Aktarma Script'i
turkanime_to_bunny.py'yi subprocess ile çağırır
"""

import sys
import json
import os
import subprocess
import re
from datetime import datetime

def import_episode(anime_slug, episode_slug, uploaded_by='admin'):
    """
    Bölümü TürkAnime'den çekip Bunny CDN'e yükle
    turkanime_to_bunny.py'yi direkt çağırır
    """
    try:
        # Bölüm numarasını çıkar (örn: naruto-5-bolum -> 5)
        episode_match = re.search(r'-(\d+)-bolum', episode_slug)
        if not episode_match:
            return {
                "success": False,
                "error": f"Bölüm numarası çıkarılamadı: {episode_slug}"
            }
        
        episode_num = episode_match.group(1)
        
        # turkanime_to_bunny.py'nin yolu
        script_path = os.path.join(
            os.path.dirname(__file__), 
            '..', '..', '..', 
            'bunny_scripts', 
            'turkanime_to_bunny.py'
        )
        script_path = os.path.abspath(script_path)
        
        if not os.path.exists(script_path):
            return {
                "success": False,
                "error": f"turkanime_to_bunny.py bulunamadı: {script_path}"
            }
        
        print(f"🎬 Anime: {anime_slug}")
        print(f"📺 Bölüm: {episode_num}")
        print("=" * 60)
        
        # Python komutunu oluştur
        cmd = [
            'python',
            script_path,
            '--anime', anime_slug,
            '--start', episode_num,
            '--end', episode_num
        ]
        
        print(f"🐍 Komut: {' '.join(cmd)}")
        print("=" * 60)
        
        # Komutu çalıştır (UTF-8 encoding ile)
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            env=env
        )
        
        # Çıktıyı göster
        if result.stdout:
            print(result.stdout)
        
        if result.stderr:
            print("STDERR:", result.stderr)
        
        # Başarı kontrolü
        if result.returncode == 0:
            # Log dosyasından video ID'yi bul
            log_path = os.path.join(
                os.path.dirname(script_path),
                'bunny_transfer_success.log'
            )
            
            video_id = None
            if os.path.exists(log_path):
                with open(log_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    # Son satırı kontrol et
                    for line in reversed(lines):
                        if anime_slug in line and episode_num in line:
                            parts = line.strip().split('|')
                            if len(parts) >= 3:
                                video_id = parts[2]
                                break
            
            return {
                "success": True,
                "videoId": video_id,
                "message": f"✅ Bölüm {episode_num} başarıyla yüklendi!",
                "animeData": {
                    'id': video_id,
                    'title': anime_slug.replace('-', ' ').title(),
                    'episode': episode_num,
                    'uploadedBy': uploaded_by,
                    'uploadedAt': datetime.now().isoformat(),
                    'source': 'turkanime',
                    'sourceSlug': episode_slug
                }
            }
        else:
            return {
                "success": False,
                "error": f"turkanime_to_bunny.py başarısız (exit code: {result.returncode})",
                "detail": result.stderr or result.stdout
            }
            
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"❌ Hata: {str(e)}")
        print(error_detail)
        return {
            "success": False,
            "error": f"Import hatası: {str(e)}",
            "detail": error_detail
        }

if __name__ == '__main__':
    # Windows encoding fix
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    if len(sys.argv) < 3:
        print(json.dumps({"error": "anime_slug and episode_slug required", "success": False}))
        sys.exit(1)
    
    anime_slug = sys.argv[1]
    episode_slug = sys.argv[2]
    uploaded_by = sys.argv[3] if len(sys.argv) > 3 else 'admin'
    
    try:
        result = import_episode(anime_slug, episode_slug, uploaded_by)
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
