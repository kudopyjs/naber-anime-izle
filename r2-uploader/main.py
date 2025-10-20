"""
Main Application: HiAnime to R2 Direct Transfer
Fetches video from HiAnime and streams directly to Cloudflare R2
"""
import sys

# Fix Windows encoding FIRST
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os
import json
import requests
from pathlib import Path
from dotenv import load_dotenv
from hianime_downloader import HiAnimeDownloader
from r2_uploader import R2Uploader

load_dotenv()


class AnimeToR2Pipeline:
    def __init__(self):
        self.downloader = HiAnimeDownloader()
        self.uploader = R2Uploader()
        self.aniwatch_api = os.getenv("ANIWATCH_API_URL", "http://localhost:4000")
    
    def get_episode_info(self, anime_slug, episode_id):
        """Get episode info from Aniwatch API"""
        try:
            url = f"{self.aniwatch_api}/anime/episode-srcs"
            params = {
                "id": episode_id,
                "server": "hd-1",
                "category": "sub"
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == 200:
                return data.get("data", {})
            
            return None
        except Exception as e:
            print(f"❌ API Error: {e}")
            return None
    
    def process_episode(self, anime_slug, episode_id, episode_number, download_first=True):
        """
        Main pipeline: HiAnime → R2
        1. Download video from HiAnime (bypasses Cloudflare)
        2. Upload to R2
        3. Return R2 public URL
        
        Args:
            download_first: If True, download video first then upload (bypasses Cloudflare)
        """
        print(f"\n{'='*60}")
        print(f"🎬 Processing: {anime_slug} - Episode {episode_number}")
        print(f"{'='*60}\n")
        
        # Check if already uploaded
        r2_key = f"{anime_slug}/episode-{episode_number}.mp4"
        if self.uploader.file_exists(r2_key):
            public_url = f"{self.uploader.public_url}/{r2_key}"
            print(f"✅ Already exists in R2: {public_url}")
            return {
                "success": True,
                "video_url": public_url,
                "already_exists": True
            }
        
        # Step 1: Build HiAnime URL
        # episode_id can be either "2142" or "one-piece-100?ep=2142"
        if "?ep=" in episode_id:
            # Full format: one-piece-100?ep=2142
            hianime_url = f"https://hianime.to/watch/{episode_id}"
        else:
            # Just episode number: 2142
            hianime_url = f"https://hianime.to/watch/{anime_slug}?ep={episode_id}"
        
        print(f"📡 Processing video from HiAnime...")
        print(f"   URL: {hianime_url}")
        
        # Step 2: Download video (bypasses Cloudflare)
        if download_first:
            print(f"\n📥 Downloading video (bypasses Cloudflare protection)...")
            
            from pathlib import Path
            temp_dir = Path("temp_downloads")
            temp_dir.mkdir(exist_ok=True)
            
            output_path = temp_dir / f"{anime_slug}-ep{episode_number}.%(ext)s"
            video_file = self.downloader.download_video(hianime_url, output_path)
            
            if not video_file:
                print(f"❌ Failed to download video")
                return {"success": False, "error": "Download failed"}
            
            print(f"✅ Downloaded: {video_file.name} ({video_file.stat().st_size / (1024*1024):.2f} MB)")
            
            # Step 3: Upload to R2
            print(f"\n📤 Uploading to R2...")
            public_url = self.uploader.upload_file(video_file, r2_key)
            
            # Cleanup
            try:
                video_file.unlink()
                print(f"🗑️ Cleaned up temporary file")
            except:
                pass
        else:
            # Direct stream (may fail due to Cloudflare)
            direct_url = self.downloader.get_direct_url(hianime_url)
            if not direct_url:
                print(f"❌ Failed to get video URL")
                return {"success": False, "error": "Failed to get video URL"}
            
            print(f"✅ Got direct URL: {direct_url[:80]}...")
            print(f"\n📤 Streaming to R2...")
            public_url = self.uploader.upload_from_url(direct_url, r2_key)
        
        if not public_url:
            return {"success": False, "error": "Upload failed"}
        
        # Step 3: Get subtitles (optional)
        print(f"\n📝 Processing subtitles...")
        subtitle_urls = self.process_subtitles(hianime_url, anime_slug, episode_number)
        
        print(f"\n{'='*60}")
        print(f"✅ COMPLETED!")
        print(f"🎥 Video: {public_url}")
        if subtitle_urls:
            print(f"📝 Subtitles: {len(subtitle_urls)} files")
        print(f"{'='*60}\n")
        
        return {
            "success": True,
            "video_url": public_url,
            "subtitle_urls": subtitle_urls,
            "already_exists": False
        }
    
    def process_subtitles(self, hianime_url, anime_slug, episode_number):
        """Download and upload subtitles"""
        subtitle_urls = {}
        
        try:
            import yt_dlp
            
            # Download subtitles to temp
            temp_dir = Path("temp_subs")
            temp_dir.mkdir(exist_ok=True)
            
            output_template = str(temp_dir / f"{anime_slug}-ep{episode_number}")
            
            # Download with yt-dlp
            ydl_opts = {
                'skip_download': True,
                'writesubtitles': True,
                'subtitleslangs': ['en', 'eng', 'enUS'],
                'convertsubtitles': 'srt',
                'outtmpl': output_template,
                'quiet': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([hianime_url])
            
            # Upload subtitle files
            for sub_file in temp_dir.glob("*.srt"):
                lang = "en"  # Extract language from filename if needed
                r2_key = f"{anime_slug}/episode-{episode_number}.{lang}.srt"
                
                url = self.uploader.upload_subtitle(sub_file, r2_key)
                if url:
                    subtitle_urls[lang] = url
                
                # Cleanup
                sub_file.unlink()
            
            temp_dir.rmdir()
            
        except Exception as e:
            print(f"⚠️ Subtitle processing error: {e}")
        
        return subtitle_urls
    
    def process_batch(self, episodes):
        """Process multiple episodes"""
        results = []
        
        for ep in episodes:
            result = self.process_episode(
                ep["anime_slug"],
                ep["episode_id"],
                ep["episode_number"]
            )
            results.append({
                **ep,
                **result
            })
        
        return results


def main():
    """CLI Interface"""
    pipeline = AnimeToR2Pipeline()
    
    if len(sys.argv) < 4:
        print("Usage: python main.py <anime_slug> <episode_id> <episode_number>")
        print("Example: python main.py one-piece-100 1 1")
        sys.exit(1)
    
    anime_slug = sys.argv[1]
    episode_id = sys.argv[2]
    episode_number = sys.argv[3]
    
    result = pipeline.process_episode(anime_slug, episode_id, episode_number)
    
    # Save result
    output_file = Path("upload_results.json")
    results = []
    
    if output_file.exists():
        with open(output_file, 'r') as f:
            results = json.load(f)
    
    results.append({
        "anime_slug": anime_slug,
        "episode_id": episode_id,
        "episode_number": episode_number,
        **result
    })
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: {output_file}")


if __name__ == "__main__":
    main()
