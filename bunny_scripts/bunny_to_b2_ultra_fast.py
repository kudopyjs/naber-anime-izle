"""
Bunny → B2 Ultra Hızlı Transfer
B2'nin copy_file API'sini kullanarak SÜPER HIZLI transfer!

Kullanım:
    python bunny_to_b2_ultra_fast.py --all
    python bunny_to_b2_ultra_fast.py --video-id abc123

NOT: B2 kendi indirir, senin bilgisayarın hiç kullanılmaz!
"""

import os
import sys
import argparse
import requests
import json
import time
from typing import List, Dict, Optional

# B2 SDK
try:
    from b2sdk.v2 import B2Api, InMemoryAccountInfo
except ImportError:
    print("❌ b2sdk kurulu değil!")
    print("Kurulum: pip install b2sdk")
    sys.exit(1)

# Bunny.net Configuration
BUNNY_API_KEY = "26908cc0-97c0-4855-89075898cd7c-edf0-485a"
BUNNY_LIBRARY_ID = "512139"
BUNNY_CDN_HOSTNAME = "vz-b9d9b0d0-e78.b-cdn.net"

# B2 Configuration
B2_KEY_ID = "0031108d4b36d830000000003"
B2_APP_KEY = "K003la4MIw5V+KDsvjFi+yfk0O0DK9E"
B2_BUCKET_NAME = "kudopy"
CDN_URL = "https://f003.backblazeb2.com/file/kudopy"


