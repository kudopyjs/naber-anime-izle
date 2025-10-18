import os
import sys
import argparse
import tempfile
import time
import json
import hashlib
import subprocess
import requests
from pathlib import Path
from typing import Optional, List, Dict

# B2 SDK
try:
    from b2sdk.v2 import B2Api, InMemoryAccountInfo
except ImportError:
    print("❌ b2sdk kurulu değil!")
    print("Kurulum: pip install b2sdk")
    sys.exit(1)

# turkanime-indirici
try:
    import turkanime_api as ta
except ImportError:
    print("❌ turkanime-indirici kurulu değil!")
    print("Kurulum: pip install turkanime-cli")
    sys.exit(1)

# yt-dlp
try:
    from yt_dlp import YoutubeDL
except ImportError:
    print("❌ yt-dlp kurulu değil!")
    print("Kurulum: pip install yt-dlp")
    sys.exit(1)

# B2 Configuration
B2_KEY_ID = os.getenv("VITE_B2_KEY_ID", "0031108d4b36d830000000003")
B2_APP_KEY = os.getenv("VITE_B2_APPLICATION_KEY", "K003la4MIw5V+KDsvjFi+yfk0O0DK9E")
B2_BUCKET_NAME = os.getenv("VITE_B2_BUCKET_NAME", "kudopy")
CDN_URL = os.getenv("VITE_CDN_URL", "https://f003.backblazeb2.com/file/kudopy")

if not B2_KEY_ID or not B2_APP_KEY:
    print("❌ B2 API bilgileri bulunamadı!")
    print("Lütfen environment variables ayarlayın:")
    print("  export VITE_B2_KEY_ID=your-key-id")
    print("  export VITE_B2_APPLICATION_KEY=your-app-key")
    sys.exit(1)


class B2Uploader:
    """Backblaze B2'ye video yükleme sınıfı"""
    
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
    
    def file_exists(self, b2_path: str) -> bool:
        """Dosya B2'de var mı kontrol et"""
        try:
            file_versions = self.bucket.ls(b2_path, latest_only=True)
            return len(list(file_versions)) > 0
        except:
            return False
    
    def check_episode_exists(self, b2_prefix: str) -> bool:
        """Bölüm klasörü B2'de tam olarak var mı kontrol et (playlist + metadata)"""
        try:
            # Playlist ve metadata dosyalarını kontrol et
            playlist_path = f"{b2_prefix}/playlist.m3u8"
            metadata_path = f"{b2_prefix}/metadata.json"
            
            # Her iki dosya da varsa bölüm tamam demektir
            playlist_exists = self.file_exists(playlist_path)
            metadata_exists = self.file_exists(metadata_path)
            
            return playlist_exists and metadata_exists
        except:
            return False


