"""
Bunny → B2 Basit Transfer
yt-dlp ile Bunny HLS'i indir, B2'ye yükle

Kullanım:
    python bunny_to_b2_simple.py --video-id abc123
    python bunny_to_b2_simple.py --all
"""

import os
import sys
import argparse
import requests
import tempfile
import json
import time
from pathlib import Path
from typing import List, Dict, Optional
from yt_dlp import YoutubeDL

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
    """Bunny.net API"""
    
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
                return response.json().get("items", [])
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
    
    def get_collection_name(self, collection_id: str) -> Optional[str]:
        """Collection adını al"""
        try:
            response = requests.get(
                f"{self.base_url}/collections",
                headers=self.headers
            )
            
            if response.status_code == 200:
                collections = response.json().get("items", [])
                for collection in collections:
                    if collection.get("guid") == collection_id:
                        return collection.get("name")
            return None
        except Exception as e:
            print(f"❌ Collection adı alınamadı: {e}")
            return None
    
    def get_hls_url(self, video_id: str) -> str:
        """HLS playlist URL'sini al"""
        # Bunny Stream iframe URL'si (bu çalışır)
        return f"https://iframe.mediadelivery.net/embed/{self.library_id}/{video_id}"


class SimpleTransfer:
    """Basit Bunny → B2 transfer"""
    
    def __init__(self):
        self.bunny = BunnyAPI(BUNNY_API_KEY, BUNNY_LIBRARY_ID, BUNNY_CDN_HOSTNAME)
        
        # B2 API
        info = InMemoryAccountInfo()
        self.b2_api = B2Api(info)
        self.b2_api.authorize_account("production", B2_KEY_ID, B2_APP_KEY)
        self.bucket = self.b2_api.get_bucket_by_name(B2_BUCKET_NAME)
        
        print(f"✅ B2 bağlantısı başarılı: {B2_BUCKET_NAME}")
        
        self.stats = {"total": 0, "success": 0, "failed": 0}
    
    def transfer_video(self, video: Dict) -> Dict:
        """Tek video transfer et"""
        
        video_id = video.get("guid")
        title = video.get("title", "Untitled")
        collection_id = video.get("collectionId")
        
        print(f"\n📹 {title}")
        print("-" * 60)
        
        # Collection adını al
        collection_name = "uncategorized"
        if collection_id:
            fetched_name = self.bunny.get_collection_name(collection_id)
            if fetched_name:
                # Dosya sistemi için güvenli hale getir
                collection_name = fetched_name.replace("/", "-").replace("\\", "-").replace(":", "-")
                print(f"  📁 Collection: {collection_name}")
        
        # HLS URL
        hls_url = self.bunny.get_hls_url(video_id)
        print(f"  📡 HLS: {hls_url}")
        
        # Temp file
        temp_dir = tempfile.mkdtemp(prefix='bunny_to_b2_')
        temp_video = os.path.join(temp_dir, 'video.mp4')
        
        try:
            # yt-dlp ile indir
            print(f"  📥 İndiriliyor (yt-dlp)...")
            
            ydl_opts = {
                'outtmpl': temp_video,
                'format': 'bestvideo[height<=1080]+bestaudio/best',  # En yüksek 1080p
                'quiet': False,
                'no_warnings': True,
                # Bunny Stream için gerekli header'lar
                'http_headers': {
                    'Referer': f'https://iframe.mediadelivery.net/',
                    'Origin': 'https://iframe.mediadelivery.net',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
            }
            
            with YoutubeDL(ydl_opts) as ydl:
                ydl.download([hls_url])
            
            file_size = os.path.getsize(temp_video)
            print(f"  ✅ İndirildi: {file_size / (1024*1024):.2f} MB")
            
            # Dosya adını güvenli hale getir (video başlığından)
            safe_title = title.replace("/", "-").replace("\\", "-").replace(":", "-").replace("?", "").replace("*", "").replace("|", "-").replace("<", "").replace(">", "").replace('"', "")
            
            # B2'ye yükle (collection klasörü altına, başlık ile)
            b2_path = f"{collection_name}/{safe_title}.mp4"
            print(f"  📤 B2'ye yükleniyor: {b2_path}")
            print(f"  📦 Dosya boyutu: {file_size / (1024*1024):.2f} MB")
            
            # Progress listener class (B2 SDK formatı)
            from b2sdk.v2 import AbstractProgressListener
            
            class UploadProgressListener(AbstractProgressListener):
                def __init__(self):
                    self.start_time = time.time()
                    self.last_update = 0
                
                def set_total_bytes(self, total_byte_count):
                    self.total_bytes = total_byte_count
                
                def bytes_completed(self, byte_count):
                    # Her 1MB'de bir güncelle (çok sık güncelleme olmasın)
                    if byte_count - self.last_update > 1024 * 1024:
                        percent = (byte_count / self.total_bytes) * 100 if self.total_bytes > 0 else 0
                        elapsed = time.time() - self.start_time
                        speed = byte_count / elapsed / 1024 / 1024 if elapsed > 0 else 0
                        print(f"\r  ⬆️  {percent:.1f}% | {speed:.2f} MB/s | {byte_count/(1024*1024):.1f}/{self.total_bytes/(1024*1024):.1f} MB", end='', flush=True)
                        self.last_update = byte_count
            
            progress_listener = UploadProgressListener()
            
            # Upload
            file_info = self.bucket.upload_local_file(
                local_file=temp_video,
                file_name=b2_path,
                progress_listener=progress_listener
            )
            
            print(f"\n  ✅ B2'ye yüklendi!")
            print(f"  🆔 File ID: {file_info.id_}")
            print(f"  📁 File Name: {file_info.file_name}")
            print(f"  🔗 URL: {CDN_URL}/{b2_path}")
            
            # Dosyanın gerçekten var olduğunu doğrula
            try:
                file_check = self.bucket.get_file_info_by_name(b2_path)
                print(f"  ✅ Doğrulandı: Dosya B2'de mevcut")
            except Exception as e:
                print(f"  ⚠️ Uyarı: Dosya doğrulanamadı: {e}")
            
            return {"success": True, "b2_path": b2_path}
            
        except Exception as e:
            print(f"  ❌ Hata: {e}")
            return {"success": False, "error": str(e)}
        finally:
            # Cleanup
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except:
                pass
    
    def transfer_all(self):
        """Tüm videoları transfer et"""
        print("\n🔄 Tüm videolar transfer ediliyor...")
        
        videos = self.bunny.list_videos()
        self.stats["total"] = len(videos)
        
        print(f"📊 Toplam {len(videos)} video bulundu\n")
        
        for i, video in enumerate(videos, 1):
            print(f"\n[{i}/{len(videos)}]")
            
            result = self.transfer_video(video)
            
            if result["success"]:
                self.stats["success"] += 1
            else:
                self.stats["failed"] += 1
        
        self._print_summary()
    
    def transfer_single(self, video_id: str):
        """Tek video transfer et"""
        videos = self.bunny.list_videos()
        video = next((v for v in videos if v.get("guid") == video_id), None)
        
        if not video:
            print(f"❌ Video bulunamadı: {video_id}")
            return
        
        result = self.transfer_video(video)
        
        if result["success"]:
            print(f"\n✅ Transfer başarılı!")
        else:
            print(f"\n❌ Transfer başarısız: {result.get('error')}")
    
    def transfer_collection(self, collection_name: str):
        """Belirli bir collection'ı transfer et"""
        print(f"\n🔄 Collection transfer ediliyor: {collection_name}")
        
        # Önce collection ID'sini bul
        try:
            response = requests.get(
                f"https://video.bunnycdn.com/library/{BUNNY_LIBRARY_ID}/collections",
                headers={"AccessKey": BUNNY_API_KEY}
            )
            collections = response.json().get("items", []) if response.status_code == 200 else []
        except Exception as e:
            print(f"❌ Collection listesi alınamadı: {e}")
            return
        
        collection = next((c for c in collections if c.get("name") == collection_name), None)
        
        if not collection:
            print(f"❌ Collection bulunamadı: {collection_name}")
            print(f"\n📂 Mevcut collection'lar:")
            for c in collections:
                print(f"  - {c.get('name')}")
            return
        
        collection_id = collection.get("guid")
        print(f"✅ Collection bulundu: {collection_name} (ID: {collection_id})")
        
        # Collection'daki videoları bul
        videos = self.bunny.list_videos()
        collection_videos = [v for v in videos if v.get("collectionId") == collection_id]
        
        self.stats["total"] = len(collection_videos)
        
        print(f"📊 Toplam {len(collection_videos)} video bulundu\n")
        
        if len(collection_videos) == 0:
            print(f"⚠️ Bu collection'da video yok!")
            return
        
        for i, video in enumerate(collection_videos, 1):
            print(f"\n[{i}/{len(collection_videos)}]")
            
            result = self.transfer_video(video)
            
            if result["success"]:
                self.stats["success"] += 1
            else:
                self.stats["failed"] += 1
        
        self._print_summary()
    
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
        description="Bunny → B2 Basit Transfer (yt-dlp ile)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnekler:
  # Tüm videoları transfer et
  python bunny_to_b2_simple.py --all
  
  # Tek video transfer et
  python bunny_to_b2_simple.py --video-id abc123
  
  # Belirli bir collection'ı transfer et
  python bunny_to_b2_simple.py --collection "One Piece Season 1"
        """
    )
    
    parser.add_argument("--all", action="store_true", help="Tüm videoları transfer et")
    parser.add_argument("--video-id", type=str, help="Tek video transfer et")
    parser.add_argument("--collection", type=str, help="Belirli bir collection'ı transfer et")
    
    args = parser.parse_args()
    
    transfer = SimpleTransfer()
    
    if args.all:
        transfer.transfer_all()
    elif args.video_id:
        transfer.transfer_single(args.video_id)
    elif args.collection:
        transfer.transfer_collection(args.collection)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
