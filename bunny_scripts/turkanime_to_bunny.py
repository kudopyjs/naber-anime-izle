import os
import sys
import requests
import yt_dlp
from pathlib import Path
import turkanime_api as ta
import threading
import time
import subprocess
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

class BunnyNetUploader:
    def __init__(self, library_id, api_key):
        """
        Bunny.net Stream Library'ye yükleme yapan sınıf
        
        Args:
            library_id: Bunny.net Stream Library ID
            api_key: Bunny.net API Key
        """
        self.library_id = library_id
        self.api_key = api_key
        self.base_url = "https://video.bunnycdn.com"
        
    def create_video(self, title, collection_id=None):
        """
        Bunny.net'te yeni bir video oluştur
        
        Returns:
            video_id: Oluşturulan videonun ID'si
        """
        url = f"{self.base_url}/library/{self.library_id}/videos"
        headers = {
            "AccessKey": self.api_key,
            "Content-Type": "application/json"
        }
        data = {"title": title}
        
        if collection_id:
            data["collectionId"] = collection_id
            
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        return response.json()["guid"]
    
    def upload_video(self, video_id, file_path):
        """
        Video dosyasını Bunny.net'e yükle
        
        Args:
            video_id: Bunny.net video ID
            file_path: Yüklenecek dosyanın yolu
        """
        url = f"{self.base_url}/library/{self.library_id}/videos/{video_id}"
        headers = {
            "AccessKey": self.api_key
        }
        
        with open(file_path, 'rb') as f:
            response = requests.put(url, data=f, headers=headers)
            response.raise_for_status()
        
        return response.json()
    
    def list_collections(self):
        """
        Tüm collection'ları listele
        
        Returns:
            list: Collection listesi
        """
        url = f"{self.base_url}/library/{self.library_id}/collections"
        headers = {"AccessKey": self.api_key}
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get("items", [])
    
    def find_collection_by_name(self, name):
        """
        İsme göre collection bul (TAM EŞLEŞME)
        
        Returns:
            collection_id veya None
        """
        collections = self.list_collections()
        for collection in collections:
            if collection.get("name") == name:
                return collection.get("guid")
        return None
    
    def get_or_create_collection(self, name):
        """
        Collection'ı bul, yoksa oluştur
        
        Returns:
            collection_id: Collection ID'si
        """
        # Önce var mı kontrol et
        collection_id = self.find_collection_by_name(name)
        if collection_id:
            print(f"✅ Mevcut collection bulundu: '{name}'")
            return collection_id
        
        # Yoksa oluştur
        print(f"📁 Yeni collection oluşturuluyor: {name}")
        return self.create_collection(name)
    
    def create_collection(self, name):
        """
        Bunny.net'te yeni bir collection (klasör) oluştur
        
        Returns:
            collection_id: Oluşturulan collection ID'si
        """
        url = f"{self.base_url}/library/{self.library_id}/collections"
        headers = {
            "AccessKey": self.api_key,
            "Content-Type": "application/json"
        }
        data = {"name": name}
        
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        return response.json()["guid"]
    
    def list_videos(self, collection_id=None, items_per_page=1000):
        """
        Videoları listele (collection'a göre filtrelenebilir)
        
        Returns:
            list: Video listesi
        """
        url = f"{self.base_url}/library/{self.library_id}/videos"
        headers = {"AccessKey": self.api_key}
        params = {"itemsPerPage": items_per_page}
        
        if collection_id:
            params["collection"] = collection_id
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json().get("items", [])
    
    def video_exists(self, title, collection_id=None):
        """
        Videonun Bunny'de olup olmadığını kontrol et
        
        Returns:
            bool: Video varsa True
        """
        try:
            videos = self.list_videos(collection_id=collection_id)
            for video in videos:
                if video.get("title") == title:
                    return True
            return False
        except Exception as e:
            print(f"⚠️ Video kontrolü başarısız: {e}")
            return False


