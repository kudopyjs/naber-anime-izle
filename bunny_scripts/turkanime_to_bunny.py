"""
TurkAnime'den Bunny.net'e Direkt Video Aktarma
Bu script turkanime-indirici API'sini kullanarak videoları
bilgisayara indirmeden direkt Bunny.net'e yükler.

Kullanım:
    python turkanime_to_bunny.py --anime "naruto" --start 1 --end 10
    python turkanime_to_bunny.py --anime "one-piece" --all
    python turkanime_to_bunny.py --list  # Tüm animeleri listele
"""

import os
import sys
import io

# Windows encoding fix
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import argparse
import requests
from pathlib import Path
import time
from typing import Optional, List, Dict
import json
import tempfile
from yt_dlp import YoutubeDL

# Try to import pycurl for faster uploads
try:
    import pycurl
    from io import BytesIO
    HAS_PYCURL = True
except ImportError:
    HAS_PYCURL = False
    print("⚠️ pycurl not installed. Install for faster uploads: pip install pycurl")

# Try to import TUS for resumable uploads
try:
    from tusclient import client as tus_client
    HAS_TUS = True
except ImportError:
    HAS_TUS = False
    print("⚠️ tuspy not installed. Install for TUS protocol: pip install tuspy")

# turkanime-indirici kütüphanesini import et
try:
    import turkanime_api as ta
except ImportError:
    print("❌ turkanime-indirici kurulu değil!")
    print("Kurulum: pip install turkanime-cli")
    sys.exit(1)

# Bunny.net API bilgileri
BUNNY_API_KEY = "53c7d7fb-32c8-491e-aeffa1a04974-1412-4208"
BUNNY_LIBRARY_ID = "515326"

if not BUNNY_API_KEY or not BUNNY_LIBRARY_ID:
    print("❌ Bunny.net API bilgileri bulunamadı!")
    print("Lütfen environment variables ayarlayın:")
    print("  export BUNNY_STREAM_API_KEY=your-api-key")
    print("  export BUNNY_LIBRARY_ID=your-library-id")
    sys.exit(1)


