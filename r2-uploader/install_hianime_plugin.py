"""
Install HiAnime plugin for yt-dlp (Official Method)
Based on: https://github.com/yt-dlp/yt-dlp#installing-plugins
"""
import sys

# Fix Windows encoding FIRST
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os
import requests
from pathlib import Path


def get_plugin_directory():
    """Get the correct plugin directory based on OS"""
    if sys.platform == 'win32':
        # Windows: %APPDATA%\yt-dlp\plugins
        appdata = os.getenv('APPDATA')
        return Path(appdata) / 'yt-dlp' / 'plugins'
    elif sys.platform == 'darwin':
        # macOS: ~/Library/Application Support/yt-dlp/plugins
        return Path.home() / 'Library' / 'Application Support' / 'yt-dlp' / 'plugins'
    else:
        # Linux: ~/.config/yt-dlp/plugins
        xdg_config = os.getenv('XDG_CONFIG_HOME', Path.home() / '.config')
        return Path(xdg_config) / 'yt-dlp' / 'plugins'


def download_file(url, destination):
    """Download file from URL"""
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    
    with open(destination, 'w', encoding='utf-8') as f:
        f.write(response.text)
    
    return len(response.text)


def install_hianime_plugin():
    """Install HiAnime extractor plugin"""
    
    print("="*60)
    print("🔧 Installing HiAnime Plugin for yt-dlp")
    print("="*60)
    
    # Get plugin directory
    plugin_dir = get_plugin_directory()
    extractor_dir = plugin_dir / 'extractor'
    
    print(f"\n📁 Plugin directory: {plugin_dir}")
    
    # Create directories
    extractor_dir.mkdir(parents=True, exist_ok=True)
    print(f"✅ Created directory: {extractor_dir}")
    
    # GitHub raw URLs
    files_to_download = {
        'hianime.py': 'https://raw.githubusercontent.com/pratikpatel8982/yt-dlp-hianime/master/yt_dlp_plugins/extractor/hianime.py',
        'megacloud.py': 'https://raw.githubusercontent.com/pratikpatel8982/yt-dlp-hianime/master/yt_dlp_plugins/extractor/megacloud.py'
    }
    
    print(f"\n📥 Downloading files from GitHub...")
    
    for filename, url in files_to_download.items():
        destination = extractor_dir / filename
        print(f"\n  Downloading: {filename}")
        print(f"  From: {url}")
        
        try:
            size = download_file(url, destination)
            print(f"  ✅ Saved: {destination} ({size} bytes)")
        except Exception as e:
            print(f"  ❌ Failed: {e}")
            return False
    
    print("\n" + "="*60)
    print("✅ Installation Complete!")
    print("="*60)
    
    print("\n📋 Installed files:")
    for file in extractor_dir.glob('*.py'):
        print(f"  - {file.name}")
    
    print("\n🎯 Usage:")
    print("  yt-dlp 'https://hianime.to/watch/one-piece-100?ep=2142'")
    print("  python main.py one-piece-100 2142 1")
    
    print("\n💡 Note:")
    print("  Plugins are loaded automatically by yt-dlp")
    print("  No need to import or configure anything")
    
    return True


def verify_installation():
    """Verify plugin installation"""
    plugin_dir = get_plugin_directory()
    extractor_dir = plugin_dir / 'extractor'
    
    print("\n" + "="*60)
    print("🔍 Verifying Installation")
    print("="*60)
    
    required_files = ['hianime.py', 'megacloud.py']
    all_present = True
    
    for filename in required_files:
        file_path = extractor_dir / filename
        if file_path.exists():
            print(f"✅ {filename}: Found")
        else:
            print(f"❌ {filename}: Not found")
            all_present = False
    
    if all_present:
        print("\n✅ All files present!")
        return True
    else:
        print("\n❌ Some files missing")
        return False


def main():
    print("\n🚀 HiAnime Plugin Installer for yt-dlp")
    print("Based on official yt-dlp plugin system\n")
    
    # Check if yt-dlp is installed
    try:
        import yt_dlp
        print(f"✅ yt-dlp version: {yt_dlp.version.__version__}")
    except ImportError as e:
        print(f"❌ yt-dlp import error: {e}")
        print("Install with: pip install yt-dlp")
        return
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return
    
    # Install plugin
    if install_hianime_plugin():
        verify_installation()
        
        print("\n" + "="*60)
        print("🎉 Ready to use!")
        print("="*60)
        print("\nTest with:")
        print("  python test_hianime.py")
    else:
        print("\n❌ Installation failed")


if __name__ == "__main__":
    main()
