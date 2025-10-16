"""
Bunny.net'ten Backblaze B2'ye Video Migration Script
Mevcut Bunny.net videolarını B2'ye taşır

Kullanım:
    python migrate_bunny_to_b2.py --all
    python migrate_bunny_to_b2.py --collection "Naruto Season 1"
    python migrate_bunny_to_b2.py --video-id abc123
"""

import os
import sys
import argparse
import requests
import tempfile
import json
import hashlib
from pathlib import Path
from typing import List, Dict, Optional

# B2 SDK
try:
    from b2sdk.v2 import B2Api, InMemoryAccountInfo
except ImportError:
    print("❌ b2sdk kurulu değil!")
    print("Kurulum: pip install b2sdk")
    sys.exit(1)

# Bunny.net Configuration
BUNNY_API_KEY = os.getenv("VITE_BUNNY_STREAM_API_KEY", "")
BUNNY_LIBRARY_ID = os.getenv("VITE_BUNNY_LIBRARY_ID", "")
BUNNY_CDN_HOSTNAME = os.getenv("VITE_BUNNY_CDN_HOSTNAME", "")

# B2 Configuration
B2_KEY_ID = os.getenv("VITE_B2_KEY_ID", "")
B2_APP_KEY = os.getenv("VITE_B2_APPLICATION_KEY", "")
B2_BUCKET_NAME = os.getenv("VITE_B2_BUCKET_NAME", "anime-videos")
CDN_URL = os.getenv("VITE_CDN_URL", "https://videos.yourdomain.com")

if not all([BUNNY_API_KEY, BUNNY_LIBRARY_ID, B2_KEY_ID, B2_APP_KEY]):
    print("❌ API bilgileri eksik!")
    print("Gerekli environment variables:")
    print("  - VITE_BUNNY_STREAM_API_KEY")
    print("  - VITE_BUNNY_LIBRARY_ID")
    print("  - VITE_B2_KEY_ID")
    print("  - VITE_B2_APPLICATION_KEY")
    sys.exit(1)


