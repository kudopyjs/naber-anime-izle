#!/usr/bin/env python3
"""
Consumet API ile 9anime verilerini çek
"""
import sys
import io
import requests
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Windows console encoding fix
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

class ConsumetScraper:
    """Consumet API wrapper"""
    
    # Local Consumet API (public API kapatıldı)
    BASE_URL = "http://localhost:3000/anime/gogoanime"
    # Public API artık çalışmıyor: "https://api.consumet.org/anime/gogoanime"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def search_anime(self, query):
        """Anime ara"""
        try:
            # Doğru endpoint: /anime/gogoanime?query=...
            response = self.session.get(f"{self.BASE_URL}/{query}")
            response.raise_for_status()
            return response.json().get('results', [])
        except Exception as e:
            print(f"❌ Arama hatası ({query}): {str(e)}")
            return []
    
    def get_top_airing(self, page=1):
        """Top airing animeleri çek"""
        try:
            response = self.session.get(f"{self.BASE_URL}/top-airing?page={page}")
            response.raise_for_status()
            return response.json().get('results', [])
        except Exception as e:
            print(f"❌ Top airing hatası (sayfa {page}): {str(e)}")
            return []
    
    def get_recent_episodes(self, page=1):
        """Son bölümleri çek"""
        try:
            response = self.session.get(f"{self.BASE_URL}/recent-episodes?page={page}")
            response.raise_for_status()
            return response.json().get('results', [])
        except Exception as e:
            print(f"❌ Son bölüm hatası (sayfa {page}): {str(e)}")
            return []
    
    def get_all_anime_list(self, max_pages=50):
        """
        Tüm animeleri çek (popüler + recent)
        
        Args:
            max_pages: Maksimum sayfa sayısı (her sayfa ~20-30 anime)
        """
        print(f"🔍 Consumet'ten anime listesi alınıyor (max {max_pages} sayfa)...")
        
        all_anime = []
        
        # Top airing animeleri çek
        print("📺 Top airing animeler çekiliyor...")
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(self.get_top_airing, page)
                for page in range(1, max_pages + 1)
            ]
            
            for idx, future in enumerate(as_completed(futures), 1):
                results = future.result()
                if results:
                    all_anime.extend(results)
                    print(f"📊 Top airing: {idx}/{max_pages} sayfa ({len(all_anime)} anime)")
                else:
                    break  # Boş sayfa = son sayfa
        
        # Son bölümleri çek
        print("\n🆕 Son bölümler çekiliyor...")
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(self.get_recent_episodes, page)
                for page in range(1, max_pages + 1)
            ]
            
            for idx, future in enumerate(as_completed(futures), 1):
                results = future.result()
                if results:
                    all_anime.extend(results)
                    print(f"📊 Recent: {idx}/{max_pages} sayfa ({len(all_anime)} anime)")
                else:
                    break
        
        # Duplicate'leri temizle
        unique_anime = {anime['id']: anime for anime in all_anime}
        all_anime = list(unique_anime.values())
        
        print(f"\n✅ Toplam {len(all_anime)} benzersiz anime bulundu")
        return all_anime
    
    def get_anime_info(self, anime_id):
        """Anime detaylarını al"""
        try:
            response = self.session.get(f"{self.BASE_URL}/info/{anime_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"❌ Detay hatası ({anime_id}): {str(e)}")
            return None
    
    def get_episode_sources(self, episode_id, server="vidcloud"):
        """Bölüm video kaynaklarını al
        
        Args:
            episode_id: Bölüm ID'si
            server: Video sunucusu (vidcloud, streamsb, vidstreaming, streamtape)
        """
        try:
            response = self.session.get(f"{self.BASE_URL}/watch/{episode_id}", params={"server": server})
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"❌ Video hatası ({episode_id}): {str(e)}")
            return None
    
    def export_anime_list(self, output_file="consumet-anime-list.json"):
        """Anime listesini JSON'a yaz"""
        anime_list = self.get_all_anime_list()
        
        output_path = Path(output_file)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(anime_list, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Liste kaydedildi: {output_path.absolute()}")
        return anime_list
    
    def export_full_database(self, output_file="anime-database.json"):
        """Sadece Consumet verilerini export et"""
        print("📦 Consumet anime veritabanı oluşturuluyor...")
        
        # Anime listesini al
        anime_list = self.get_all_anime_list()
        
        database = []
        
        for anime in anime_list:
            database.append({
                "id": anime['id'],
                "title": anime['title'],
                "image": anime.get('image'),
                "url": anime.get('url'),
                "provider": "gogoanime",
                "language": "en",
                "type": "soft-sub"
            })
        
        # Kaydet
        output_path = Path(output_file)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(database, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Veritabanı oluşturuldu: {len(database)} anime")
        print(f"📁 Dosya: {output_path.absolute()}")
        
        return database


if __name__ == "__main__":
    scraper = ConsumetScraper()
    
    # Consumet anime veritabanını oluştur
    scraper.export_full_database()