class VideoEncoder:
    """FFmpeg ile video encoding"""
    
    @staticmethod
    def check_ffmpeg():
        """FFmpeg kurulu mu kontrol et"""
        try:
            subprocess.run(['ffmpeg', '-version'], 
                         stdout=subprocess.DEVNULL, 
                         stderr=subprocess.DEVNULL)
            return True
        except FileNotFoundError:
            return False
    
    @staticmethod
    def encode_to_hls(input_path: str, output_dir: str) -> bool:
        """Video'yu HLS formatına çevir (GPU → CPU fallback)"""
        try:
            os.makedirs(output_dir, exist_ok=True)
            
            playlist_path = os.path.join(output_dir, 'playlist.m3u8')
            segment_pattern = os.path.join(output_dir, 'segment_%03d.ts')
            
            print("  🎬 Video encoding başlıyor...")
            
            # Önce GPU encoding dene (H.264 - 2x daha hızlı!)
            print("  🎮 GPU encoding deneniyor (h264_nvenc)...")
            cmd_gpu = [
                'ffmpeg',
                '-hwaccel', 'cuda',     # CUDA hızlandırma
                '-i', input_path,
                '-c:v', 'h264_nvenc',   # H.264 (HEVC'den 2x hızlı)
                '-preset', 'p4',        # GPU preset (p4=balanced)
                '-cq', '23',            # CQ (daha iyi kalite)
                '-rc', 'vbr',           # Variable bitrate
                '-c:a', 'aac',
                '-b:a', '128k',
                '-hls_time', '4',       # 4 saniye (optimal)
                '-hls_playlist_type', 'vod',
                '-hls_segment_filename', segment_pattern,
                playlist_path
            ]
            
            result = subprocess.run(cmd_gpu, 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE,
                                  text=True)
            
            if result.returncode == 0:
                print("  ✅ GPU encoding tamamlandı!")
                return True
            else:
                print(f"  ⚠️ GPU encoding başarısız, CPU deneniyor...")
                
                # GPU başarısız, CPU encoding dene
                print("  💻 CPU encoding başlıyor (libx264)...")
                cmd_cpu = [
                    'ffmpeg',
                    '-i', input_path,
                    '-c:v', 'libx264',      # H.264 (libx265'den hızlı)
                    '-crf', '23',           # CRF (daha iyi kalite)
                    '-preset', 'fast',      # Hızlı preset
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-hls_time', '4',       # 4 saniye (optimal)
                    '-hls_playlist_type', 'vod',
                    '-hls_segment_filename', segment_pattern,
                    playlist_path
                ]
                
                result_cpu = subprocess.run(cmd_cpu, 
                                          stdout=subprocess.PIPE, 
                                          stderr=subprocess.PIPE,
                                          text=True)
                
                if result_cpu.returncode == 0:
                    print("  ✅ CPU encoding tamamlandı!")
                    return True
                else:
                    print(f"  ❌ CPU encoding hatası: {result_cpu.stderr[:200]}")
                    return False
                
        except Exception as e:
            print(f"  ❌ Encoding exception: {e}")
            return False
    
    @staticmethod
    def create_thumbnail(input_path: str, output_path: str) -> bool:
        """Thumbnail oluştur"""
        try:
            print("  📸 Thumbnail oluşturuluyor...")
            
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-ss', '00:00:01',
                '-vframes', '1',
                '-vf', 'scale=1280:720',
                '-q:v', '2',
                output_path
            ]
            
            result = subprocess.run(cmd,
                                  stdout=subprocess.DEVNULL,
                                  stderr=subprocess.DEVNULL)
            
            if result.returncode == 0:
                print("  ✅ Thumbnail oluşturuldu!")
                return True
            else:
                print("  ⚠️ Thumbnail oluşturulamadı")
                return False
                
        except Exception as e:
            print(f"  ❌ Thumbnail exception: {e}")
            return False