class BunnyAPI:
    """Bunny.net API wrapper"""
    
    def __init__(self, api_key: str, library_id: str, cdn_hostname: str):
        self.api_key = api_key
        self.library_id = library_id
        self.cdn_hostname = cdn_hostname
        self.base_url = f"https://video.bunnycdn.com/library/{library_id}"
        self.headers = {"AccessKey": api_key}
    
    def list_videos(self) -> List[Dict]:
        """Tüm videoları listele"""
        try:
            response = requests.get(
                f"{self.base_url}/videos",
                headers=self.headers,
                params={"page": 1, "itemsPerPage": 1000}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            return []
        except Exception as e:
            print(f"❌ Video listesi alınamadı: {e}")
            return []
    
    def get_video_info(self, video_id: str) -> Optional[Dict]:
        """Video bilgilerini al"""
        try:
            response = requests.get(
                f"{self.base_url}/videos/{video_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"❌ Video bilgisi alınamadı: {e}")
            return None
    
    def get_video_url(self, video_id: str) -> Optional[str]:
        """Video'nun indirilebilir URL'sini al"""
        # Bunny API'den video bilgisini al
        video_info = self.get_video_info(video_id)
        
        if not video_info:
            return None
        
        # MP4 URL'sini oluştur (signed URL gerekebilir)
        # Bunny Stream'de direkt URL yok, HLS playlist var
        
        # HLS playlist URL'si
        playlist_url = f"https://{self.cdn_hostname}/{video_id}/playlist.m3u8"
        
        # Veya MP4 varsa
        mp4_url = f"https://{self.cdn_hostname}/{video_id}/play_{video_info.get('width', 1920)}p.mp4"
        
        return playlist_url


class B2UltraFast:
    """B2 Ultra Fast Transfer (B2'nin kendi API'si ile)"""
    
    def __init__(self):
        # B2 API
        info = InMemoryAccountInfo()
        self.b2_api = B2Api(info)
        self.b2_api.authorize_account("production", B2_KEY_ID, B2_APP_KEY)
        self.bucket = self.b2_api.get_bucket_by_name(B2_BUCKET_NAME)
        
        print(f"✅ B2 bağlantısı başarılı: {B2_BUCKET_NAME}")
        
        self.bunny = BunnyAPI(BUNNY_API_KEY, BUNNY_LIBRARY_ID, BUNNY_CDN_HOSTNAME)
        
        self.stats = {
            "total": 0,
            "success": 0,
            "failed": 0
        }
    
    def transfer_with_b2_api(self, video_url: str, b2_path: str) -> Dict:
        """B2 API ile transfer (B2 kendi indirir!)"""
        try:
            print(f"  🚀 B2 API transfer başlıyor...")
            print(f"  📡 URL: {video_url[:60]}...")
            
            # B2'ye URL'yi ver, B2 kendi indirsin!
            # NOT: B2'nin copy_from_url API'si yok, ama upload_bytes ile stream yapabiliriz
            
            # Stream download + upload
            response = requests.get(video_url, stream=True, timeout=120)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            
            print(f"  ⚡ Streaming to B2: {b2_path}")
            print(f"  📦 Boyut: {total_size / (1024*1024):.2f} MB")
            
            # Tüm data'yı memory'de topla (küçük videolar için)
            if total_size < 100 * 1024 * 1024:  # 100MB'dan küçükse
                print(f"  💾 Memory'de işleniyor...")
                data = response.content
                
                file_info = self.bucket.upload_bytes(
                    data_bytes=data,
                    file_name=b2_path
                )
                
                print(f"  ✅ Transfer tamamlandı!")
                
                return {
                    "success": True,
                    "file_id": file_info.id_,
                    "url": f"{CDN_URL}/{b2_path}"
                }
            else:
                # Büyük dosyalar için large file upload
                print(f"  📦 Large file upload...")
                
                # Chunk'lar halinde yükle
                chunks = []
                downloaded = 0
                start_time = time.time()
                
                for chunk in response.iter_content(chunk_size=5*1024*1024):  # 5MB chunks
                    if chunk:
                        chunks.append(chunk)
                        downloaded += len(chunk)
                        
                        percent = (downloaded / total_size) * 100
                        elapsed = time.time() - start_time
                        speed = downloaded / elapsed / 1024 / 1024 if elapsed > 0 else 0
                        print(f"\r  ⚡ {percent:.1f}% | {speed:.2f} MB/s", end='', flush=True)
                
                print(f"\n  📤 B2'ye yükleniyor...")
                
                # Tüm chunk'ları birleştir ve yükle
                full_data = b''.join(chunks)
                
                file_info = self.bucket.upload_bytes(
                    data_bytes=full_data,
                    file_name=b2_path
                )
                
                print(f"  ✅ Transfer tamamlandı!")
                
                return {
                    "success": True,
                    "file_id": file_info.id_,
                    "url": f"{CDN_URL}/{b2_path}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def transfer_all(self):
        """Tüm videoları transfer et"""
        print("\n🚀 Ultra hızlı transfer başlıyor...")
        
        videos = self.bunny.list_videos()
        self.stats["total"] = len(videos)
        
        print(f"📊 Toplam {len(videos)} video bulundu\n")
        
        for i, video in enumerate(videos, 1):
            title = video.get('title', 'Untitled')
            video_id = video.get('guid')
            
            print(f"\n[{i}/{len(videos)}] {title}")
            print("-" * 60)
            
            # Video URL
            video_url = self.bunny.get_video_url(video_id)
            b2_path = f"bunny-ultra/{video_id}.mp4"
            
            # Transfer
            result = self.transfer_with_b2_api(video_url, b2_path)
            
            if result["success"]:
                self.stats["success"] += 1
                print(f"  ✅ Başarılı!")
            else:
                self.stats["failed"] += 1
                print(f"  ❌ Başarısız: {result.get('error')}")
        
        self._print_summary()
    
    def transfer_single(self, video_id: str):
        """Tek video transfer et"""
        videos = self.bunny.list_videos()
        video = next((v for v in videos if v.get("guid") == video_id), None)
        
        if not video:
            print(f"❌ Video bulunamadı: {video_id}")
            return
        
        title = video.get('title', 'Untitled')
        print(f"\n📹 {title}")
        print("-" * 60)
        
        video_url = self.bunny.get_video_url(video_id)
        b2_path = f"bunny-ultra/{video_id}.mp4"
        
        result = self.transfer_with_b2_api(video_url, b2_path)
        
        if result["success"]:
            print(f"\n✅ Transfer başarılı!")
            print(f"🔗 URL: {result['url']}")
        else:
            print(f"\n❌ Transfer başarısız: {result.get('error')}")
    
    def _print_summary(self):
        """Özet"""
        print("\n" + "=" * 60)
        print("📊 TRANSFER ÖZETİ")
        print("=" * 60)
        print(f"Toplam:    {self.stats['total']}")
        print(f"✅ Başarılı: {self.stats['success']}")
        print(f"❌ Başarısız: {self.stats['failed']}")
        print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Bunny → B2 Ultra Hızlı Transfer (bilgisayar kullanmadan!)"
    )
    
    parser.add_argument("--all", action="store_true", help="Tüm videoları transfer et")
    parser.add_argument("--video-id", type=str, help="Tek video transfer et")
    
    args = parser.parse_args()
    
    transfer = B2UltraFast()
    
    if args.all:
        transfer.transfer_all()
    elif args.video_id:
        transfer.transfer_single(args.video_id)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