class TurkAnimeToBunny:
    def __init__(self, bunny_library_id, bunny_api_key, download_dir="./temp", upscale_to_1080p=False):
        """
        TürkAnime'den Bunny.net'e video aktarımı yapan ana sınıf
        
        Args:
            bunny_library_id: Bunny.net Stream Library ID
            bunny_api_key: Bunny.net API Key
            download_dir: Videoların geçici olarak indirileceği klasör (varsayılan: ./temp)
            upscale_to_1080p: Videoları 1080p'ye upscale yap (varsayılan: False)
        """
        self.bunny = BunnyNetUploader(bunny_library_id, bunny_api_key)
        self.download_dir = Path(download_dir).resolve()
        self.download_dir.mkdir(exist_ok=True, parents=True)
        self.upscale_enabled = upscale_to_1080p
        print(f"📁 Geçici klasör: {self.download_dir}")
        if self.upscale_enabled:
            print(f"🎬 1080p Upscale: Aktif")
        
    def download_video(self, video_url, output_path):
        """
        aria2c ile videoyu indir (çok daha hızlı - paralel indirme)
        
        Args:
            video_url: Video URL'si
            output_path: İndirilecek dosya yolu
        """
        # yt-dlp ile aria2c kullan (external downloader)
        ydl_opts = {
            'outtmpl': str(output_path),
            'format': 'best',
            'quiet': False,
            'no_warnings': False,
            'nocheckcertificate': True,
            # aria2c external downloader (çok daha hızlı)
            'external_downloader': 'aria2c',
            'external_downloader_args': [
                '--max-connection-per-server=16',  # Paralel bağlantı
                '--split=16',                       # 16 parçaya böl
                '--min-split-size=1M',              # Minimum parça boyutu
                '--max-concurrent-downloads=16',    # Eşzamanlı indirme
                '--continue=true',                  # Devam et
                '--max-download-limit=0',           # Hız sınırı yok
                '--file-allocation=none',           # Hızlı başlat
            ]
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])
    
    def upscale_to_1080p(self, input_path, output_path):
        """
        FFmpeg ile videoyu 1080p'ye upscale yap (GPU hızlandırmalı)
        
        Args:
            input_path: Giriş video dosyası
            output_path: Çıkış video dosyası (1080p)
        
        Returns:
            bool: Başarılı ise True
        """
        try:
            print(f"🎬 1080p'ye upscale yapılıyor (GPU hızlandırmalı)...")
            
            # GPU ile hızlı ve kaliteli upscale
            # NVIDIA NVENC encoder kullanarak 10-20x daha hızlı
            cmd = [
                'ffmpeg',
                '-hwaccel', 'cuda',                      # CUDA GPU hızlandırma
                '-hwaccel_output_format', 'cuda',        # GPU'da tut
                '-i', str(input_path),
                '-vf', 'scale_cuda=1920:1080:interp_algo=lanczos',  # GPU'da Lanczos upscale
                '-c:v', 'h264_nvenc',                    # NVIDIA NVENC encoder (GPU)
                '-preset', 'p7',                         # p7 = en yüksek kalite (p1-p7)
                '-tune', 'hq',                           # High Quality tuning
                '-rc', 'vbr',                            # Variable Bitrate
                '-cq', '19',                             # Kalite (19 = çok yüksek, 0-51)
                '-b:v', '8M',                            # Max bitrate 8 Mbps
                '-maxrate', '10M',                       # Peak bitrate
                '-bufsize', '16M',                       # Buffer size
                '-c:a', 'copy',                          # Ses kopyala (re-encode yok)
                '-y',                                    # Üzerine yaz
                str(output_path)
            ]
            
            # FFmpeg'i çalıştır;
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            if result.returncode == 0:
                print(f"✅ Upscale tamamlandı: {output_path.name}")
                # Dosya boyutlarını göster
                input_size = input_path.stat().st_size / (1024*1024)
                output_size = output_path.stat().st_size / (1024*1024)
                print(f"   Orijinal: {input_size:.1f} MB → 1080p: {output_size:.1f} MB")
                return True
            else:
                # GPU başarısız olursa CPU fallback
                print(f"⚠️ GPU upscale başarısız, CPU ile deneniyor...")
                return self._upscale_cpu_fallback(input_path, output_path)
                
        except Exception as e:
            print(f"❌ Upscale hatası: {str(e)}")
            return False
    
    def _upscale_cpu_fallback(self, input_path, output_path):
        """
        GPU başarısız olursa CPU ile upscale yap (fallback)
        
        Args:
            input_path: Giriş video dosyası
            output_path: Çıkış video dosyası (1080p)
        
        Returns:
            bool: Başarılı ise True
        """
        try:
            print(f"🖥️ CPU ile upscale yapılıyor...")
            
            # CPU ile Lanczos upscale (daha yavaş ama kaliteli)
            cmd = [
                'ffmpeg',
                '-i', str(input_path),
                '-vf', 'scale=1920:1080:flags=lanczos',  # Lanczos upscaling
                '-c:v', 'libx264',                       # H.264 codec
                '-preset', 'medium',                     # Hız/kalite dengesi
                '-crf', '18',                            # Kalite (18 = çok yüksek)
                '-c:a', 'copy',                          # Ses kopyala
                '-y',                                    # Üzerine yaz
                str(output_path)
            ]
            
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            if result.returncode == 0:
                print(f"✅ CPU upscale tamamlandı: {output_path.name}")
                input_size = input_path.stat().st_size / (1024*1024)
                output_size = output_path.stat().st_size / (1024*1024)
                print(f"   Orijinal: {input_size:.1f} MB → 1080p: {output_size:.1f} MB")
                return True
            else:
                print(f"❌ CPU upscale başarısız: {result.stderr[:200]}")
                return False
                
        except Exception as e:
            print(f"❌ CPU upscale hatası: {str(e)}")
            return False
    
    def schedule_file_deletion(self, file_path, delay=900):
        """
        Dosyayı belirli süre sonra silen zamanlayıcı
        
        Args:
            file_path: Silinecek dosya yolu
            delay: Bekleme süresi (saniye, varsayılan 900 = 15 dakika)
        """
        def delete_file():
            time.sleep(delay)
            try:
                if file_path.exists():
                    file_path.unlink()
                    print(f"🗑️  Geçici dosya silindi: {file_path.name}")
            except Exception as e:
                print(f"⚠️  Dosya silinemedi {file_path.name}: {str(e)}")
        
        thread = threading.Thread(target=delete_file, daemon=True)
        thread.start()
    
    def process_episode(self, bolum, anime_title, collection_id=None, 
                       fansub_preference=None, quality_preference=True):
        """
        Tek bir bölümü işle ve Bunny.net'e yükle
        
        Args:
            bolum: TürkAnime Bolum objesi
            anime_title: Anime başlığı
            collection_id: Bunny.net collection ID (opsiyonel)
            fansub_preference: Tercih edilen fansub
            quality_preference: Kalite önceliği (True: yüksek kalite)
        """
        try:
            # En iyi videoyu seç
            video = bolum.best_video(
                by_res=quality_preference,
                by_fansub=fansub_preference
            )
            
            if not video or not video.is_supported:
                print(f"❌ {bolum.slug} için uygun video bulunamadı")
                return False
            
            print(f"\n📥 İndiriliyor: {anime_title} - {bolum.slug}")
            print(f"   Player: {video.player}")
            print(f"   Çözünürlük: {video.resolution}p")
            print(f"   Fansub: {video.fansub or 'Belirtilmemiş'}")
            
            # Geçici dosya yolu
            temp_file = self.download_dir / f"{bolum.slug}.mp4"
            
            # Videoyu indir
            self.download_video(video.url, temp_file)
            
            if not temp_file.exists():
                print(f"❌ Video indirilemedi: {bolum.slug}")
                return False
            
            # 1080p upscale (opsiyonel)
            upload_file = temp_file
            if self.upscale_enabled:
                upscaled_file = self.download_dir / f"{bolum.slug}_1080p.mp4"
                if self.upscale_to_1080p(temp_file, upscaled_file):
                    upload_file = upscaled_file
                    # Orijinal dosyayı sil
                    temp_file.unlink()
                    print(f"🗑️  Orijinal dosya silindi: {temp_file.name}")
                else:
                    print(f"⚠️  Upscale başarısız, orijinal video yüklenecek")
            
            # Bunny.net'e yükle
            print(f"☁️  Bunny.net'e yükleniyor...")
            video_title = f"{anime_title} - {bolum.title}"
            video_id = self.bunny.create_video(video_title, collection_id)
            self.bunny.upload_video(video_id, upload_file)
            
            # 15 dakika sonra silinmek üzere zamanla
            print(f"⏰ Dosya 15 dakika sonra silinecek: {upload_file.name}")
            self.schedule_file_deletion(upload_file, delay=900)
            
            print(f"✅ Başarıyla yüklendi: {video_title}")
            return True
            
        except Exception as e:
            print(f"❌ Hata: {bolum.slug} işlenirken: {str(e)}")
            return False
    
    def process_anime(self, anime_slug, start_episode=0, end_episode=None, 
                     season=1, fansub_preference=None, create_collection_folder=True):
        """
        Bir anime serisinin bölümlerini toplu olarak işle
        
        Args:
            anime_slug: Anime slug'ı (örn: "naruto")
            start_episode: Başlangıç bölümü (0'dan başlar)
            end_episode: Bitiş bölümü (None ise tüm bölümler)
            season: Sezon numarası (varsayılan: 1)
            fansub_preference: Tercih edilen fansub
            create_collection_folder: Bunny.net'te anime için klasör oluştur
        """
        print(f"🔍 Anime yükleniyor: {anime_slug}")
        
        try:
            anime = ta.Anime(anime_slug)
        except AssertionError as e:
            print(f"\n❌ TürkAnime API hatası: Anime bulunamadı veya site erişilemiyor")
            print(f"\n💡 Olası sebepler:")
            print(f"   1. TürkAnime sitesi erişilemiyor (Cloudflare, DDoS koruması)")
            print(f"   2. Anime slug'ı yanlış: '{anime_slug}'")
            print(f"   3. API kütüphanesi güncel değil")
            print(f"\n🔧 Çözümler:")
            print(f"   1. TürkAnime sitesini kontrol edin: https://www.turkanime.co")
            print(f"   2. Doğru slug'ı bulun:")
            print(f"      python3 -c \"import turkanime_api as ta; anime_list = ta.Anime.get_anime_listesi(); bleach = [item for item in anime_list if 'bleach' in item[0].lower()]; [print(f'  {{slug}}: {{title}}') for slug, title in bleach[:5]]\"")
            print(f"   3. API kütüphanesini güncelleyin:")
            print(f"      pip install --upgrade turkanime-cli")
            print(f"\n📋 Hata detayı: {str(e)}")
            return
        except Exception as e:
            print(f"\n❌ Beklenmeyen hata: {str(e)}")
            import traceback
            traceback.print_exc()
            return
        
        print(f"📺 {anime.title}")
        print(f"📺 Sezon: {season}")
        print(f"   Toplam Bölüm: {len(anime.bolumler)}")
        
        # Collection oluştur (sezon ile birlikte)
        collection_id = None
        if create_collection_folder:
            try:
                collection_name = f"{anime.title} Season {season}"
                collection_id = self.bunny.get_or_create_collection(collection_name)
                print(f"✅ Collection ID: {collection_id}")
            except Exception as e:
                print(f"⚠️  Collection oluşturulamadı: {str(e)}")
        
        # Bölüm aralığını belirle
        end = end_episode if end_episode else len(anime.bolumler)
        bolumler = anime.bolumler[start_episode:end]
        
        # İstatistikler
        success_count = 0
        fail_count = 0
        
        # Her bölümü işle
        for i, bolum in enumerate(bolumler, start=start_episode + 1):
            print(f"\n[{i}/{end}] İşleniyor...")
            
            # Video kontrolü - zaten varsa atla
            video_title = f"{anime.title} - {bolum.title}"
            print("🔍 Bunny'de video kontrolü yapılıyor...")
            if self.bunny.video_exists(title=video_title, collection_id=collection_id):
                print(f"✅ Video zaten Bunny'de mevcut, atlanıyor...")
                success_count += 1  # Zaten var, başarılı sayılır
                continue
            
            if self.process_episode(bolum, anime.title, collection_id, fansub_preference):
                success_count += 1
            else:
                fail_count += 1
        
        # Özet
        print(f"\n{'='*50}")
        print(f"✅ Başarılı: {success_count}")
        print(f"❌ Başarısız: {fail_count}")
        print(f"{'='*50}")
    
    def export_anime_list_to_json(self, output_file="anime-list.json"):
        """
        Sadece anime listesini JSON dosyasına yaz (HIZLI - bölüm detayları yok)
        
        Args:
            output_file: Çıktı dosya adı (varsayılan: anime-list.json)
        """
        print(f"\n🔍 TürkAnime'den anime listesi alınıyor...")
        
        try:
            # Tüm anime listesini al (çok hızlı)
            anime_list = ta.Anime.get_anime_listesi()
            print(f"📺 Toplam {len(anime_list)} anime bulundu")
            
            # Basit liste formatı
            all_animes_data = [
                {
                    "slug": slug,
                    "title": title
                }
                for slug, title in anime_list
            ]
            
            # JSON dosyasına yaz
            output_path = Path(output_file)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(all_animes_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n{'='*50}")
            print(f"✅ Toplam {len(all_animes_data)} anime JSON'a yazıldı")
            print(f"📁 Dosya: {output_path.absolute()}")
            print(f"{'='*50}")
            
        except Exception as e:
            print(f"\n❌ Export hatası: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def _process_single_video(self, video, anime_title):
        """
        Tek bir videoyu işle (paralel çalışma için)
        
        Returns:
            dict: Video verisi veya None
        """
        if not video.is_supported:
            return None
        
        try:
            print(f"    [{anime_title}] {video.player} - {video.resolution}p")
            
            video_data = {
                "player": video.player,
                "resolution": video.resolution,
                "fansub": video.fansub,
                "url": video.url
            }
            return video_data
        except Exception as e:
            print(f"    ❌ [{anime_title}] Video hatası: {video.player} - {str(e)}")
            return None
    
    def _process_single_anime(self, anime_slug, anime_title, idx, total):
        """
        Tek bir animeyi işle (paralel çalışma için)
        
        Returns:
            dict: Anime verisi veya None
        """
        print(f"\n[{idx}/{total}] İşleniyor: {anime_title}")
        
        try:
            anime = ta.Anime(anime_slug)
            
            anime_data = {
                "slug": anime_slug,
                "title": anime_title,
                "episodes": []
            }
            
            # Her bölümü işle
            for bolum_idx, bolum in enumerate(anime.bolumler, 1):
                print(f"  [{anime_title}] Bölüm {bolum_idx}/{len(anime.bolumler)}: {bolum.title}")
                
                episode_data = {
                    "episode_number": bolum_idx,
                    "title": bolum.title,
                    "slug": bolum.slug,
                    "videos": []
                }
                
                # TÜM videoları PARALEL olarak işle
                with ThreadPoolExecutor(max_workers=10) as video_executor:
                    video_futures = [
                        video_executor.submit(self._process_single_video, video, anime_title)
                        for video in bolum.videos
                    ]
                    
                    # Sonuçları topla
                    for future in as_completed(video_futures):
                        video_data = future.result()
                        if video_data:
                            episode_data["videos"].append(video_data)
                
                # Eğer desteklenen video varsa bölümü ekle
                if episode_data["videos"]:
                    anime_data["episodes"].append(episode_data)
            
            # Eğer en az bir bölüm varsa anime'yi döndür
            if anime_data["episodes"]:
                print(f"  ✅ [{anime_title}] {len(anime_data['episodes'])} bölüm eklendi")
                return anime_data
            else:
                print(f"  ⚠️ [{anime_title}] Desteklenen video bulunamadı")
                return None
                
        except Exception as e:
            print(f"  ❌ [{anime_title}] Hata: {str(e)}")
            return None
    
    def export_all_animes_parallel(self, output_file="all-animes.json", max_animes=None, max_workers=5, delay_between_anime=2, resume=True):
        """
        Tüm animeleri PARALEL olarak işle ve JSON'a yaz (HİZLI)
        
        Args:
            output_file: Çıktı dosya adı (varsayılan: all-animes.json)
            max_animes: Maksimum anime sayısı (None ise hepsi)
            max_workers: Eş zamanlı işçi sayısı (varsayılan: 5, ÖNERİLEN: 3-5)
            delay_between_anime: Her anime arasında bekleme süresi (saniye, varsayılan: 2)
            resume: Kaldığı yerden devam et (varsayılan: True)
        """
        print(f"\n🔍 TürkAnime'den anime listesi alınıyor...")
        
        try:
            # Tüm anime listesini al
            anime_list = ta.Anime.get_anime_listesi()
            print(f"📺 Toplam {len(anime_list)} anime bulundu")
            
            if max_animes:
                anime_list = anime_list[:max_animes]
                print(f"📊 İlk {max_animes} anime işlenecek")
            
            # Güvenlik uyarısı
            if max_workers > 5:
                print(f"⚠️  UYARI: {max_workers} işçi çok fazla olabilir!")
                print(f"⚠️  Siteye saldırı gibi gözükebilir ve IP'niz banlanabilir.")
                print(f"⚠️  ÖNERİLEN: max_workers=3-5, delay_between_anime=2-5")
            
            # Kaldığı yerden devam et
            output_path = Path(output_file)
            all_animes_data = []
            processed_slugs = set()
            
            if resume and output_path.exists():
                print(f"📂 Mevcut dosya bulundu, kaldığı yerden devam ediliyor...")
                with open(output_path, 'r', encoding='utf-8') as f:
                    all_animes_data = json.load(f)
                    processed_slugs = {anime['slug'] for anime in all_animes_data}
                print(f"✅ {len(processed_slugs)} anime zaten işlenmiş, atlanıyor...")
            
            # İşlenmemiş animeleri filtrele
            remaining_anime = [(slug, title) for slug, title in anime_list if slug not in processed_slugs]
            
            if not remaining_anime:
                print(f"✅ Tüm animeler zaten işlenmiş!")
                return
            
            print(f"⚡ Paralel işleme başlatılıyor ({max_workers} işçi, {delay_between_anime}s gecikme)...")
            print(f"🛡️  Rate limiting aktif (siteyi korumak için)")
            print(f"📊 Kalan: {len(remaining_anime)} anime")
            
            # Paralel işleme - TÜM TASK'LARI AYNI ANDA BAŞLAT
            completed_count = len(processed_slugs)
            total_count = len(anime_list)
            
            print(f"🚀 {len(remaining_anime)} anime aynı anda işleniyor...")
            
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # TÜM animeleri AYNI ANDA başlat (submit all at once)
                futures = [
                    executor.submit(self._process_single_anime, slug, title, completed_count + idx, total_count)
                    for idx, (slug, title) in enumerate(remaining_anime, 1)
                ]
                
                # Tüm sonuçları bekle ve topla
                for idx, future in enumerate(as_completed(futures), 1):
                    anime_data = future.result()
                    if anime_data:
                        all_animes_data.append(anime_data)
                    
                    completed_count += 1
                    
                    # İlerleme göster
                    if completed_count % 10 == 0:
                        print(f"📊 İlerleme: {completed_count}/{total_count} ({completed_count*100//total_count}%)")
                        # Her 10 anime'de bir kaydet (crash durumunda veri kaybını önle)
                        with open(output_path, 'w', encoding='utf-8') as f:
                            json.dump(all_animes_data, f, ensure_ascii=False, indent=2)
                        print(f"💾 Kaydedildi!")
                    
                    # Rate limiting: Her anime arasında bekle
                    if delay_between_anime > 0:
                        time.sleep(delay_between_anime)
            
            # Final kayıt
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(all_animes_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n{'='*50}")
            print(f"✅ Toplam {len(all_animes_data)} anime JSON'a yazıldı")
            print(f"📁 Dosya: {output_path.absolute()}")
            print(f"⏱️  Tahmini süre: {len(remaining_anime) * delay_between_anime / 60 / max_workers:.1f} dakika")
            print(f"{'='*50}")
            
        except Exception as e:
            print(f"\n❌ Export hatası: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def export_all_animes_to_json(self, output_file="all-animes.json", max_animes=None):
        """
        Tüm animeleri ve bölümlerini (desteklenen tüm player linkleriyle) JSON dosyasına yaz
        
        Args:
            output_file: Çıktı dosya adı (varsayılan: all-animes.json)
            max_animes: Maksimum anime sayısı (None ise hepsi)
        """
        print(f"\n🔍 TürkAnime'den anime listesi alınıyor...")
        print(f"⚠️  DUR! Paralel versiyonu kullan: export_all_animes_parallel()")
        print(f"⚠️  Bu metod çok yavaş (seri işleme)\n")
        
        try:
            # Tüm anime listesini al
            anime_list = ta.Anime.get_anime_listesi()
            print(f"📺 Toplam {len(anime_list)} anime bulundu")
            
            if max_animes:
                anime_list = anime_list[:max_animes]
                print(f"📊 İlk {max_animes} anime işlenecek")
            
            all_animes_data = []
            
            for idx, (anime_slug, anime_title) in enumerate(anime_list, 1):
                print(f"\n[{idx}/{len(anime_list)}] İşleniyor: {anime_title}")
                
                try:
                    anime = ta.Anime(anime_slug)
                    
                    anime_data = {
                        "slug": anime_slug,
                        "title": anime_title,
                        "episodes": []
                    }
                    
                    # Her bölümü işle
                    for bolum_idx, bolum in enumerate(anime.bolumler, 1):
                        print(f"  📝 Bölüm {bolum_idx}/{len(anime.bolumler)}: {bolum.title}")
                        
                        episode_data = {
                            "episode_number": bolum_idx,
                            "title": bolum.title,
                            "slug": bolum.slug,
                            "videos": []
                        }
                        
                        # Tüm desteklenen videoları al
                        for video in bolum.videos:
                            if video.is_supported:
                                print(f"    🎬 {video.player} - {video.resolution}p")
                                
                                video_data = {
                                    "player": video.player,
                                    "resolution": video.resolution,
                                    "fansub": video.fansub,
                                    "url": video.url
                                }
                                
                                episode_data["videos"].append(video_data)
                        
                        # Eğer desteklenen video varsa bölümü ekle
                        if episode_data["videos"]:
                            anime_data["episodes"].append(episode_data)
                    
                    # Eğer en az bir bölüm varsa anime'yi ekle
                    if anime_data["episodes"]:
                        all_animes_data.append(anime_data)
                        print(f"  ✅ {len(anime_data['episodes'])} bölüm eklendi")
                    else:
                        print(f"  ⚠️ Desteklenen video bulunamadı")
                    
                except Exception as e:
                    print(f"  ❌ Hata: {str(e)}")
                    continue
            
            # JSON dosyasına yaz
            output_path = Path(output_file)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(all_animes_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n{'='*50}")
            print(f"✅ Toplam {len(all_animes_data)} anime JSON'a yazıldı")
            print(f"📁 Dosya: {output_path.absolute()}")
            print(f"{'='*50}")
            
        except Exception as e:
            print(f"\n❌ Export hatası: {str(e)}")
            import traceback
            traceback.print_exc()


def main():
    # Bunny.net bilgileriniz
    BUNNY_LIBRARY_ID = "515326"  # Buraya kendi library ID'nizi yazın
    BUNNY_API_KEY = "53c7d7fb-32c8-491e-aeffa1a04974-1412-4208"  # Buraya kendi API key'inizi yazın
    
    # Uploader'ı başlat (upscale_to_1080p=True ile 1080p upscale aktif)
    uploader = TurkAnimeToBunny(
        BUNNY_LIBRARY_ID, 
        BUNNY_API_KEY,
        upscale_to_1080p=False  # True yapın 1080p upscale için
    )
    
    # Örnek kullanım 1: Tek bir bölüm yükle
    # anime = ta.Anime("naruto")
    # uploader.process_episode(anime.bolumler[0], anime.title)
    
    # Örnek kullanım 2: Tüm anime serisini yükle
    # uploader.process_anime(
    #     anime_slug="bleach",
    #     start_episode=100,
    #     end_episode=None,  # İlk 5 bölüm (test için)
    #     season=1,  # Sezon numarası (varsayılan: 1)
    #     fansub_preference="AniSekai",  # Opsiyonel
    #     create_collection_folder=True
    # )
    
    # Örnek kullanım 3a: Sadece anime listesini export et (ÇOK HIZLI - saniyeler içinde)
    # uploader.export_anime_list_to_json(
    #     output_file="anime-list.json"
    # )
    
    # Örnek kullanım 3b: TÜM animeleri PARALEL olarak export et (GECE BOYUNCA ÇALIŞTIR)
    uploader.export_all_animes_parallel(
        output_file="all-animes.json",
        max_animes=None,         # TÜM animeler (None = hepsi)
        max_workers=3,           # 3 işçi (güvenli, ban riski düşük)
        delay_between_anime=3,   # Her anime arasında 3 saniye (güvenli)
        resume=True              # Kaldığı yerden devam et (crash olursa)
    )
    
    # Tahmini süre hesabı:
    # ~22,000 anime × 3 saniye / 3 işçi / 60 / 60 = ~6 saat
    # Gece başlatın, sabah hazır olsun! 🌙
    
    # Örnek kullanım 3c: Tüm animeleri SERİ olarak export et (ÇOK YAVAŞ - kullanma!)
    # uploader.export_all_animes_to_json(
    #     output_file="all-animes.json",
    #     max_animes=5
    # )


if __name__ == "__main__":
    main()