class BunnyAPI:
    """Bunny.net API wrapper"""
    
    def __init__(self, api_key: str, library_id: str):
        self.api_key = api_key
        self.library_id = library_id
        self.base_url = f"https://video.bunnycdn.com/library/{library_id}"
        self.headers = {"AccessKey": api_key}
    
    def list_videos(self, page: int = 1, items_per_page: int = 100) -> List[Dict]:
        """Tüm videoları listele"""
        try:
            response = requests.get(
                f"{self.base_url}/videos",
                headers=self.headers,
                params={"page": page, "itemsPerPage": items_per_page}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            return []
        except Exception as e:
            print(f"❌ Video listesi alınamadı: {e}")
            return []
    
    def list_collections(self) -> List[Dict]:
        """Tüm collection'ları listele"""
        try:
            response = requests.get(
                f"{self.base_url}/collections",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            return []
        except Exception as e:
            print(f"❌ Collection listesi alınamadı: {e}")
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
    
    def download_video(self, video_id: str, output_path: str) -> bool:
        """Video'yu indir (MP4 fallback)"""
        try:
            # MP4 URL oluştur
            video_url = f"https://{BUNNY_CDN_HOSTNAME}/{video_id}/original"
            
            print(f"  📥 İndiriliyor: {video_url}")
            
            response = requests.get(video_url, stream=True)
            
            if response.status_code != 200:
                print(f"  ⚠️ MP4 bulunamadı, HLS playlist deneniyor...")
                # HLS playlist'ten indir (ffmpeg gerekli)
                return self._download_from_hls(video_id, output_path)
            
            # Dosyaya yaz
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            file_size = os.path.getsize(output_path)
            print(f"  ✅ İndirildi: {file_size / (1024*1024):.2f} MB")
            return True
            
        except Exception as e:
            print(f"  ❌ İndirme hatası: {e}")
            return False
    
    def _download_from_hls(self, video_id: str, output_path: str) -> bool:
        """HLS playlist'ten video indir (ffmpeg gerekli)"""
        try:
            import subprocess
            
            playlist_url = f"https://{BUNNY_CDN_HOSTNAME}/{video_id}/playlist.m3u8"
            
            cmd = [
                'ffmpeg',
                '-i', playlist_url,
                '-c', 'copy',
                '-bsf:a', 'aac_adtstoasc',
                output_path
            ]
            
            result = subprocess.run(cmd, 
                                  stdout=subprocess.DEVNULL,
                                  stderr=subprocess.DEVNULL)
            
            if result.returncode == 0:
                file_size = os.path.getsize(output_path)
                print(f"  ✅ HLS'ten indirildi: {file_size / (1024*1024):.2f} MB")
                return True
            else:
                print(f"  ❌ HLS indirme başarısız")
                return False
                
        except Exception as e:
            print(f"  ❌ HLS indirme hatası: {e}")
            return False


class B2Uploader:
    """Backblaze B2 uploader (turkanime_to_b2.py'den)"""
    
    def __init__(self, key_id: str, app_key: str, bucket_name: str):
        self.key_id = key_id
        self.app_key = app_key
        self.bucket_name = bucket_name
        
        # B2 API initialize
        info = InMemoryAccountInfo()
        self.b2_api = B2Api(info)
        self.b2_api.authorize_account("production", key_id, app_key)
        
        # Bucket al
        self.bucket = self.b2_api.get_bucket_by_name(bucket_name)
        print(f"✅ B2 bağlantısı başarılı: {bucket_name}")
    
    def upload_file(self, local_path: str, b2_path: str) -> Dict:
        """Dosyayı B2'ye yükle"""
        try:
            file_info = self.bucket.upload_local_file(
                local_file=local_path,
                file_name=b2_path
            )
            
            return {
                "success": True,
                "file_id": file_info.id_,
                "file_name": file_info.file_name,
                "url": f"{CDN_URL}/{b2_path}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def upload_directory(self, local_dir: str, b2_prefix: str) -> List[Dict]:
        """Klasördeki tüm dosyaları B2'ye yükle"""
        results = []
        
        for file_path in Path(local_dir).rglob('*'):
            if file_path.is_file():
                relative_path = file_path.relative_to(local_dir)
                b2_path = f"{b2_prefix}/{relative_path}".replace('\\', '/')
                
                print(f"  📤 Yükleniyor: {relative_path}")
                result = self.upload_file(str(file_path), b2_path)
                results.append(result)
        
        return results


class MigrationManager:
    """Bunny -> B2 migration yöneticisi"""
    
    def __init__(self):
        self.bunny = BunnyAPI(BUNNY_API_KEY, BUNNY_LIBRARY_ID)
        self.b2 = B2Uploader(B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME)
        self.stats = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0
        }
    
    def migrate_all(self):
        """Tüm videoları migrate et"""
        print("\n🔄 Tüm videolar migrate ediliyor...")
        
        # Tüm videoları al
        videos = self.bunny.list_videos()
        self.stats["total"] = len(videos)
        
        print(f"📊 Toplam {len(videos)} video bulundu\n")
        
        for i, video in enumerate(videos, 1):
            print(f"\n[{i}/{len(videos)}] {video.get('title', 'Untitled')}")
            print("-" * 60)
            
            result = self.migrate_video(video)
            
            if result["success"]:
                self.stats["success"] += 1
            else:
                self.stats["failed"] += 1
        
        self._print_summary()
    
    def migrate_collection(self, collection_name: str):
        """Belirli bir collection'ı migrate et"""
        print(f"\n🔄 Collection migrate ediliyor: {collection_name}")
        
        # Collection'ı bul
        collections = self.bunny.list_collections()
        collection = next((c for c in collections if c.get("name") == collection_name), None)
        
        if not collection:
            print(f"❌ Collection bulunamadı: {collection_name}")
            return
        
        collection_id = collection.get("guid")
        print(f"✅ Collection bulundu: {collection_id}")
        
        # Collection'daki videoları al
        videos = self.bunny.list_videos()
        collection_videos = [v for v in videos if v.get("collectionId") == collection_id]
        
        self.stats["total"] = len(collection_videos)
        print(f"📊 {len(collection_videos)} video bulundu\n")
        
        for i, video in enumerate(collection_videos, 1):
            print(f"\n[{i}/{len(collection_videos)}] {video.get('title', 'Untitled')}")
            print("-" * 60)
            
            result = self.migrate_video(video, collection_name)
            
            if result["success"]:
                self.stats["success"] += 1
            else:
                self.stats["failed"] += 1
        
        self._print_summary()
    
    def migrate_video(self, video: Dict, collection_name: str = None) -> Dict:
        """Tek bir video'yu migrate et"""
        
        video_id = video.get("guid")
        title = video.get("title", "Untitled")
        
        # B2 path oluştur
        if collection_name:
            b2_prefix = f"{collection_name}/{video_id}"
        else:
            b2_prefix = f"migrated/{video_id}"
        
        # Temp directory
        temp_dir = tempfile.mkdtemp(prefix='bunny_to_b2_')
        temp_video = os.path.join(temp_dir, 'video.mp4')
        
        try:
            # 1. Bunny'den indir
            print(f"  📥 Bunny.net'ten indiriliyor...")
            if not self.bunny.download_video(video_id, temp_video):
                return {"success": False, "error": "Download failed"}
            
            # 2. B2'ye yükle (direkt MP4 olarak)
            print(f"  📤 B2'ye yükleniyor...")
            result = self.b2.upload_file(temp_video, f"{b2_prefix}/video.mp4")
            
            if not result["success"]:
                return {"success": False, "error": result["error"]}
            
            # 3. Metadata oluştur
            metadata = {
                "videoId": video_id,
                "title": title,
                "bunnyVideoId": video_id,
                "migratedAt": __import__('datetime').datetime.now().isoformat(),
                "videoUrl": f"{CDN_URL}/{b2_prefix}/video.mp4",
                "originalBunnyUrl": f"https://{BUNNY_CDN_HOSTNAME}/{video_id}/playlist.m3u8"
            }
            
            metadata_path = os.path.join(temp_dir, 'metadata.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            self.b2.upload_file(metadata_path, f"{b2_prefix}/metadata.json")
            
            print(f"  ✅ Migration başarılı!")
            self._log_success(video_id, title, b2_prefix)
            
            return {"success": True, "b2_prefix": b2_prefix}
            
        except Exception as e:
            print(f"  ❌ Migration hatası: {e}")
            self._log_error(video_id, title, str(e))
            return {"success": False, "error": str(e)}
        finally:
            # Cleanup
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except:
                pass
    
    def _log_success(self, video_id: str, title: str, b2_prefix: str):
        """Başarılı migration'ları logla"""
        log_file = Path("b2_migration_success.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"{video_id}|{title}|{b2_prefix}\n")
    
    def _log_error(self, video_id: str, title: str, error: str):
        """Hataları logla"""
        log_file = Path("b2_migration_errors.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"{video_id}|{title}|{error}\n")
    
    def _print_summary(self):
        """Migration özetini yazdır"""
        print("\n" + "=" * 60)
        print("📊 MIGRATION ÖZETİ")
        print("=" * 60)
        print(f"Toplam:    {self.stats['total']}")
        print(f"✅ Başarılı: {self.stats['success']}")
        print(f"❌ Başarısız: {self.stats['failed']}")
        print(f"⏭️  Atlanan:  {self.stats['skipped']}")
        print("=" * 60)
        
        if self.stats["success"] > 0:
            print(f"\n✅ Başarılı migration'lar: b2_migration_success.log")
        if self.stats["failed"] > 0:
            print(f"❌ Hatalar: b2_migration_errors.log")


def main():
    parser = argparse.ArgumentParser(
        description="Bunny.net'ten Backblaze B2'ye video migration aracı",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnekler:
  # Tüm videoları migrate et
  python migrate_bunny_to_b2.py --all
  
  # Belirli bir collection'ı migrate et
  python migrate_bunny_to_b2.py --collection "Naruto Season 1"
  
  # Tek bir video'yu migrate et
  python migrate_bunny_to_b2.py --video-id abc123
        """
    )
    
    parser.add_argument("--all", action="store_true", help="Tüm videoları migrate et")
    parser.add_argument("--collection", type=str, help="Belirli bir collection'ı migrate et")
    parser.add_argument("--video-id", type=str, help="Tek bir video'yu migrate et")
    
    args = parser.parse_args()
    
    manager = MigrationManager()
    
    if args.all:
        manager.migrate_all()
    elif args.collection:
        manager.migrate_collection(args.collection)
    elif args.video_id:
        # Tek video için
        video_info = manager.bunny.get_video_info(args.video_id)
        if video_info:
            result = manager.migrate_video(video_info)
            if result["success"]:
                print(f"\n✅ Video başarıyla migrate edildi!")
            else:
                print(f"\n❌ Migration başarısız: {result['error']}")
        else:
            print(f"❌ Video bulunamadı: {args.video_id}")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
