#!/usr/bin/env python3
"""
TürkAnime AJAX endpoint'lerini test et
"""
import requests
import re
import json

# TürkAnime AJAX endpoint'leri
BASE_URL = "https://www.turkanime.co"

def get_all_anime_list():
    """Tüm anime listesini al"""
    url = f"{BASE_URL}/ajax/tamliste"
    response = requests.get(url)
    
    # HTML'den anime listesini parse et
    anime_list = re.findall(r'/anime/(.*?)".*?animeAdi">(.*?)<', response.text)
    return anime_list

def get_anime_episodes(anime_id):
    """Bir animenin bölümlerini al"""
    url = f"{BASE_URL}/ajax/bolumler&animeId={anime_id}"
    response = requests.get(url)
    
    # HTML'den bölüm listesini parse et
    episodes = re.findall(r'/video/(.*?)\\?".*?title=.*?"(.*?)\\?"', response.text)
    return episodes

def get_episode_videos(episode_slug):
    """Bir bölümün video kaynaklarını al"""
    url = f"{BASE_URL}/video/{episode_slug}"
    response = requests.get(url)
    
    # Video linklerini parse et
    videos = re.findall(r"(ajax/videosec&b=[A-Za-z0-9]+&v=.*?)'.*?</span> ?(.*?)</button", response.text)
    return videos

# Test
if __name__ == "__main__":
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    print("Anime listesi aliniyor...")
    anime_list = get_all_anime_list()
    print(f"Toplam {len(anime_list)} anime bulundu")
    
    # İlk 3 anime'yi göster
    for slug, title in anime_list[:3]:
        print(f"\n{'='*50}")
        print(f"Anime: {title} ({slug})")
        
        # Anime ID'sini al (anime sayfasından)
        anime_url = f"{BASE_URL}/anime/{slug}"
        response = requests.get(anime_url)
        anime_id_match = re.findall(r'serilerb/(.*?)\.jpg', response.text)
        if anime_id_match:
            anime_id = anime_id_match[0]
            print(f"Anime ID: {anime_id}")
            
            # Bölümleri al
            episodes = get_anime_episodes(anime_id)
            print(f"Bölüm sayısı: {len(episodes)}")
            
            if episodes:
                ep_slug, ep_title = episodes[0]
                print(f"\nİlk bölüm: {ep_title}")
                print(f"Slug: {ep_slug}")
