#!/usr/bin/env python3
"""
TurkAnime → Bunny Encode → B2 Storage
1. TurkAnime'den video URL al
2. Bunny Stream'e yükle (encoding için)
3. Encode bitince Bunny'den HLS dosyalarını indir
4. B2'ye yükle
"""

import os
import sys
import time
import json
import requests
import argparse
from pathlib import Path
from typing import Optional, Dict, List

# B2 SDK
try:
    from b2sdk.v2 import B2Api, InMemoryAccountInfo
except ImportError:
    print("❌ b2sdk kurulu değil! Kurulum: pip install b2sdk")
    sys.exit(1)

# turkanime-indirici
try:
    import turkanime_api as ta
except ImportError:
    print("❌ turkanime-indirici kurulu değil! Kurulum: pip install turkanime-cli")
    sys.exit(1)

# Environment variables
BUNNY_LIBRARY_ID = os.getenv("VITE_BUNNY_LIBRARY_ID", "512139")
BUNNY_API_KEY = os.getenv("VITE_BUNNY_STREAM_API_KEY", "26908cc0-97c0-4855-89075898cd7c-edf0-485a")
BUNNY_CDN_HOSTNAME = os.getenv("VITE_BUNNY_CDN_HOSTNAME", "vz-67bc14ff-5a0.b-cdn.net")

B2_KEY_ID = os.getenv("VITE_B2_KEY_ID", "0031108d4b36d830000000003")
B2_APP_KEY = os.getenv("VITE_B2_APPLICATION_KEY", "K003la4MIw5V+KDsvjFi+yfk0O0DK9E")
B2_BUCKET_NAME = os.getenv("VITE_B2_BUCKET_NAME", "kudopy")
CDN_URL = os.getenv("VITE_CDN_URL", "https://f003.backblazeb2.com/file/kudopy")

if not BUNNY_API_KEY or not B2_KEY_ID or not B2_APP_KEY:
    print("❌ API bilgileri eksik!")
    print("Gerekli environment variables:")
    print("  VITE_BUNNY_STREAM_API_KEY")
    print("  VITE_B2_KEY_ID")
    print("  VITE_B2_APPLICATION_KEY")
    sys.exit(1)


