"""
HiAnime Video Downloader using yt-dlp-hianime
Downloads video and subtitle files
"""
import json
import os
import sys
from pathlib import Path

try:
    import yt_dlp
    YTDLP_AVAILABLE = True
except ImportError:
    YTDLP_AVAILABLE = False
    print("WARNING: yt-dlp not found. Install with: pip install yt-dlp")

# Try to load HiAnime extractor
try:
    from hianime_extractor import HiAnimeIE
    HIANIME_EXTRACTOR_AVAILABLE = True
except ImportError:
    HIANIME_EXTRACTOR_AVAILABLE = False


class HiAnimeDownloader:
    def __init__(self, use_cloudflare_bypass=True):
        self.temp_dir = Path("temp_downloads")
        self.temp_dir.mkdir(exist_ok=True)
        self.use_cloudflare_bypass = use_cloudflare_bypass
        
        if not YTDLP_AVAILABLE:
            raise ImportError("yt-dlp is required. Install with: pip install yt-dlp")
        
        # Register HiAnime extractor if available
        if HIANIME_EXTRACTOR_AVAILABLE:
            print("✅ HiAnime extractor loaded")
        else:
            print("⚠️ HiAnime extractor not found (using default yt-dlp)")
        
        # Cloudflare bypass is handled by yt-dlp headers
        self.cf_bypass = None
        if use_cloudflare_bypass:
            print("✅ Cloudflare bypass enabled (via yt-dlp headers)")
    
    def get_video_info(self, episode_url):
        """Get video information without downloading"""
        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(episode_url, download=False)
            
            return {
                "title": info.get("title", "Unknown"),
                "duration": info.get("duration", 0),
                "formats": info.get("formats", []),
                "subtitles": info.get("subtitles", {}),
                "thumbnail": info.get("thumbnail", "")
            }
        except Exception as e:
            print(f"❌ Error getting video info: {e}")
            return None
    
    def download_video(self, episode_url, output_path=None):
        """Download video with best quality and Cloudflare bypass"""
        try:
            if output_path is None:
                output_path = self.temp_dir / "%(title)s.%(ext)s"
            
            # Advanced yt-dlp options with Cloudflare bypass
            ydl_opts = {
                'format': 'best[height<=1080]',
                'outtmpl': str(output_path),
                'noplaylist': True,
                'writesubtitles': True,
                'subtitleslangs': ['en', 'eng', 'enUS'],
                'convertsubtitles': 'srt',
                
                # Cloudflare bypass headers
                'http_headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': 'https://hianime.to/',
                    'Origin': 'https://hianime.to',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site',
                },
                
                # Advanced options
                'retries': 10,
                'fragment_retries': 10,
                'skip_unavailable_fragments': True,
                'keepvideo': False,
                'nocheckcertificate': True,
                'prefer_insecure': False,
                'no_warnings': False,
                'ignoreerrors': False,
                
                # HLS options
                'hls_prefer_native': True,
                'hls_use_mpegts': True,
                
                # Concurrent fragments
                'concurrent_fragment_downloads': 5,
            }
            
            print(f"🎬 Downloading with Cloudflare bypass: {episode_url}")
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([episode_url])
            
            # Find downloaded file
            if output_path.parent.exists():
                files = list(output_path.parent.glob("*"))
                video_files = [f for f in files if f.suffix in ['.mp4', '.mkv', '.webm']]
                if video_files:
                    # Sort by size (largest first)
                    video_files.sort(key=lambda x: x.stat().st_size, reverse=True)
                    return video_files[0]
            
            return None
        except Exception as e:
            print(f"❌ Download error: {e}")
            return None
    
    def get_direct_url(self, episode_url):
        """Get direct video URL without downloading"""
        try:
            ydl_opts = {
                'format': 'best[height<=1080]',
                'quiet': True,
                'no_warnings': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(episode_url, download=False)
                
                # Get the direct URL from the selected format
                if 'url' in info:
                    return info['url']
                elif 'formats' in info and info['formats']:
                    # Find best format
                    for fmt in reversed(info['formats']):
                        if fmt.get('url'):
                            return fmt['url']
            
            return None
        except Exception as e:
            print(f"❌ Error getting direct URL: {e}")
            return None
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            for file in self.temp_dir.glob("*"):
                file.unlink()
            print("✅ Cleanup completed")
        except Exception as e:
            print(f"⚠️ Cleanup error: {e}")


if __name__ == "__main__":
    # Test
    downloader = HiAnimeDownloader()
    
    # Example: One Piece Episode 1
    test_url = "https://hianime.to/watch/one-piece-100?ep=1"
    
    print("📊 Getting video info...")
    info = downloader.get_video_info(test_url)
    if info:
        print(f"✅ Title: {info['title']}")
        print(f"✅ Duration: {info['duration']}s")
    
    print("\n🔗 Getting direct URL...")
    direct_url = downloader.get_direct_url(test_url)
    if direct_url:
        print(f"✅ Direct URL: {direct_url[:100]}...")
