"""
Install yt-dlp HiAnime extractor
Downloads and installs the custom extractor from GitHub
"""
import os
import sys
import requests
from pathlib import Path

# Fix Windows encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def download_extractor():
    """Download HiAnime extractor from GitHub"""
    
    print("="*60)
    print("🔧 Installing yt-dlp HiAnime Extractor")
    print("="*60)
    
    # GitHub raw URL
    extractor_url = "https://raw.githubusercontent.com/pratikpatel8982/yt-dlp-hianime/master/yt_dlp_plugins/extractor/hianime.py"
    
    print(f"\n📥 Downloading extractor from GitHub...")
    print(f"   {extractor_url}")
    
    try:
        response = requests.get(extractor_url, timeout=10)
        response.raise_for_status()
        
        extractor_code = response.text
        print(f"✅ Downloaded {len(extractor_code)} bytes")
        
        # Find yt-dlp plugins directory
        import yt_dlp
        yt_dlp_path = Path(yt_dlp.__file__).parent
        
        # Create plugins directory structure
        plugins_dir = yt_dlp_path / "plugins" / "extractor"
        plugins_dir.mkdir(parents=True, exist_ok=True)
        
        # Save extractor
        extractor_file = plugins_dir / "hianime.py"
        with open(extractor_file, 'w', encoding='utf-8') as f:
            f.write(extractor_code)
        
        print(f"✅ Installed to: {extractor_file}")
        
        # Remove __init__.py files if they exist (they cause import issues)
        for init_dir in [plugins_dir.parent, plugins_dir]:
            init_file = init_dir / "__init__.py"
            if init_file.exists():
                init_file.unlink()
                print(f"✅ Removed: {init_file}")
        
        print("\n" + "="*60)
        print("✅ Installation Complete!")
        print("="*60)
        print("\nYou can now use HiAnime URLs with yt-dlp:")
        print("  python main.py one-piece-100 one-piece-100?ep=2142 1")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Installation failed: {e}")
        print("\n📝 Manual installation:")
        print("1. Download: https://github.com/pratikpatel8982/yt-dlp-hianime")
        print("2. Copy hianime.py to yt-dlp plugins/extractor/")
        return False


if __name__ == "__main__":
    download_extractor()