class BunnyToB2Transfer:
    """Bunny Stream encode → B2 storage transfer"""
    
    def __init__(self):
        self.bunny_api_key = BUNNY_API_KEY
        self.bunny_library_id = BUNNY_LIBRARY_ID
        self.bunny_cdn = BUNNY_CDN_HOSTNAME
        
        # B2 initialize
        info = InMemoryAccountInfo()
        self.b2_api = B2Api(info)
        self.b2_api.authorize_account("production", B2_KEY_ID, B2_APP_KEY)
        self.bucket = self.b2_api.get_bucket_by_name(B2_BUCKET_NAME)
        
        print(f"✅ Bunny Library: {self.bunny_library_id}")
        print(f"✅ B2 Bucket: {B2_BUCKET_NAME}")
    
    def create_bunny_video(self, title: str, collection_id: str = None) -> Dict:
        """Bunny Stream'de video oluştur"""
        url = f"https://video.bunnycdn.com/library/{self.bunny_library_id}/videos"
        
        headers = {
            "AccessKey": self.bunny_api_key,
            "Content-Type": "application/json"
        }
        
        data = {"title": title}
        if collection_id:
            data["collectionId"] = collection_id
        
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        return response.json()
    
    def upload_to_bunny(self, video_id: str, video_url: str) -> bool:
        """Video URL'sini Bunny'ye yükle (fetch)"""
        url = f"https://video.bunnycdn.com/library/{self.bunny_library_id}/videos/{video_id}/fetch"
        
        headers = {
            "AccessKey": self.bunny_api_key,
            "Content-Type": "application/json"
        }
        
        data = {"url": video_url}
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            return True
        else:
            print(f"❌ Bunny upload hatası: {response.status_code}")
            print(response.text)
            return False
    
    def wait_for_encoding(self, video_id: str, timeout: int = 3600) -> bool:
        """Encoding bitene kadar bekle"""
        url = f"https://video.bunnycdn.com/library/{self.bunny_library_id}/videos/{video_id}"
        
        headers = {"AccessKey": self.bunny_api_key}
        
        start_time = time.time()
        
        while True:
            if time.time() - start_time > timeout:
                print("⏱️ Timeout! Encoding çok uzun sürdü.")
                return False
            
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                print(f"❌ Video bilgisi alınamadı: {response.status_code}")
                return False
            
            video_data = response.json()
            status = video_data.get("status", 0)
            
            # Status: 0=Queued, 1=Processing, 2=Encoding, 3=Finished, 4=Error, 5=Deleted
            if status == 3:
                print("✅ Encoding tamamlandı!")
                return True
            elif status == 4:
                print("❌ Encoding hatası!")
                return False
            elif status == 5:
                print("❌ Video silindi!")
                return False
            else:
                status_names = {0: "Sırada", 1: "İşleniyor", 2: "Encode ediliyor"}
                status_name = status_names.get(status, f"Bilinmeyen ({status})")
                print(f"  ⏳ {status_name}... ({int(time.time() - start_time)}s)")
                time.sleep(10)
    
    def download_hls_from_bunny(self, video_id: str, output_dir: str) -> List[str]:
        """Bunny'den HLS dosyalarını indir"""
        # Bunny CDN URL pattern: https://{cdn-hostname}/{library-id}/{video-id}/playlist.m3u8
        base_url = f"https://{self.bunny_cdn}/{self.bunny_library_id}/{video_id}"
        playlist_url = f"{base_url}/playlist.m3u8"
        
        print(f"📥 HLS dosyaları indiriliyor: {playlist_url}")
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        downloaded_files = []
        
        # 1. playlist.m3u8 indir
        response = requests.get(playlist_url)
        if response.status_code != 200:
            print(f"❌ Playlist indirilemedi: {response.status_code}")
            return []
        
        playlist_file = output_path / "playlist.m3u8"
        playlist_file.write_text(response.text)
        downloaded_files.append(str(playlist_file))
        
        # 2. .ts segment dosyalarını bul ve indir
        for line in response.text.split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                # Segment URL
                segment_url = f"{base_url}/{line}"
                segment_file = output_path / line
                
                print(f"  📥 {line}")
                seg_response = requests.get(segment_url)
                if seg_response.status_code == 200:
                    segment_file.write_bytes(seg_response.content)
                    downloaded_files.append(str(segment_file))
        
        print(f"✅ {len(downloaded_files)} dosya indirildi")
        return downloaded_files
    
    def upload_to_b2(self, local_dir: str, b2_prefix: str) -> List[Dict]:
        """HLS dosyalarını B2'ye yükle"""
        print(f"📤 B2'ye yükleniyor: {b2_prefix}")
        
        results = []
        
        for file_path in Path(local_dir).rglob('*'):
            if file_path.is_file():
                relative_path = file_path.relative_to(local_dir)
                b2_path = f"{b2_prefix}/{relative_path}".replace('\\', '/')
                
                print(f"  📤 {relative_path}")
                
                try:
                    file_info = self.bucket.upload_local_file(
                        local_file=str(file_path),
                        file_name=b2_path
                    )
                    
                    results.append({
                        "success": True,
                        "file_name": b2_path,
                        "url": f"{CDN_URL}/{b2_path}"
                    })
                except Exception as e:
                    print(f"    ❌ Hata: {e}")
                    results.append({
                        "success": False,
                        "file_name": b2_path,
                        "error": str(e)
                    })
        
        return results
    
    def delete_bunny_video(self, video_id: str) -> bool:
        """Bunny'den videoyu sil (temizlik)"""
        url = f"https://video.bunnycdn.com/library/{self.bunny_library_id}/videos/{video_id}"
        
        headers = {"AccessKey": self.bunny_api_key}
        
        response = requests.delete(url, headers=headers)
        return response.status_code == 200
    
    def transfer_episode(self, anime_slug: str, episode_slug: str, 
                        b2_folder: str, fansub: str = None) -> Dict:
        """Tek bölüm transfer et"""
        
        print(f"\n{'='*60}")
        print(f"📺 Episode: {episode_slug}")
        print(f"📁 B2 Folder: {b2_folder}")
        print(f"{'='*60}\n")
        
        try:
            # 1. TurkAnime'den video URL al
            print("🔍 TurkAnime'den video aranıyor...")
            
            # Episode slug'dan bölüm numarasını çıkar
            parts = episode_slug.rsplit('-', 2)
            if len(parts) >= 2 and parts[-1] == 'bolum':
                episode_num = int(parts[-2])
            else:
                raise Exception(f"Geçersiz episode slug: {episode_slug}")
            
            anime = ta.Anime(anime_slug, parse_fansubs=True)
            bolum = anime.bolumler[episode_num - 1]
            
            print(f"✅ Anime: {anime.title}")
            print(f"✅ Bölüm: {bolum.title}")
            
            # En iyi videoyu bul
            best_video = bolum.best_video(by_res=True, by_fansub=fansub)
            if not best_video:
                raise Exception("Video bulunamadı!")
            
            video_url = best_video.url
            if not video_url:
                raise Exception("Video URL'si alınamadı!")
            
            print(f"✅ Video URL: {video_url[:80]}...")
            
            # 2. Bunny'de video oluştur
            print("\n📤 Bunny Stream'e yükleniyor...")
            video_title = f"{anime.title} - {bolum.title}"
            bunny_video = self.create_bunny_video(video_title)
            video_id = bunny_video["guid"]
            
            print(f"✅ Bunny Video ID: {video_id}")
            
            # 3. Video URL'sini Bunny'ye fetch et
            if not self.upload_to_bunny(video_id, video_url):
                raise Exception("Bunny'ye upload başarısız!")
            
            print("✅ Upload başlatıldı")
            
            # 4. Encoding bitene kadar bekle
            print("\n⏳ Encoding bekleniyor...")
            if not self.wait_for_encoding(video_id):
                raise Exception("Encoding başarısız!")
            
            # 5. HLS dosyalarını Bunny'den indir
            print("\n📥 HLS dosyaları Bunny'den indiriliyor...")
            temp_dir = f"temp_hls/{video_id}"
            hls_files = self.download_hls_from_bunny(video_id, temp_dir)
            
            if not hls_files:
                raise Exception("HLS dosyaları indirilemedi!")
            
            # 6. B2'ye yükle
            print(f"\n📤 B2'ye yükleniyor...")
            b2_prefix = f"{b2_folder}/Episode {episode_num}"
            b2_results = self.upload_to_b2(temp_dir, b2_prefix)
            
            success_count = sum(1 for r in b2_results if r.get("success"))
            print(f"✅ B2'ye {success_count}/{len(b2_results)} dosya yüklendi")
            
            # 7. Bunny'den videoyu sil (temizlik)
            print("\n🗑️ Bunny'den temizleniyor...")
            if self.delete_bunny_video(video_id):
                print("✅ Bunny videosu silindi")
            
            # 8. Temp dosyaları temizle
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
            print("✅ Temp dosyalar temizlendi")
            
            return {
                "success": True,
                "episode": episode_num,
                "b2_folder": b2_folder,
                "b2_url": f"{CDN_URL}/{b2_prefix}/playlist.m3u8",
                "files_uploaded": success_count
            }
            
        except Exception as e:
            print(f"\n❌ Hata: {e}")
            return {
                "success": False,
                "error": str(e)
            }


def main():
    parser = argparse.ArgumentParser(
        description="TurkAnime → Bunny Encode → B2 Storage",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnek:
  python turkanime_bunny_to_b2.py --anime naruto --episode naruto-1-bolum --b2-folder "Naruto Season 1"
        """
    )
    
    parser.add_argument("--anime", required=True, help="Anime slug (örn: naruto)")
    parser.add_argument("--episode", required=True, help="Episode slug (örn: naruto-1-bolum)")
    parser.add_argument("--b2-folder", required=True, help="B2 klasör adı")
    parser.add_argument("--fansub", type=str, help="Tercih edilen fansub")
    
    args = parser.parse_args()
    
    transfer = BunnyToB2Transfer()
    result = transfer.transfer_episode(
        anime_slug=args.anime,
        episode_slug=args.episode,
        b2_folder=args.b2_folder,
        fansub=args.fansub
    )
    
    # JSON output (API için)
    print("\n" + "="*60)
    print(json.dumps(result, indent=2))
    print("="*60)


if __name__ == "__main__":
    main()
