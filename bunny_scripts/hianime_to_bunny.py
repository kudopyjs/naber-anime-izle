#!/usr/bin/env python3
"""
HiAnime to Bunny Stream Pipeline
1. Get video URL from HiAnime (via yt-dlp)
2. Download video
3. Upload to Bunny Stream
4. Get playback URL
"""

import os
import sys

# Fix Windows encoding FIRST
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import time
import requests
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'r2-uploader'))

try:
    import yt_dlp
except ImportError:
    print("❌ yt-dlp not found. Install with: pip install yt-dlp")
    sys.exit(1)

# Bunny credentials from .env
from dotenv import load_dotenv
load_dotenv()

BUNNY_API_KEY = os.getenv('VITE_BUNNY_STREAM_API_KEY')
BUNNY_LIBRARY_ID = os.getenv('VITE_BUNNY_LIBRARY_ID')
BUNNY_CDN_HOSTNAME = os.getenv('VITE_BUNNY_CDN_HOSTNAME')

if not all([BUNNY_API_KEY, BUNNY_LIBRARY_ID, BUNNY_CDN_HOSTNAME]):
    print("❌ Missing Bunny credentials in .env")
    sys.exit(1)


class HiAnimeToBunny:
    def __init__(self):
        self.temp_dir = Path("temp_downloads")
        self.temp_dir.mkdir(exist_ok=True)
    
    def get_video_url(self, hianime_url):
        """Get direct video URL from HiAnime using yt-dlp"""
        print(f"🔍 Getting video URL from HiAnime...")
        print(f"   {hianime_url}")
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'best[height<=1080]',
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(hianime_url, download=False)
                
                if 'url' in info:
                    print(f"✅ Got direct URL")
                    return info['url']
                elif 'formats' in info and info['formats']:
                    for fmt in reversed(info['formats']):
                        if fmt.get('url'):
                            print(f"✅ Got URL from format")
                            return fmt['url']
                
                print(f"❌ No URL found in video info")
                return None
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def download_video(self, hianime_url, output_path):
        """Download video from HiAnime"""
        print(f"\n📥 Downloading video...")
        
        ydl_opts = {
            'format': 'best[height<=1080]',
            'outtmpl': str(output_path),
            'quiet': False,
            'no_warnings': False,
            
            # Cloudflare bypass headers
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://hianime.to/',
            },
            
            # Download options
            'retries': 10,
            'fragment_retries': 10,
            'concurrent_fragment_downloads': 5,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([hianime_url])
            
            if output_path.exists():
                file_size = output_path.stat().st_size
                print(f"✅ Downloaded: {file_size / (1024*1024):.2f} MB")
                return True
            else:
                print(f"❌ Download failed - file not found")
                return False
                
        except Exception as e:
            print(f"❌ Download error: {e}")
            return False
    
    def upload_to_bunny(self, video_path, title, collection_id=None):
        """Upload video to Bunny Stream"""
        print(f"\n📤 Uploading to Bunny Stream...")
        
        # 1. Create video
        payload = {"title": title}
        if collection_id:
            payload["collectionId"] = collection_id
        
        response = requests.post(
            f"https://video.bunnycdn.com/library/{BUNNY_LIBRARY_ID}/videos",
            headers={"AccessKey": BUNNY_API_KEY},
            json=payload
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to create video: {response.status_code}")
            print(f"   {response.text}")
            return None
        
        video_id = response.json().get("guid")
        print(f"✅ Video created: {video_id}")
        
        # 2. Upload file
        print(f"📤 Uploading file...")
        
        with open(video_path, 'rb') as f:
            response = requests.put(
                f"https://video.bunnycdn.com/library/{BUNNY_LIBRARY_ID}/videos/{video_id}",
                headers={
                    "AccessKey": BUNNY_API_KEY,
                    "Content-Type": "application/octet-stream"
                },
                data=f
            )
        
        if response.status_code in [200, 201]:
            print(f"✅ Upload complete!")
            return video_id
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   {response.text}")
            return None
    
    def get_playback_url(self, video_id):
        """Get playback URL for video"""
        # Bunny Stream URL format
        playback_url = f"https://{BUNNY_CDN_HOSTNAME}/{video_id}/playlist.m3u8"
        return playback_url
    
    def fetch_to_bunny(self, video_url, title, collection_id=None):
        """
        Tell Bunny to fetch video from URL (no local download needed!)
        
        Args:
            video_url: Direct video URL
            title: Video title
            collection_id: Optional collection ID
        
        Returns:
            video_id if success, None if failed
        """
        print(f"\n📤 Telling Bunny to fetch video...")
        print(f"   URL: {video_url[:80]}...")
        
        # 1. Create video
        payload = {"title": title}
        if collection_id:
            payload["collectionId"] = collection_id
        
        response = requests.post(
            f"https://video.bunnycdn.com/library/{BUNNY_LIBRARY_ID}/videos",
            headers={"AccessKey": BUNNY_API_KEY},
            json=payload
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to create video: {response.status_code}")
            print(f"   {response.text}")
            return None
        
        video_id = response.json().get("guid")
        print(f"✅ Video created: {video_id}")
        
        # 2. Fetch from URL
        fetch_payload = {
            "url": video_url,
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://hianime.to/",
                "Origin": "https://hianime.to"
            }
        }
        
        response = requests.post(
            f"https://video.bunnycdn.com/library/{BUNNY_LIBRARY_ID}/videos/{video_id}/fetch",
            headers={"AccessKey": BUNNY_API_KEY},
            json=fetch_payload
        )
        
        print(f"📡 Fetch response: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print(f"✅ Bunny is fetching the video!")
            print(f"⏳ This may take a few minutes...")
            return video_id
        else:
            print(f"❌ Fetch failed: {response.status_code}")
            print(f"   {response.text}")
            return None
    
    def process_episode(self, anime_slug, episode_id, episode_number, anime_name=None):
        """
        Complete pipeline: HiAnime -> Get URL -> Bunny Fetch -> Playback URL
        
        Returns:
            dict with success, video_id, playback_url
        """
        print("="*60)
        print(f"🎬 Processing: {anime_slug} - Episode {episode_number}")
        print("="*60)
        
        # Build HiAnime URL
        hianime_url = f"https://hianime.to/watch/{anime_slug}?ep={episode_id}"
        
        # Title for Bunny
        title = f"{anime_name or anime_slug} - Episode {episode_number}"
        
        try:
            # 1. Get direct video URL from HiAnime (no download!)
            print(f"\n🔍 Getting direct video URL...")
            direct_url = self.get_video_url(hianime_url)
            
            if not direct_url:
                return {"success": False, "error": "Failed to get video URL"}
            
            print(f"✅ Got direct URL: {direct_url[:80]}...")
            
            # 2. Tell Bunny to fetch it
            video_id = self.fetch_to_bunny(direct_url, title)
            
            if not video_id:
                return {"success": False, "error": "Bunny fetch failed"}
            
            # 3. Get playback URL
            playback_url = self.get_playback_url(video_id)
            
            print(f"\n{'='*60}")
            print(f"✅ SUCCESS!")
            print(f"{'='*60}")
            print(f"Video ID: {video_id}")
            print(f"Playback URL: {playback_url}")
            print(f"{'='*60}")
            print(f"\n💡 Note: Bunny is still fetching the video.")
            print(f"   It will be available in a few minutes.")
            print(f"   Check status: https://dash.bunny.net/stream/{BUNNY_LIBRARY_ID}")
            
            return {
                "success": True,
                "video_id": video_id,
                "playback_url": playback_url,
                "anime_slug": anime_slug,
                "episode_number": episode_number,
                "status": "processing"
            }
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}


def main():
    """CLI interface"""
    if len(sys.argv) < 4:
        print("Usage: python hianime_to_bunny.py <anime_slug> <episode_id> <episode_number> [anime_name]")
        print("\nExample:")
        print("  python hianime_to_bunny.py one-piece-100 2142 1 'One Piece'")
        sys.exit(1)
    
    anime_slug = sys.argv[1]
    episode_id = sys.argv[2]
    episode_number = int(sys.argv[3])
    anime_name = sys.argv[4] if len(sys.argv) > 4 else None
    
    pipeline = HiAnimeToBunny()
    result = pipeline.process_episode(anime_slug, episode_id, episode_number, anime_name)
    
    # Save result
    if result["success"]:
        output_file = Path("bunny_upload_result.json")
        import json
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\n💾 Result saved to: {output_file}")
    
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