class TurkAnimeToB2:
    """TurkAnime'den B2'ye aktarma ana sınıfı"""
    
    def __init__(self):
        # FFmpeg kontrolü
        if not VideoEncoder.check_ffmpeg():
            print("❌ FFmpeg kurulu değil!")
            print("Kurulum:")
            print("  Windows: choco install ffmpeg")
            print("  Linux: sudo apt install ffmpeg")
            print("  macOS: brew install ffmpeg")
            sys.exit(1)
        
        self.b2 = B2Uploader(B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME)
        self.encoder = VideoEncoder()
        self.stats = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0
        }
    
    def list_all_anime(self):
        """Tüm animeleri listele"""
        print("📋 Anime listesi getiriliyor...")
        anime_list = ta.Anime.get_anime_listesi()
        
        print(f"\n✅ Toplam {len(anime_list)} anime bulundu:\n")
        for i, (slug, title) in enumerate(anime_list[:50], 1):
            print(f"{i:3d}. {title:50s} ({slug})")
        
        if len(anime_list) > 50:
            print(f"\n... ve {len(anime_list) - 50} anime daha")
        
        print(f"\nKullanım: python {sys.argv[0]} --anime SLUG --start 1 --end 10")
    
    def transfer_from_json(self, json_file: str, season: int = 1):
        """JSON dosyasından URL'leri okuyup B2'ye aktar"""
        
        print(f"\n📄 JSON dosyası okunuyor: {json_file}")
        
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        anime_slug = data['anime']
        anime_title = data['anime_title']
        episodes = data['episodes']
        
        print(f"✅ Anime: {anime_title}")
        print(f"📊 Toplam bölüm: {len(episodes)}")
        print("=" * 60)
        
        collection_name = f"{anime_title} Season {season}"
        self.stats["total"] = len(episodes)
        
        # Her bölümü işle
        for ep_data in episodes:
            ep_num = ep_data['episode']
            title = ep_data['title']
            video_url = ep_data['url']
            
            print(f"\n[{ep_num}/{len(episodes)}] {title}")
            print("-" * 60)
            
            try:
                # İki seviyeli klasör: "Anime Season X/Episode Y/"
                episode_folder = f"Episode {ep_num}"
                b2_prefix = f"{collection_name}/{episode_folder}"
                
                # B2'de zaten var mı kontrol et (playlist + metadata)
                if self.b2.check_episode_exists(b2_prefix):
                    print(f"⏭️  Bölüm {ep_num} zaten B2'de var (playlist + metadata), atlanıyor...")
                    self.stats["skipped"] += 1
                    continue
                
                # Video'yu işle ve B2'ye yükle
                result = self._process_and_upload(
                    video_url=video_url,
                    title=f"{anime_title} - {title}",
                    b2_prefix=b2_prefix
                )
                
                if result["success"]:
                    print(f"✅ Başarıyla aktarıldı! Klasör: {b2_prefix}")
                    self.stats["success"] += 1
                    self._log_success(anime_slug, ep_num, title, b2_prefix)
                else:
                    print(f"❌ Aktarım başarısız: {result['error']}")
                    self.stats["failed"] += 1
                    self._log_error(anime_slug, ep_num, title, result["error"])
                
                time.sleep(2)
                
            except Exception as e:
                print(f"❌ Hata: {e}")
                self.stats["failed"] += 1
                self._log_error(anime_slug, ep_num, title, str(e))
                continue
        
        self._print_summary()
    
    def transfer_anime(self, anime_slug: str, start_ep: int = 1, end_ep: int = None,
                      season: int = 1, fansub: str = None, quality_priority: bool = True,
                      b2_folder_override: str = None):
        """Anime bölümlerini B2'ye aktar"""
        
        print(f"\n🎬 Anime: {anime_slug}")
        print(f"📺 Sezon: {season}")
        print("=" * 60)
        
        # Anime objesini oluştur
        try:
            anime = ta.Anime(anime_slug, parse_fansubs=True)
            print(f"✅ Anime bulundu: {anime.title}")
            print(f"📊 Toplam bölüm: {len(anime.bolumler)}")
        except Exception as e:
            print(f"❌ Anime bulunamadı: {e}")
            return {"success": False, "error": str(e)}
        
        # Collection (folder) adı - override varsa onu kullan
        if b2_folder_override:
            collection_name = b2_folder_override
            print(f"\n📁 B2 Folder (override): {collection_name}")
        else:
            collection_name = f"{anime.title} Season {season}"
            print(f"\n📁 Collection: {collection_name}")
        
        # Bölüm aralığını belirle
        if end_ep is None:
            end_ep = len(anime.bolumler)
        
        bolumler = anime.bolumler[start_ep - 1:end_ep]
        self.stats["total"] = len(bolumler)
        
        print(f"\n🔄 {start_ep}-{end_ep} arası {len(bolumler)} bölüm aktarılacak...\n")
        
        # Her bölümü işle
        for i, bolum in enumerate(bolumler, start=start_ep):
            print(f"\n[{i}/{end_ep}] {bolum.title}")
            print("-" * 60)
            
            try:
                # İki seviyeli klasör: "Anime Season X/Episode Y/"
                episode_folder = f"Episode {i}"
                b2_prefix = f"{collection_name}/{episode_folder}"
                
                # B2'de zaten var mı kontrol et (playlist + metadata)
                if self.b2.check_episode_exists(b2_prefix):
                    print(f"⏭️  Bölüm {i} zaten B2'de var (playlist + metadata), atlanıyor...")
                    self.stats["skipped"] += 1
                    continue
                
                # En iyi videoyu bul
                print("🔍 En iyi video aranıyor...")
                
                def progress_callback(hook):
                    status = hook.get("status", "")
                    player = hook.get("player", "")
                    current = hook.get("current", 0)
                    total = hook.get("total", 0)
                    print(f"  [{current}/{total}] {player}: {status}")
                
                best_video = bolum.best_video(
                    by_res=quality_priority,
                    by_fansub=fansub,
                    callback=progress_callback
                )
                
                if not best_video:
                    print("⚠️ Çalışan video bulunamadı, atlanıyor...")
                    self.stats["skipped"] += 1
                    continue
                
                print(f"✅ Video bulundu: {best_video.player} ({best_video.fansub})")
                
                # Video URL'sini al
                video_url = best_video.url
                if not video_url:
                    print("⚠️ Video URL'si alınamadı, atlanıyor...")
                    self.stats["skipped"] += 1
                    continue
                
                print(f"🔗 URL: {video_url[:80]}...")
                
                # Video'yu işle ve B2'ye yükle
                result = self._process_and_upload(
                    video_url=video_url,
                    title=f"{anime.title} - {bolum.title}",
                    b2_prefix=b2_prefix
                )
                
                if result["success"]:
                    print(f"✅ Başarıyla aktarıldı! Klasör: {b2_prefix}")
                    self.stats["success"] += 1
                    self._log_success(anime_slug, i, bolum.title, b2_prefix)
                else:
                    print(f"❌ Aktarım başarısız: {result['error']}")
                    self.stats["failed"] += 1
                    self._log_error(anime_slug, i, bolum.title, result["error"])
                
                # Rate limiting
                time.sleep(2)
                
            except Exception as e:
                print(f"❌ Hata: {e}")
                self.stats["failed"] += 1
                self._log_error(anime_slug, i, bolum.title, str(e))
                continue
        
        # Özet
        self._print_summary()
        
        # Return sonuç
        return {
            "success": self.stats["success"] > 0,
            "total": self.stats["total"],
            "success_count": self.stats["success"],
            "failed_count": self.stats["failed"],
            "skipped_count": self.stats["skipped"]
        }
    
    def _download_with_aria2c(self, url: str, output_path: str) -> bool:
        """aria2c ile çok hızlı indirme (16 paralel bağlantı)"""
        try:
            print("  📥 Video indiriliyor (aria2c - 16x paralel)...")
            
            # aria2c komutu
            cmd = [
                'aria2c',
                '--max-connection-per-server=16',  # 16 paralel bağlantı!
                '--split=16',                       # 16 parçaya böl
                '--min-split-size=1M',              # Minimum parça boyutu
                '--max-concurrent-downloads=16',
                '--continue=true',                  # Resume desteği
                '--max-tries=5',
                '--retry-wait=3',
                '--timeout=60',
                '--connect-timeout=30',
                '--summary-interval=1',             # Progress her saniye
                '--console-log-level=warn',
                '--dir=' + os.path.dirname(output_path),
                '--out=' + os.path.basename(output_path),
                url
            ]
            
            result = subprocess.run(cmd, 
                                  stdout=subprocess.PIPE,
                                  stderr=subprocess.STDOUT,
                                  text=True)
            
            if result.returncode == 0 and os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                print(f"  ✅ İndirildi (aria2c): {file_size / (1024*1024):.2f} MB")
                return True
            else:
                print(f"  ⚠️ aria2c başarısız, requests deneniyor...")
                return False
                
        except FileNotFoundError:
            print(f"  ⚠️ aria2c kurulu değil, requests deneniyor...")
            return False
        except Exception as e:
            print(f"  ⚠️ aria2c hatası: {e}")
            return False
    
    def _download_with_requests(self, url: str, output_path: str) -> bool:
        """requests ile hızlı indirme (alternatif yöntem)"""
        try:
            print("  📥 Video indiriliyor (requests)...")
            
            # HEAD request ile dosya boyutunu al
            head = requests.head(url, allow_redirects=True, timeout=10)
            total_size = int(head.headers.get('content-length', 0))
            
            if total_size == 0:
                print("  ⚠️ Dosya boyutu alınamadı, yt-dlp kullanılacak...")
                return False
            
            # Stream indirme
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            downloaded = 0
            chunk_size = 1024 * 1024  # 1MB chunks
            start_time = time.time()
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=chunk_size):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Progress göster
                        percent = (downloaded / total_size) * 100
                        elapsed = time.time() - start_time
                        speed = downloaded / elapsed / 1024 / 1024  # MB/s
                        eta = (total_size - downloaded) / (downloaded / elapsed) if downloaded > 0 else 0
                        
                        print(f"\r  ⏬ {percent:.1f}% | {speed:.2f} MB/s | ETA: {eta:.0f}s", end='', flush=True)
            
            print(f"\n  ✅ İndirildi: {downloaded / (1024*1024):.2f} MB")
            return True
            
        except Exception as e:
            print(f"\n  ⚠️ requests indirme başarısız: {e}")
            return False
    
    def _process_and_upload(self, video_url: str, title: str, b2_prefix: str) -> Dict:
        """Video'yu indir, encode et ve B2'ye yükle"""
        
        # Temp dosyalar
        temp_dir = tempfile.mkdtemp(prefix='b2_upload_')
        temp_video = os.path.join(temp_dir, 'original.mp4')
        temp_hls_dir = os.path.join(temp_dir, 'hls')
        temp_thumbnail = os.path.join(temp_dir, 'thumbnail.jpg')
        
        try:
            # 1. Video'yu indir (aria2c → yt-dlp)
            print("  📥 Video indiriliyor...")
            
            # Önce aria2c dene (16x paralel - ÇOK HIZLI!)
            download_success = self._download_with_aria2c(video_url, temp_video)
            
            if not download_success:
                # aria2c başarısız, yt-dlp kullan
                print("  📥 yt-dlp ile indiriliyor...")
                
                # Progress callback
                def progress_hook(d):
                    if d['status'] == 'downloading':
                        try:
                            percent = d.get('_percent_str', 'N/A')
                            speed = d.get('_speed_str', 'N/A')
                            eta = d.get('_eta_str', 'N/A')
                            print(f"\r  ⏬ {percent} | {speed} | ETA: {eta}", end='', flush=True)
                        except:
                            pass
                    elif d['status'] == 'finished':
                        print("\n  ✅ İndirme tamamlandı!")
                
                ydl_opts = {
                    'outtmpl': temp_video,
                    'format': 'best',
                    'quiet': False,
                    'no_warnings': True,
                    'progress_hooks': [progress_hook],
                    # Hız optimizasyonları (agresif!)
                    'concurrent_fragment_downloads': 16,  # 16 paralel
                    'http_chunk_size': 52428800,  # 50MB chunk
                    'buffersize': 52428800,  # 50MB buffer
                    'retries': 10,
                    'fragment_retries': 10,
                    'socket_timeout': 60,
                    'http_headers': {
                        'Connection': 'keep-alive',
                        'Accept-Encoding': 'gzip, deflate',
                    },
                }
                
                with YoutubeDL(ydl_opts) as ydl:
                    ydl.download([video_url])
                
                file_size = os.path.getsize(temp_video)
                print(f"  ✅ İndirildi: {file_size / (1024*1024):.2f} MB")
            
            # 2. HLS encode
            if not self.encoder.encode_to_hls(temp_video, temp_hls_dir):
                return {"success": False, "error": "Encoding failed"}
            
            # 3. Thumbnail oluştur
            self.encoder.create_thumbnail(temp_video, temp_thumbnail)
            
            # 4. B2'ye yükle
            print("  📤 B2'ye yükleniyor...")
            
            # HLS dosyalarını yükle
            hls_results = self.b2.upload_directory(temp_hls_dir, b2_prefix)
            
            # Thumbnail yükle
            if os.path.exists(temp_thumbnail):
                self.b2.upload_file(temp_thumbnail, f"{b2_prefix}/thumbnail.jpg")
            
            # Metadata oluştur ve yükle
            metadata = {
                "path": b2_prefix,
                "title": title,
                "uploadDate": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "playlistUrl": f"{CDN_URL}/{b2_prefix}/playlist.m3u8",
                "thumbnailUrl": f"{CDN_URL}/{b2_prefix}/thumbnail.jpg"
            }
            
            metadata_path = os.path.join(temp_dir, 'metadata.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            self.b2.upload_file(metadata_path, f"{b2_prefix}/metadata.json")
            
            print(f"  ✅ B2'ye yüklendi: {len(hls_results)} dosya")
            
            return {
                "success": True,
                "path": b2_prefix,
                "files_uploaded": len(hls_results)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            # Temp temizle
            try:
                import shutil
                shutil.rmtree(temp_dir)
                print("  🗑️ Temp dosyalar temizlendi")
            except:
                pass
    
    def _log_success(self, anime: str, episode: int, title: str, video_id: str):
        """Başarılı transferleri logla"""
        log_file = Path("b2_transfer_success.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"{anime}|{episode}|{title}|{video_id}\n")
    
    def _log_error(self, anime: str, episode: int, title: str, error: str):
        """Hataları logla"""
        log_file = Path("b2_transfer_errors.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"{anime}|{episode}|{title}|{error}\n")
    
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
        
        if self.stats["success"] > 0:
            print(f"\n✅ Başarılı transferler: b2_transfer_success.log")
        if self.stats["failed"] > 0:
            print(f"❌ Hatalar: b2_transfer_errors.log")


def main():
    parser = argparse.ArgumentParser(
        description="TurkAnime'den Backblaze B2'ye video aktarma aracı",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnekler:
  # Tüm animeleri listele
  python turkanime_to_b2.py --list
  
  # Naruto'nun 1-10 bölümlerini aktar
  python turkanime_to_b2.py --anime naruto --start 1 --end 10
  
  # One Piece'in tüm bölümlerini aktar
  python turkanime_to_b2.py --anime one-piece --all
  
  # Belirli fansub seç
  python turkanime_to_b2.py --anime naruto --start 1 --end 10 --fansub "TurkAnime"
  
  # JSON dosyasından aktar (EN PRATİK!)
  python turkanime_to_b2.py --json video_urls.json
        """
    )
    
    parser.add_argument("--list", action="store_true", help="Tüm animeleri listele")
    parser.add_argument("--json", type=str, help="JSON dosyasından URL'leri oku (EN PRATİK!)")
    parser.add_argument("--anime", type=str, help="Anime slug (örn: naruto)")
    parser.add_argument("--episode", type=str, help="Tek bölüm slug (örn: naruto-1-bolum)")
    parser.add_argument("--start", type=int, default=1, help="Başlangıç bölümü")
    parser.add_argument("--end", type=int, help="Bitiş bölümü")
    parser.add_argument("--all", action="store_true", help="Tüm bölümleri aktar")
    parser.add_argument("--season", type=int, default=1, help="Sezon numarası")
    parser.add_argument("--b2-folder", type=str, help="B2 klasör adı (örn: naruto-season-1)")
    parser.add_argument("--fansub", type=str, help="Tercih edilen fansub")
    parser.add_argument("--no-quality", action="store_true", help="Kalite önceliğini kapat")
    
    args = parser.parse_args()
    
    transfer = TurkAnimeToB2()
    
    if args.list:
        transfer.list_all_anime()
    elif args.episode:
        # Tek bölüm import (API'den çağrılır)
        print(f"📥 Tek bölüm import: {args.episode}")
        
        # Episode slug'dan bölüm numarasını çıkar
        # Format: anime-slug-X-bolum
        parts = args.episode.rsplit('-', 2)
        if len(parts) >= 2 and parts[-1] == 'bolum':
            episode_num = int(parts[-2])
            anime_slug = '-'.join(parts[:-2])
        else:
            print(f"❌ Geçersiz episode slug formatı: {args.episode}")
            print("   Beklenen format: anime-slug-1-bolum")
            sys.exit(1)
        
        # B2 folder belirle
        b2_folder = args.b2_folder or f"{anime_slug}-season-{args.season}"
        
        print(f"  Anime: {anime_slug}")
        print(f"  Bölüm: {episode_num}")
        print(f"  B2 Folder: {b2_folder}")
        
        # Transfer et
        result = transfer.transfer_anime(
            anime_slug=anime_slug,
            start_ep=episode_num,
            end_ep=episode_num,
            season=args.season,
            fansub=args.fansub,
            quality_priority=not args.no_quality,
            b2_folder_override=b2_folder
        )
        
        # JSON output (API için)
        print(json.dumps({
            "success": result.get("success", False),
            "episode": episode_num,
            "b2_folder": b2_folder
        }))
    elif args.json:
        # JSON dosyasından aktar (EN PRATİK!)
        transfer.transfer_from_json(args.json, season=args.season)
    elif args.anime:
        transfer.transfer_anime(
            anime_slug=args.anime,
            start_ep=args.start,
            end_ep=args.end if not args.all else None,
            season=args.season,
            fansub=args.fansub,
            quality_priority=not args.no_quality
        )
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
