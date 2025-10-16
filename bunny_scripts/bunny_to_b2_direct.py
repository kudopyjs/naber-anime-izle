"""
Bunny.net'ten B2'ye Direkt Transfer (Encode Etmeden!)
Bunny'deki videoları olduğu gibi B2'ye kopyalar (çok hızlı!)

Kullanım:
    python bunny_to_b2_direct.py --all
    python bunny_to_b2_direct.py --collection "Naruto Season 1"
    python bunny_to_b2_direct.py --video-id abc123
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

# B2 SDK
try:
    from b2sdk.v2 import B2Api, InMemoryAccountInfo
except ImportError:
    print("❌ b2sdk kurulu değil!")
    print("Kurulum: pip install b2sdk")
    sys.exit(1)

# Bunny.net Configuration
BUNNY_API_KEY = os.getenv("VITE_BUNNY_STREAM_API_KEY", "26908cc0-97c0-4855-89075898cd7c-edf0-485a")
BUNNY_LIBRARY_ID = os.getenv("VITE_BUNNY_LIBRARY_ID", "512139")
BUNNY_CDN_HOSTNAME = os.getenv("VITE_BUNNY_CDN_HOSTNAME", "vz-b9d9b0d0-e78.b-cdn.net")

# B2 Configuration
B2_KEY_ID = os.getenv("VITE_B2_KEY_ID", "0031108d4b36d830000000003")
B2_APP_KEY = os.getenv("VITE_B2_APPLICATION_KEY", "K003la4MIw5V+KDsvjFi+yfk0O0DK9E")
B2_BUCKET_NAME = os.getenv("VITE_B2_BUCKET_NAME", "kudopy")
CDN_URL = os.getenv("VITE_CDN_URL", "https://f003.backblazeb2.com/file/kudopy")


class BunnyAPI:
    """Bunny.net API wrapper"""
    
    def __init__(self, api_key: str, library_id: str, cdn_hostname: str):
        self.api_key = api_key
        self.library_id = library_id
        self.cdn_hostname = cdn_hostname
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
    
    def get_video_url(self, video_id: str) -> Optional[str]:
        """Video'nun MP4 URL'sini al"""
        # Bunny Stream MP4 URL formatı
        return f"https://{self.cdn_hostname}/{video_id}/original"


class B2Uploader:
    """Backblaze B2 uploader"""
    
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
    
    def upload_from_url_stream(self, url: str, b2_path: str) -> Dict:
        """URL'den direkt B2'ye stream transfer (disk kullanmadan!)"""
        try:
            print(f"  🚀 Stream transfer başlıyor (disk kullanmadan)...")
            print(f"  📡 {url[:60]}...")
            
            # Stream download
            response = requests.get(url, stream=True, timeout=60)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            
            # B2'ye direkt stream upload
            print(f"  ⚡ Direkt B2'ye aktarılıyor: {b2_path}")
            
            # Stream iterator
            def data_stream():
                downloaded = 0
                start_time = time.time()
                
                for chunk in response.iter_content(chunk_size=1024*1024):
                    if chunk:
                        downloaded += len(chunk)
                        
                        # Progress
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            elapsed = time.time() - start_time
                            speed = downloaded / elapsed / 1024 / 1024 if elapsed > 0 else 0
                            print(f"\r  ⚡ {percent:.1f}% | {speed:.2f} MB/s | {downloaded/(1024*1024):.1f}/{total_size/(1024*1024):.1f} MB", end='', flush=True)
                        
                        yield chunk
            
            # B2'ye stream upload
            file_info = self.bucket.upload_bytes(
                data_bytes=b''.join(data_stream()),
                file_name=b2_path
            )
            
            print(f"\n  ✅ Stream transfer tamamlandı!")
            
            return {
                "success": True,
                "file_id": file_info.id_,
                "url": f"{CDN_URL}/{b2_path}"
            }
                    
        except Exception as e:
            print(f"\n  ⚠️ Stream transfer başarısız: {e}")
            print(f"  💾 Temp file ile deneniyor...")
            # Fallback: temp file kullan
            return self.upload_from_url_temp(url, b2_path)
    
    def upload_from_url_temp(self, url: str, b2_path: str) -> Dict:
        """URL'den B2'ye yükle (temp file ile - fallback)"""
        try:
            print(f"  📥 İndiriliyor (temp file)...")
            
            # Stream download
            response = requests.get(url, stream=True, timeout=60)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            start_time = time.time()
            
            # Temp file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
            
            try:
                with open(temp_file.name, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=1024*1024):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            
                            # Progress
                            if total_size > 0:
                                percent = (downloaded / total_size) * 100
                                elapsed = time.time() - start_time
                                speed = downloaded / elapsed / 1024 / 1024 if elapsed > 0 else 0
                                print(f"\r  ⏬ {percent:.1f}% | {speed:.2f} MB/s", end='', flush=True)
                
                print(f"\n  ✅ İndirildi: {downloaded / (1024*1024):.2f} MB")
                
                # B2'ye yükle
                print(f"  📤 B2'ye yükleniyor: {b2_path}")
                file_info = self.bucket.upload_local_file(
                    local_file=temp_file.name,
                    file_name=b2_path
                )
                
                print(f"  ✅ B2'ye yüklendi!")
                
                return {
                    "success": True,
                    "file_id": file_info.id_,
                    "url": f"{CDN_URL}/{b2_path}"
                }
                
            finally:
                # Cleanup
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
                    
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def upload_from_url(self, url: str, b2_path: str) -> Dict:
        """URL'den B2'ye yükle (stream öncelikli)"""
        # Önce stream dene, başarısız olursa temp file
        return self.upload_from_url_stream(url, b2_path)


class DirectTransfer:
    """Bunny → B2 direkt transfer (encode etmeden)"""
    
    def __init__(self):
        self.bunny = BunnyAPI(BUNNY_API_KEY, BUNNY_LIBRARY_ID, BUNNY_CDN_HOSTNAME)
        self.b2 = B2Uploader(B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME)
        self.stats = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0
        }
    
    def transfer_all(self):
        """Tüm videoları transfer et"""
        print("\n🔄 Tüm videolar transfer ediliyor...")
        
        videos = self.bunny.list_videos()
        self.stats["total"] = len(videos)
        
        print(f"📊 Toplam {len(videos)} video bulundu\n")
        
        for i, video in enumerate(videos, 1):
            title = video.get('title', 'Untitled')
            video_id = video.get('guid')
            
            print(f"\n[{i}/{len(videos)}] {title}")
            print("-" * 60)
            
            result = self.transfer_video(video)
            
            if result["success"]:
                self.stats["success"] += 1
            elif result.get("skipped"):
                self.stats["skipped"] += 1
            else:
                self.stats["failed"] += 1
        
        self._print_summary()
    
    def transfer_video(self, video: Dict) -> Dict:
        """Tek bir video'yu transfer et"""
        
        video_id = video.get("guid")
        title = video.get("title", "Untitled")
        collection_id = video.get("collectionId")
        
        # B2 path oluştur
        b2_path = f"bunny-direct/{video_id}.mp4"
        
        try:
            # Bunny URL
            video_url = self.bunny.get_video_url(video_id)
            
            # B2'ye yükle
            result = self.b2.upload_from_url(video_url, b2_path)
            
            if result["success"]:
                # Metadata kaydet
                metadata = {
                    "videoId": video_id,
                    "title": title,
                    "bunnyCollectionId": collection_id,
                    "transferredAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "videoUrl": result["url"],
                    "originalBunnyUrl": video_url
                }
                
                metadata_path = f"bunny-direct/{video_id}.json"
                
                # Metadata'yı temp file'a yaz ve yükle
                temp_meta = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json')
                try:
                    json.dump(metadata, temp_meta, indent=2)
                    temp_meta.close()
                    
                    self.b2.bucket.upload_local_file(
                        local_file=temp_meta.name,
                        file_name=metadata_path
                    )
                finally:
                    try:
                        os.unlink(temp_meta.name)
                    except:
                        pass
                
                print(f"  ✅ Transfer başarılı!")
                self._log_success(video_id, title, b2_path)
                
                return {"success": True}
            else:
                print(f"  ❌ Transfer başarısız: {result['error']}")
                self._log_error(video_id, title, result["error"])
                return {"success": False, "error": result["error"]}
                
        except Exception as e:
            print(f"  ❌ Hata: {e}")
            self._log_error(video_id, title, str(e))
            return {"success": False, "error": str(e)}
    
    def _log_success(self, video_id: str, title: str, b2_path: str):
        """Başarılı transfer'ları logla"""
        log_file = Path("bunny_to_b2_success.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"{video_id}|{title}|{b2_path}\n")
    
    def _log_error(self, video_id: str, title: str, error: str):
        """Hataları logla"""
        log_file = Path("bunny_to_b2_errors.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"{video_id}|{title}|{error}\n")
    
    def _print_summary(self):
        """Transfer özetini yazdır"""
        print("\n" + "=" * 60)
        print("📊 TRANSFER ÖZETİ")
        print("=" * 60)
        print(f"Toplam:    {self.stats['total']}")
        print(f"✅ Başarılı: {self.stats['success']}")
        print(f"❌ Başarısız: {self.stats['failed']}")
        print(f"⏭️  Atlanan:  {self.stats['skipped']}")
        print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Bunny.net'ten B2'ye direkt transfer (encode etmeden!)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnekler:
  # Tüm videoları transfer et
  python bunny_to_b2_direct.py --all
  
  # Belirli bir collection'ı transfer et
  python bunny_to_b2_direct.py --collection "Naruto Season 1"
  
  # Tek bir video'yu transfer et
  python bunny_to_b2_direct.py --video-id abc123

NOT: Bu script videoları ENCODE ETMEZ, olduğu gibi kopyalar!
Çok daha hızlı ama HLS formatında değil, direkt MP4.
        """
    )
    
    parser.add_argument("--all", action="store_true", help="Tüm videoları transfer et")
    parser.add_argument("--collection", type=str, help="Belirli bir collection'ı transfer et")
    parser.add_argument("--video-id", type=str, help="Tek bir video'yu transfer et")
    
    args = parser.parse_args()
    
    transfer = DirectTransfer()
    
    if args.all:
        transfer.transfer_all()
    elif args.video_id:
        # Tek video
        bunny = BunnyAPI(BUNNY_API_KEY, BUNNY_LIBRARY_ID, BUNNY_CDN_HOSTNAME)
        videos = bunny.list_videos()
        video = next((v for v in videos if v.get("guid") == args.video_id), None)
        
        if video:
            result = transfer.transfer_video(video)
            if result["success"]:
                print("\n✅ Video başarıyla transfer edildi!")
            else:
                print(f"\n❌ Transfer başarısız: {result.get('error')}")
        else:
            print(f"❌ Video bulunamadı: {args.video_id}")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