class BunnyUploader:
    """Bunny.net'e video yükleme sınıfı"""
    
    def __init__(self, api_key: str, library_id: str):
        self.api_key = api_key
        self.library_id = library_id
        self.base_url = f"https://video.bunnycdn.com/library/{library_id}"
        self.headers = {
            "AccessKey": api_key,
            "Content-Type": "application/json"
        }
    
    def list_collections(self) -> List[Dict]:
        """Tüm collection'ları listele"""
        try:
            response = requests.get(
                f"{self.base_url}/collections",
                headers={"AccessKey": self.api_key}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            return []
        except Exception as e:
            print(f"⚠️ Collection listesi alınamadı: {e}")
            return []
    
    def find_collection_by_name(self, name: str) -> Optional[str]:
        """İsme göre collection bul (TAM EŞLEŞME - exact match)"""
        collections = self.list_collections()
        
        # Debug: Mevcut collection'ları göster
        if collections:
            print(f"  🔍 Mevcut collection'lar kontrol ediliyor...")
            for collection in collections:
                coll_name = collection.get("name", "")
                print(f"     - {coll_name}")
        
        # TAM EŞLEŞME kontrolü (case-sensitive)
        for collection in collections:
            coll_name = collection.get("name", "")
            if coll_name == name:  # Tam eşleşme
                collection_id = collection.get("guid")
                print(f"✅ Mevcut collection bulundu (tam eşleşme): '{name}' (ID: {collection_id})")
                return collection_id
        
        print(f"  ℹ️ '{name}' isimli collection bulunamadı")
        return None
    
    def get_or_create_collection(self, name: str, parent_id: Optional[str] = None) -> Optional[str]:
        """Collection'ı bul, yoksa oluştur (parent collection içinde)"""
        # Önce var mı kontrol et
        collection_id = self.find_collection_by_name(name)
        if collection_id:
            return collection_id
        
        # Yoksa oluştur
        print(f"📁 Yeni collection oluşturuluyor: {name}")
        return self.create_collection(name, parent_id)
    
    def create_collection(self, name: str, parent_id: Optional[str] = None) -> Optional[str]:
        """Bunny'de koleksiyon (klasör) oluştur"""
        try:
            payload = {"name": name}
            if parent_id:
                payload["parentId"] = parent_id
                print(f"  📂 Parent Collection ID: {parent_id}")
            
            response = requests.post(
                f"{self.base_url}/collections",
                headers=self.headers,
                json=payload
            )
            if response.status_code == 200:
                collection_id = response.json().get("guid")
                print(f"✅ Koleksiyon oluşturuldu: {name} (ID: {collection_id})")
                return collection_id
            else:
                print(f"⚠️ Koleksiyon oluşturulamadı: HTTP {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return None
        except Exception as e:
            print(f"❌ Koleksiyon oluşturma hatası: {e}")
            return None
    
    def upload_from_url(self, video_url: str, title: str, collection_id: str = None) -> Dict:
        """URL'den Bunny.net'e video aktar (yt-dlp ile gerçek URL çözümleme)"""
        try:
            # yt-dlp ile gerçek video URL'sini al
            print("  🔍 Gerçek video URL'si çözümleniyor...")
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
                'format': 'best',
            }
            
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)
                
                # Direkt indirilebilir URL'yi al
                direct_url = info.get('url')
                if not direct_url:
                    return {
                        "success": False,
                        "error": "Direkt video URL'si bulunamadı"
                    }
                
                print(f"  ✅ Gerçek URL bulundu: {direct_url[:60]}...")
            
            # Bunny.net'e fetch ile aktar
            payload = {
                "url": direct_url,
                "title": title
            }
            if collection_id:
                payload["collectionId"] = collection_id
                print(f"  📁 Collection ID ekleniyor: {collection_id}")
            
            print(f"  🔧 API Request: POST {self.base_url}/videos/fetch")
            
            response = requests.post(
                f"{self.base_url}/videos/fetch",
                headers=self.headers,
                json=payload
            )
            
            print(f"  📡 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Debug: Tüm response'u göster
                print(f"  🔍 Full Response: {data}")
                
                # Fetch başarısız oldu mu kontrol et
                if data.get("success") == False and ("403" in str(data.get("statusCode")) or "400" in str(data.get("statusCode"))):
                    print(f"  ⚠️ Fetch başarısız (403/400), download & upload deneniyor...")
                    return self._download_and_upload(direct_url, title, collection_id)
                
                # Bunny.net fetch API'si farklı field'lar kullanıyor olabilir
                video_id = data.get("guid") or data.get("videoLibraryId") or data.get("id")
                
                if not video_id:
                    # Response'da hangi field'lar var?
                    print(f"  ⚠️ guid bulunamadı! Mevcut field'lar: {list(data.keys())}")
                    # success field'ı varsa, işlem başlatılmış demektir
                    if data.get("success") == True:
                        print(f"  ℹ️ Fetch işlemi başlatıldı (asenkron)")
                        # Video oluşana kadar bekle
                        video_id = self.wait_for_video(title=title, collection_id=collection_id, timeout=60)
                        if not video_id:
                            return {
                                "success": False,
                                "error": "Video ID alınamadı (timeout)"
                            }
                    else:
                        # Fetch başarısız, download & upload dene
                        print(f"  ⚠️ Video ID bulunamadı, download & upload deneniyor...")
                        return self._download_and_upload(direct_url, title, collection_id)
                else:
                    print(f"  ✅ Video ID: {video_id}")
                
                # Collection'a eklendiğini doğrula veya taşı
                if collection_id and video_id and video_id != "pending":
                    video_collection = data.get("collectionId")
                    if video_collection == collection_id:
                        print(f"  ✅ Video collection'a eklendi: {collection_id}")
                    else:
                        # Collection'a manuel olarak taşı
                        print(f"  📦 Video collection'a taşınıyor...")
                        if self.update_video(video_id=video_id, collection_id=collection_id):
                            print(f"  ✅ Video başarıyla collection'a taşındı!")
                        else:
                            print(f"  ⚠️ Video collection'a taşınamadı")
                
                return {
                    "success": True,
                    "video_id": video_id,
                    "title": title
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _download_and_upload(self, video_url: str, title: str, collection_id: str = None) -> Dict:
        """Fetch başarısız olursa: İndir ve yükle"""
        try:
            print(f"  📥 Video indiriliyor (yt-dlp)...")
            
            # Temp dosya
            temp_dir = tempfile.mkdtemp(prefix='bunny_upload_')
            temp_file = os.path.join(temp_dir, 'video.mp4')
            
            # yt-dlp ile indir (1080p tercih, yoksa en iyi kalite)
            ydl_opts = {
                'outtmpl': temp_file,
                'format': 'bestvideo[height=1080]+bestaudio/bestvideo+bestaudio/best',
                'quiet': False,
                'concurrent_fragment_downloads': 4,  # 4 parça paralel indir
            }
            
            with YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
            
            file_size = os.path.getsize(temp_file)
            print(f"  ✅ İndirildi: {file_size / (1024*1024):.2f} MB")
            
            # Bunny'e yükle
            print(f"  📤 Bunny.net'e yükleniyor...")
            result = self.upload_file_direct(
                file_path=temp_file,
                title=title,
                collection_id=collection_id
            )
            
            # Cleanup
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except:
                pass
            
            return result
            
        except Exception as e:
            print(f"  ❌ Download & upload hatası: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _upload_with_tus(self, file_path: str, video_id: str) -> bool:
        """TUS protocol ile resumable upload (en hızlı ve güvenilir)"""
        if not HAS_TUS:
            return False
        
        try:
            file_size = os.path.getsize(file_path)
            
            print(f"  🚀 TUS protocol ile yükleniyor (resumable upload)...", flush=True)
            print(f"  📦 Dosya boyutu: {file_size / (1024*1024):.2f} MB", flush=True)
            
            # Bunny TUS endpoint
            tus_url = f"https://video.bunnycdn.com/tusupload"
            
            # Headers for TUS client
            tus_headers = {
                'AuthorizationSignature': self.api_key,
                'AuthorizationExpire': str(int(time.time()) + 3600),
                'VideoId': video_id,
                'LibraryId': self.library_id
            }
            
            # TUS client setup with headers
            my_client = tus_client.TusClient(tus_url, headers=tus_headers)
            
            # Metadata
            metadata = {
                'videoLibraryId': self.library_id,
                'guid': video_id,
                'filename': os.path.basename(file_path)
            }
            
            # Uploader
            uploader = my_client.uploader(
                file_path,
                chunk_size=10 * 1024 * 1024,  # 10MB chunks
                metadata=metadata
            )
            
            # Progress tracking
            start_time = time.time()
            last_progress = [0]
            
            # Set progress callback on uploader object
            def progress_callback(offset, total):
                progress = (offset / total) * 100
                if progress - last_progress[0] >= 1 or offset == total:
                    elapsed = time.time() - start_time
                    speed = (offset / (1024*1024)) / elapsed if elapsed > 0 else 0
                    print(f"    [{progress:.1f}%] {offset / (1024*1024):.1f}/{total / (1024*1024):.1f} MB ({speed:.2f} MB/s)", flush=True)
                    last_progress[0] = progress
            
            # Attach callback to uploader
            uploader.set_progress_callback(progress_callback)
            
            # Upload
            uploader.upload()
            
            elapsed = time.time() - start_time
            speed = (file_size / (1024*1024)) / elapsed if elapsed > 0 else 0
            print(f"  ✅ TUS upload tamamlandı! ({elapsed:.1f}s, {speed:.2f} MB/s)", flush=True)
            
            return True
            
        except Exception as e:
            print(f"  ⚠️ TUS upload failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _upload_with_pycurl(self, file_path: str, video_id: str) -> bool:
        """pycurl ile hızlı upload (C library, çok daha hızlı)"""
        if not HAS_PYCURL:
            return False
        
        try:
            file_size = os.path.getsize(file_path)
            url = f"{self.base_url}/videos/{video_id}"
            
            print(f"  🚀 pycurl ile yükleniyor...", flush=True)
            print(f"  ⚠️  NOT: Bunny API upload hızı ~0.3-0.5 MB/s ile sınırlı", flush=True)
            print(f"  ⏱️  Tahmini süre: {(file_size / (1024*1024)) / 0.4 / 60:.1f} dakika", flush=True)
            
            start_time = time.time()
            last_progress = [0, 0, 0]  # [progress%, uploaded_bytes, elapsed_time]
            
            def progress_callback(download_total, downloaded, upload_total, uploaded):
                if upload_total > 0:
                    progress = (uploaded / upload_total) * 100
                    # Her %1'de bir göster (daha sık)
                    if progress - last_progress[0] >= 1 or uploaded == upload_total:
                        elapsed = time.time() - start_time
                        speed = (uploaded / (1024*1024)) / elapsed if elapsed > 0 else 0
                        # Anlık hız da göster
                        instant_speed = (uploaded - last_progress[1]) / (elapsed - last_progress[2]) / (1024*1024) if elapsed > last_progress[2] else 0
                        print(f"    [{progress:.1f}%] {uploaded / (1024*1024):.1f}/{upload_total / (1024*1024):.1f} MB | Avg: {speed:.2f} MB/s | Now: {instant_speed:.2f} MB/s", flush=True)
                        last_progress[0] = progress
                        last_progress[1] = uploaded
                        last_progress[2] = elapsed
            
            c = pycurl.Curl()
            c.setopt(pycurl.URL, url)
            c.setopt(pycurl.UPLOAD, 1)
            c.setopt(pycurl.READDATA, open(file_path, 'rb'))
            c.setopt(pycurl.INFILESIZE, file_size)
            c.setopt(pycurl.HTTPHEADER, [
                f"AccessKey: {self.api_key}",
                "Content-Type: application/octet-stream"
            ])
            c.setopt(pycurl.NOPROGRESS, 0)
            c.setopt(pycurl.XFERINFOFUNCTION, progress_callback)
            c.setopt(pycurl.WRITEDATA, BytesIO())
            c.setopt(pycurl.TCP_NODELAY, 1)
            c.setopt(pycurl.BUFFERSIZE, 16 * 1024 * 1024)
            
            c.perform()
            status_code = c.getinfo(pycurl.RESPONSE_CODE)
            
            # Debug info
            upload_speed = c.getinfo(pycurl.SPEED_UPLOAD)
            total_time = c.getinfo(pycurl.TOTAL_TIME)
            namelookup_time = c.getinfo(pycurl.NAMELOOKUP_TIME)
            connect_time = c.getinfo(pycurl.CONNECT_TIME)
            pretransfer_time = c.getinfo(pycurl.PRETRANSFER_TIME)
            starttransfer_time = c.getinfo(pycurl.STARTTRANSFER_TIME)
            
            c.close()
            
            elapsed = time.time() - start_time
            speed = (file_size / (1024*1024)) / elapsed if elapsed > 0 else 0
            print(f"  ✅ Yükleme tamamlandı! ({elapsed:.1f}s, {speed:.2f} MB/s)", flush=True)
            print(f"  📊 Debug Info:")
            print(f"     DNS Lookup: {namelookup_time*1000:.0f}ms")
            print(f"     Connect: {connect_time*1000:.0f}ms")
            print(f"     Pre-transfer: {pretransfer_time*1000:.0f}ms")
            print(f"     Start transfer: {starttransfer_time*1000:.0f}ms")
            print(f"     Total time: {total_time:.1f}s")
            print(f"     Upload speed (curl): {upload_speed / (1024*1024):.2f} MB/s")
            
            return status_code == 200
            
        except Exception as e:
            print(f"  ⚠️ pycurl upload failed: {e}")
            return False
    
    def upload_file_direct(self, file_path: str, title: str, collection_id: str = None) -> Dict:
        """Dosyayı direkt Bunny.net'e yükle"""
        try:
            # 1. Video oluştur
            payload = {"title": title}
            if collection_id:
                payload["collectionId"] = collection_id
                print(f"  📁 Collection ID ekleniyor: {collection_id}")
            
            print(f"  🔧 API Request: POST {self.base_url}/videos")
            print(f"  📦 Payload: {payload}")
            
            response = requests.post(
                f"{self.base_url}/videos",
                headers=self.headers,
                json=payload
            )
            
            print(f"  📡 Response Status: {response.status_code}")
            
            if response.status_code != 200:
                return {
                    "success": False,
                    "error": f"Video oluşturulamadı: {response.status_code} - {response.text}"
                }
            
            response_data = response.json()
            video_id = response_data.get("guid")
            print(f"  ✅ Video oluşturuldu: {video_id}")
            print(f"  ℹ️ Collection taşıma işlemi tüm videolar yüklendikten sonra yapılacak")
            
            # 2. Dosyayı yükle
            file_size = os.path.getsize(file_path)
            print(f"  📦 Dosya boyutu: {file_size / (1024*1024):.2f} MB")
            
            # Önce TUS dene (en hızlı ve güvenilir)
            if HAS_TUS:
                if self._upload_with_tus(file_path, video_id):
                    return {
                        "success": True,
                        "video_id": video_id,
                        "title": title
                    }
                else:
                    print(f"  ⚠️ TUS başarısız, pycurl ile deneniyor...")
            
            # Fallback: pycurl dene
            if HAS_PYCURL:
                if self._upload_with_pycurl(file_path, video_id):
                    return {
                        "success": True,
                        "video_id": video_id,
                        "title": title
                    }
                else:
                    print(f"  ⚠️ pycurl başarısız, requests ile deneniyor...")
            
            # Fallback: requests ile yükle
            print(f"  ⬆️ Yükleme başlıyor (requests - chunk-based)...", flush=True)
            
            start_time = time.time()
            chunk_size = 16 * 1024 * 1024  # 16MB chunks (optimize for high-speed connections)
            
            # Generator ile chunk-based upload
            def file_chunks_with_progress():
                uploaded = 0
                last_print = 0
                
                with open(file_path, 'rb') as f:
                    while True:
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        
                        uploaded += len(chunk)
                        progress = (uploaded / file_size) * 100
                        
                        # Her %5'te bir progress göster
                        if progress - last_print >= 5 or uploaded == file_size:
                            elapsed = time.time() - start_time
                            speed = (uploaded / (1024*1024)) / elapsed if elapsed > 0 else 0
                            print(f"    [{progress:.0f}%] {uploaded / (1024*1024):.1f}/{file_size / (1024*1024):.1f} MB ({speed:.2f} MB/s)", flush=True)
                            last_print = progress
                        
                        yield chunk
            
            # Session ile connection pooling ve keep-alive
            session = requests.Session()
            session.headers.update({
                "AccessKey": self.api_key,
                "Content-Type": "application/octet-stream"
            })
            
            # HTTP adapter ile connection settings
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry
            
            adapter = HTTPAdapter(
                pool_connections=1,
                pool_maxsize=1,
                max_retries=Retry(total=3, backoff_factor=1)
            )
            session.mount('https://', adapter)
            
            upload_response = session.put(
                f"{self.base_url}/videos/{video_id}",
                data=file_chunks_with_progress(),
                timeout=600  # 10 dakika timeout
            )
            
            session.close()
            
            elapsed_time = time.time() - start_time
            speed_mbps = (file_size / (1024*1024)) / elapsed_time if elapsed_time > 0 else 0
            print(f"  ✅ Yükleme tamamlandı! ({elapsed_time:.1f}s, {speed_mbps:.2f} MB/s)", flush=True)
            
            if upload_response.status_code == 200:
                return {
                    "success": True,
                    "video_id": video_id,
                    "title": title
                }
            else:
                return {
                    "success": False,
                    "error": f"Upload başarısız: {upload_response.text}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def list_videos(self, collection_id: str = None, page: int = 1, items_per_page: int = 100) -> List[Dict]:
        """Videoları listele (collection'a göre filtrelenebilir)"""
        try:
            params = {
                "page": page,
                "itemsPerPage": items_per_page
            }
            if collection_id:
                params["collection"] = collection_id
            
            response = requests.get(
                f"{self.base_url}/videos",
                headers={"AccessKey": self.api_key},
                params=params
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            return []
        except Exception as e:
            print(f"⚠️ Video listesi alınamadı: {e}")
            return []
    
    def video_exists(self, title: str, collection_id: str = None) -> bool:
        """Videonun Bunny'de olup olmadığını kontrol et"""
        try:
            videos = self.list_videos(collection_id=collection_id, items_per_page=1000)
            for video in videos:
                if video.get("title") == title:
                    return True
            return False
        except Exception as e:
            print(f"⚠️ Video kontrolü başarısız: {e}")
            return False
    
    def update_video(self, video_id: str, collection_id: str = None, title: str = None) -> bool:
        """Video bilgilerini güncelle (collection'a taşı)"""
        try:
            payload = {}
            if collection_id:
                payload["collectionId"] = collection_id
            if title:
                payload["title"] = title
            
            response = requests.post(
                f"{self.base_url}/videos/{video_id}",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                print(f"  ✅ Video güncellendi: {video_id}")
                if collection_id:
                    print(f"  ✅ Collection'a taşındı: {collection_id}")
                return True
            else:
                print(f"  ⚠️ Video güncellenemedi: {response.status_code}")
                return False
        except Exception as e:
            print(f"  ❌ Video güncelleme hatası: {e}")
            return False
    
    def get_video_status(self, video_id: str) -> Dict:
        """Video durumunu kontrol et"""
        try:
            response = requests.get(
                f"{self.base_url}/videos/{video_id}",
                headers={"AccessKey": self.api_key}
            )
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"⚠️ Video durumu alınamadı: {e}")
            return None
    
    def wait_for_video(self, title: str, collection_id: str = None, timeout: int = 60) -> Optional[str]:
        """Video oluşana kadar bekle (fetch işlemi için)"""
        print(f"  ⏳ Video oluşması bekleniyor (max {timeout} saniye)...")
        import time
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            videos = self.list_videos(collection_id=collection_id)
            
            # Title'a göre video ara
            for video in videos:
                if video.get("title") == title:
                    video_id = video.get("guid")
                    print(f"  ✅ Video bulundu: {video_id}")
                    return video_id
            
            # 5 saniye bekle
            time.sleep(5)
            print(f"  ⏳ Bekleniyor... ({int(time.time() - start_time)}s)")
        
        print(f"  ⚠️ Timeout: Video {timeout} saniye içinde bulunamadı")
        return None


class TurkAnimeToBunny:
    """TurkAnime'den Bunny.net'e aktarma ana sınıfı"""
    
    def __init__(self):
        self.bunny = BunnyUploader(BUNNY_API_KEY, BUNNY_LIBRARY_ID)
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
        for i, (slug, title) in enumerate(anime_list[:50], 1):  # İlk 50'yi göster
            print(f"{i:3d}. {title:50s} ({slug})")
        
        if len(anime_list) > 50:
            print(f"\n... ve {len(anime_list) - 50} anime daha")
        
        print(f"\nKullanım: python {sys.argv[0]} --anime SLUG --start 1 --end 10")
    
    def transfer_anime(self, anime_slug: str, start_ep: int = 1, end_ep: int = None, 
                      season: int = 1, fansub: str = None, quality_priority: bool = True):
        """Anime bölümlerini Bunny.net'e aktar (sezonlu sistem)"""
        
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
            return
        
        # Collection adını sezon ile birlikte oluştur
        collection_name = f"{anime.title} Season {season}"
        print(f"\n📁 Collection kontrol ediliyor: {collection_name}")
        collection_id = self.bunny.get_or_create_collection(collection_name)
        if not collection_id:
            print("❌ Koleksiyon oluşturulamadı!")
            return
        print(f"✅ Koleksiyon ID: {collection_id}")
        
        # Bölüm aralığını belirle
        if end_ep is None:
            end_ep = len(anime.bolumler)
        
        # Python slice: [start:end] - end dahil değil!
        # start=1, end=1 için: [0:1] = 1 bölüm
        # start=1, end=5 için: [0:5] = 5 bölüm
        bolumler = anime.bolumler[start_ep - 1:end_ep]
        self.stats["total"] = len(bolumler)
        
        print(f"\n🔄 {start_ep}-{end_ep} arası {len(bolumler)} bölüm aktarılacak...")
        print(f"📋 Bölümler: {[b.title for b in bolumler[:3]]}{'...' if len(bolumler) > 3 else ''}\n")
        
        # Başarılı video ID'lerini topla (collection'a taşımak için)
        uploaded_video_ids = []
        
        # Her bölümü işle
        for i, bolum in enumerate(bolumler, start=start_ep):
            print(f"\n[{i}/{end_ep}] {bolum.title}")
            print("-" * 60)
            
            try:
                # Bunny'de zaten var mı kontrol et
                video_title = f"{anime.title} - {bolum.title}"
                print("🔍 Bunny'de video kontrolü yapılıyor...")
                if self.bunny.video_exists(title=video_title, collection_id=collection_id):
                    print(f"✅ Video zaten Bunny'de mevcut, atlanıyor...")
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
                
                # Bunny.net'e aktar
                print(f"📤 Bunny.net'e aktarılıyor (Sezon {season})...")
                result = self.bunny.upload_from_url(
                    video_url=video_url,
                    title=f"{anime.title} - {bolum.title}",
                    collection_id=collection_id
                )
                
                # Eğer URL fetch başarısız olursa, indir ve yükle
                if not result["success"] and "Invalid file" in result.get("error", ""):
                    print("  ⚠️ Direkt URL aktarımı başarısız, dosya indiriliyor...")
                    result = self._download_and_upload(
                        video_url=video_url,
                        title=f"{anime.title} - {bolum.title}",
                        collection_id=collection_id
                    )
                
                if result["success"]:
                    video_id = result.get("video_id")
                    print(f"✅ Başarıyla aktarıldı! Video ID: {video_id}")
                    self.stats["success"] += 1
                    
                    # Video ID'yi topla (collection'a taşımak için)
                    if video_id:
                        uploaded_video_ids.append(video_id)
                        self._log_success(anime_slug, i, bolum.title, video_id)
                        print(f"📝 Log kaydedildi: {anime_slug}|{i}|{video_id}")
                    else:
                        print("⚠️ Video ID bulunamadı, log kaydedilemedi")
                else:
                    print(f"❌ Aktarım başarısız: {result['error']}")
                    self.stats["failed"] += 1
                    self._log_error(anime_slug, i, bolum.title, result["error"])
                
                # Rate limiting için bekle
                time.sleep(2)
                
            except KeyboardInterrupt:
                print("\n\n⚠️ Kullanıcı tarafından iptal edildi!")
                break
            except Exception as e:
                import traceback
                print(f"❌ Hata: {e}")
                print(f"📋 Detaylı hata:")
                traceback.print_exc()
                self.stats["failed"] += 1
                self._log_error(anime_slug, i, bolum.title, str(e))
                print(f"\n⏭️ Sonraki bölüme geçiliyor...\n")
                continue
        
        # Tüm videolar yüklendi, şimdi collection'a toplu taşıma
        if uploaded_video_ids and collection_id:
            print(f"\n{'='*60}")
            print(f"📦 COLLECTION'A TOPLU TAŞIMA")
            print(f"{'='*60}")
            print(f"  Toplam {len(uploaded_video_ids)} video collection'a taşınacak...")
            print(f"  Collection ID: {collection_id}\n")
            
            moved_count = 0
            for idx, video_id in enumerate(uploaded_video_ids, 1):
                print(f"  [{idx}/{len(uploaded_video_ids)}] Video taşınıyor: {video_id}")
                if self.bunny.update_video(video_id=video_id, collection_id=collection_id):
                    moved_count += 1
                    print(f"    ✅ Başarılı")
                else:
                    print(f"    ❌ Başarısız")
                time.sleep(0.5)  # API rate limit
            
            print(f"\n  ✅ {moved_count}/{len(uploaded_video_ids)} video başarıyla collection'a taşındı!")
            print(f"{'='*60}\n")
        
        # Özet
        self._print_summary()
    
    def _download_and_upload(self, video_url: str, title: str, collection_id: str = None) -> Dict:
        """Videoyu indir ve Bunny.net'e yükle (fallback method)"""
        temp_file = None
        try:
            # Geçici dosya oluştur
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
            temp_path = temp_file.name
            temp_file.close()
            
            print(f"  📥 Video indiriliyor: {temp_path}")
            
            # yt-dlp ile indir
            ydl_opts = {
                'outtmpl': temp_path,
                'format': 'best',
                'quiet': False,
                'no_warnings': False,
            }
            
            with YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
            
            # Dosya boyutunu kontrol
            file_size = os.path.getsize(temp_path)
            print(f"  ✅ İndirildi: {file_size / (1024*1024):.2f} MB")
            
            # Bunny.net'e yükle
            print("  📤 Bunny.net'e yükleniyor...")
            if collection_id:
                print(f"  📁 Koleksiyon: {collection_id}")
            result = self.bunny.upload_file_direct(
                file_path=temp_path,
                title=title,
                collection_id=collection_id
            )
            
            if result.get("success"):
                print(f"  ✅ Upload başarılı! Video ID: {result.get('video_id')}")
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": f"İndirme/yükleme hatası: {str(e)}"
            }
        finally:
            # Geçici dosyayı sil
            if temp_file and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                    print("  🗑️ Geçici dosya silindi")
                except:
                    pass
    
    def _log_success(self, anime: str, episode: int, title: str, video_id: str):
        """Başarılı transferleri logla"""
        log_file = Path("bunny_transfer_success.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"{anime}|{episode}|{title}|{video_id}\n")
    
    def _log_error(self, anime: str, episode: int, title: str, error: str):
        """Hataları logla"""
        log_file = Path("bunny_transfer_errors.log")
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
            print(f"\n✅ Başarılı transferler: bunny_transfer_success.log")
        if self.stats["failed"] > 0:
            print(f"❌ Hatalar: bunny_transfer_errors.log")
    
    def transfer_single_episode(self, anime_slug: str, episode_num: int, 
                               collection_id: str = None, fansub: str = None, 
                               quality_priority: bool = True) -> Dict:
        """Tek bir bölümü Bunny.net'e aktar (API için)"""
        try:
            # Anime objesini oluştur
            anime = ta.Anime(anime_slug, parse_fansubs=True)
            
            if episode_num < 1 or episode_num > len(anime.bolumler):
                return {
                    "success": False,
                    "error": f"Geçersiz bölüm numarası: {episode_num}"
                }
            
            bolum = anime.bolumler[episode_num - 1]
            
            # En iyi videoyu bul
            best_video = bolum.best_video(
                by_res=quality_priority,
                by_fansub=fansub
            )
            
            if not best_video:
                return {
                    "success": False,
                    "error": "Çalışan video bulunamadı"
                }
            
            video_url = best_video.url
            if not video_url:
                return {
                    "success": False,
                    "error": "Video URL'si alınamadı"
                }
            
            # Bunny.net'e aktar
            title = f"{anime.title} - {bolum.title}"
            result = self.bunny.upload_from_url(
                video_url=video_url,
                title=title,
                collection_id=collection_id
            )
            
            # Fallback: URL fetch başarısız olursa indir ve yükle
            if not result["success"] and "Invalid file" in result.get("error", ""):
                result = self._download_and_upload(
                    video_url=video_url,
                    title=title,
                    collection_id=collection_id
                )
            
            if result["success"]:
                video_id = result.get("video_id")
                self._log_success(anime_slug, episode_num, bolum.title, video_id)
                return {
                    "success": True,
                    "video_id": video_id,
                    "title": title,
                    "episode": episode_num
                }
            else:
                self._log_error(anime_slug, episode_num, bolum.title, result["error"])
                return {
                    "success": False,
                    "error": result["error"]
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


def main():
    parser = argparse.ArgumentParser(
        description="TurkAnime'den Bunny.net'e video aktarma aracı",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnekler:
  # Tüm animeleri listele
  python turkanime_to_bunny.py --list
  
  # Naruto'nun 1-10 bölümlerini aktar
  python turkanime_to_bunny.py --anime naruto --start 1 --end 10
  
  # One Piece'in tüm bölümlerini aktar
  python turkanime_to_bunny.py --anime one-piece --all
  
  # Belirli fansub seç
  python turkanime_to_bunny.py --anime naruto --start 1 --end 10 --fansub "TurkAnime"
        """
    )
    
    parser.add_argument("--list", action="store_true", help="Tüm animeleri listele")
    parser.add_argument("--anime", type=str, help="Anime slug (örn: naruto)")
    parser.add_argument("--episode", type=str, help="Tek bölüm slug (örn: naruto-1-bolum)")
    parser.add_argument("--start", type=int, default=1, help="Başlangıç bölümü (varsayılan: 1)")
    parser.add_argument("--end", type=int, help="Bitiş bölümü (varsayılan: son bölüm)")
    parser.add_argument("--all", action="store_true", help="Tüm bölümleri aktar")
    parser.add_argument("--season", type=int, default=1, help="Sezon numarası (varsayılan: 1)")
    parser.add_argument("--collection", type=str, help="Bunny collection ID")
    parser.add_argument("--fansub", type=str, help="Tercih edilen fansub")
    parser.add_argument("--no-quality", action="store_true", help="Kalite önceliğini kapat")
    
    args = parser.parse_args()
    
    transfer = TurkAnimeToBunny()
    
    if args.list:
        transfer.list_all_anime()
    elif args.episode:
        # Tek bölüm yükleme (API'den çağrılır)
        # Episode slug'dan bölüm numarasını çıkar: naruto-1-bolum -> 1
        parts = args.episode.rsplit('-', 2)
        if len(parts) >= 2 and parts[-1] == 'bolum':
            episode_num = int(parts[-2])
            anime_slug = '-'.join(parts[:-2])
            
            result = transfer.transfer_single_episode(
                anime_slug=anime_slug,
                episode_num=episode_num,
                collection_id=args.collection,
                fansub=args.fansub,
                quality_priority=not args.no_quality
            )
            
            # JSON output (API için)
            print(json.dumps(result, ensure_ascii=False))
        else:
            print(json.dumps({"success": False, "error": "Geçersiz episode slug"}))
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
