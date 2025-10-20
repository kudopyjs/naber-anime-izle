"""
HiAnime Bypass Module
Megacloud embed linklerini extract etmek ve video URL'lerini çözmek için gerekli fonksiyonlar.

- fetch(url) -> str                     Firefox TLS impersonation ile GET request
- get_episode_embed(episode_id) -> str  Episode için Megacloud embed URL'ini al
- extract_video_url(embed_url) -> str   Embed'den gerçek video URL'ini çıkar
- get_m3u8_playlist(url) -> str         En yüksek kaliteli m3u8 stream'i al
"""

import sys
import os

# Fix Windows encoding FIRST
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import re
import json
import base64
from curl_cffi import requests
from urllib.parse import urlparse, parse_qs

# Global session
session = None
BASE_URL = "https://hianime.to"
MEGACLOUD_BASE = "https://megacloud.tv"

def fetch(url, headers=None, base_url=None):
    """
    Curl-cffi kullanarak Firefox TLS Fingerprint Impersonation ile GET request.
    Cloudflare bypass için gerekli.
    """
    global session
    
    if session is None:
        session = requests.Session(
            impersonate="chrome120",
            allow_redirects=True
        )
    
    if headers is None:
        headers = {}
    
    # Default headers
    default_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": base_url or BASE_URL,
        "Origin": base_url or BASE_URL,
    }
    
    headers = {**default_headers, **headers}
    
    try:
        response = session.get(url, headers=headers)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"❌ Fetch error: {e}")
        return None


def get_episode_servers(episode_id):
    """
    Episode için mevcut sunucuları al.
    
    Args:
        episode_id: Episode ID (örn: "2142" veya "one-piece-100?ep=2142")
    
    Returns:
        dict: Sunucu bilgileri
    """
    # Episode ID'yi parse et
    if "?ep=" in episode_id:
        ep_num = episode_id.split("?ep=")[1]
    else:
        ep_num = episode_id
    
    url = f"{BASE_URL}/ajax/v2/episode/servers?episodeId={ep_num}"
    
    print(f"📡 Fetching servers from: {url}")
    
    try:
        response = fetch(url)
        if response:
            data = json.loads(response)
            print(f"✅ Got servers data: {len(response)} bytes")
            return data
    except Exception as e:
        print(f"❌ Error getting servers: {e}")
    
    return None


def get_episode_embed(episode_id, server="vidstreaming", category="sub"):
    """
    Episode için embed URL'ini al.
    
    Args:
        episode_id: Episode ID
        server: Server adı (vidstreaming, megacloud, etc.)
        category: sub, dub, raw
    
    Returns:
        str: Embed URL
    """
    # Önce sunucuları al
    servers_data = get_episode_servers(episode_id)
    
    if not servers_data or "html" not in servers_data:
        print("❌ No servers found")
        return None
    
    # HTML'den server linklerini parse et
    html = servers_data["html"]
    
    # Megacloud veya vidstreaming server'ını bul
    server_pattern = rf'data-id="(\d+)"[^>]*class="[^"]*{server}[^"]*"'
    match = re.search(server_pattern, html, re.IGNORECASE)
    
    if not match:
        # Fallback: İlk server'ı al
        match = re.search(r'data-id="(\d+)"', html)
    
    if not match:
        print("❌ No server ID found")
        return None
    
    server_id = match.group(1)
    
    # Embed URL'ini al
    embed_url = f"{BASE_URL}/ajax/v2/episode/sources?id={server_id}"
    
    try:
        response = fetch(embed_url)
        if response:
            data = json.loads(response)
            if "link" in data:
                return data["link"]
    except Exception as e:
        print(f"❌ Error getting embed: {e}")
    
    return None


def extract_megacloud_sources(embed_url):
    """
    Megacloud embed sayfasından video kaynaklarını çıkar.
    
    Args:
        embed_url: Megacloud embed URL
    
    Returns:
        dict: Video sources ve tracks
    """
    try:
        # Embed sayfasını al
        html = fetch(embed_url, base_url=MEGACLOUD_BASE)
        
        if not html:
            return None
        
        # Script içindeki sources'ı bul
        # Megacloud genelde sources'ı encrypted tutar, decrypt etmek gerek
        
        # Basit yaklaşım: m3u8 linklerini direkt bul
        m3u8_pattern = r'(https?://[^\s"\'<>]+\.m3u8[^\s"\'<>]*)'
        m3u8_links = re.findall(m3u8_pattern, html)
        
        if m3u8_links:
            return {
                "sources": [{"url": link, "quality": "auto"} for link in m3u8_links],
                "tracks": []
            }
        
        # Alternatif: JSON sources'ı bul
        sources_pattern = r'sources:\s*(\[.*?\])'
        sources_match = re.search(sources_pattern, html, re.DOTALL)
        
        if sources_match:
            try:
                sources_json = sources_match.group(1)
                sources = json.loads(sources_json)
                return {
                    "sources": sources,
                    "tracks": []
                }
            except:
                pass
        
        return None
        
    except Exception as e:
        print(f"❌ Error extracting sources: {e}")
        return None


