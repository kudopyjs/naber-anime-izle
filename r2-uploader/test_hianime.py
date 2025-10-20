"""
Test HiAnime plugin with yt-dlp
"""
import sys

# Fix Windows encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    import yt_dlp
    
    print("="*60)
    print("🧪 Testing HiAnime Plugin")
    print("="*60)
    
    # Test URL
    test_url = "https://hianime.to/watch/one-piece-100?ep=2142"
    
    print(f"\n📺 Test URL: {test_url}")
    print(f"yt-dlp version: {yt_dlp.version.__version__}")
    
    # Configure yt-dlp
    ydl_opts = {
        'quiet': False,
        'no_warnings': False,
        'extract_flat': False,
    }
    
    print("\n🔍 Extracting video info...")
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(test_url, download=False)
            
            print("\n✅ Success! Video info extracted:")
            print(f"  Title: {info.get('title', 'N/A')}")
            print(f"  Duration: {info.get('duration', 0)}s")
            print(f"  Formats: {len(info.get('formats', []))}")
            
            if 'url' in info:
                print(f"  Direct URL: {info['url'][:80]}...")
            
            print("\n✅ HiAnime plugin is working!")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("\nPossible issues:")
            print("  1. Plugin not installed correctly")
            print("  2. HiAnime URL format changed")
            print("  3. Network/Cloudflare issue")
            print("\nRun: python install_hianime_plugin.py")

except ImportError:
    print("❌ yt-dlp not installed")
    print("Install with: pip install yt-dlp")