def get_video_url(episode_id, server="vidstreaming"):
    """
    Episode ID'den direkt video URL'ini al.
    
    Args:
        episode_id: Episode ID (örn: "one-piece-100?ep=2142")
        server: Server adı
    
    Returns:
        str: Video URL veya None
    """
    print(f"🔍 Getting video URL for: {episode_id}")
    
    # 1. Embed URL'ini al
    embed_url = get_episode_embed(episode_id, server)
    
    if not embed_url:
        print("❌ Could not get embed URL")
        return None
    
    print(f"✅ Embed URL: {embed_url}")
    
    # 2. Embed'den video sources'ı çıkar
    sources = extract_megacloud_sources(embed_url)
    
    if not sources or not sources.get("sources"):
        print("❌ Could not extract video sources")
        return None
    
    # 3. En yüksek kaliteli source'u döndür
    video_url = sources["sources"][0]["url"]
    print(f"✅ Video URL: {video_url}")
    
    return video_url


def get_m3u8_playlist(m3u8_url):
    """
    M3U8 playlist'inden en yüksek kaliteli stream'i al.
    
    Args:
        m3u8_url: Master m3u8 URL
    
    Returns:
        str: En yüksek kaliteli stream URL
    """
    try:
        content = fetch(m3u8_url)
        
        if not content:
            return m3u8_url
        
        # Master playlist mı kontrol et
        if "#EXT-X-STREAM-INF" not in content:
            # Zaten media playlist
            return m3u8_url
        
        # En yüksek bandwidth'li stream'i bul
        lines = content.split('\n')
        max_bandwidth = 0
        best_url = None
        
        for i, line in enumerate(lines):
            if line.startswith("#EXT-X-STREAM-INF"):
                # Bandwidth'i çıkar
                bandwidth_match = re.search(r'BANDWIDTH=(\d+)', line)
                if bandwidth_match:
                    bandwidth = int(bandwidth_match.group(1))
                    if bandwidth > max_bandwidth:
                        max_bandwidth = bandwidth
                        # Bir sonraki satır URL
                        if i + 1 < len(lines):
                            url = lines[i + 1].strip()
                            # Relative URL ise absolute yap
                            if not url.startswith('http'):
                                base = '/'.join(m3u8_url.split('/')[:-1])
                                url = f"{base}/{url}"
                            best_url = url
        
        return best_url or m3u8_url
        
    except Exception as e:
        print(f"❌ Error parsing m3u8: {e}")
        return m3u8_url


def download_with_bypass(episode_id, output_path=None):
    """
    Episode'u Cloudflare bypass ile indir.
    
    Args:
        episode_id: Episode ID
        output_path: Çıktı dosya yolu
    
    Returns:
        str: İndirilen dosya yolu
    """
    # Video URL'ini al
    video_url = get_video_url(episode_id)
    
    if not video_url:
        return None
    
    # M3U8 ise en iyi kaliteyi al
    if '.m3u8' in video_url:
        video_url = get_m3u8_playlist(video_url)
    
    print(f"📥 Downloading from: {video_url}")
    
    # yt-dlp veya ffmpeg ile indir
    # Bu kısım opsiyonel, direkt URL döndürebiliriz
    
    return video_url


# Test fonksiyonu
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python hianime_bypass.py <episode_id>")
        print("Example: python hianime_bypass.py 'one-piece-100?ep=2142'")
        sys.exit(1)
    
    episode_id = sys.argv[1]
    
    print(f"{'='*60}")
    print(f"🎬 HiAnime Bypass Test")
    print(f"{'='*60}\n")
    
    video_url = get_video_url(episode_id)
    
    if video_url:
        print(f"\n{'='*60}")
        print(f"✅ SUCCESS!")
        print(f"{'='*60}")
        print(f"Video URL: {video_url}")
        print(f"{'='*60}")
    else:
        print(f"\n❌ Failed to get video URL")
