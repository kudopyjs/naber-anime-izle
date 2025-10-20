"""
Fix yt-dlp plugins issue by removing problematic __init__.py files
"""
import sys
from pathlib import Path

# Fix Windows encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    import yt_dlp
    
    yt_dlp_path = Path(yt_dlp.__file__).parent
    plugins_dir = yt_dlp_path / "plugins"
    
    print("="*60)
    print("🔧 Fixing yt-dlp plugins issue")
    print("="*60)
    print(f"\nyt-dlp location: {yt_dlp_path}")
    print(f"Plugins directory: {plugins_dir}")
    
    # Remove problematic __init__.py files
    files_to_remove = [
        plugins_dir / "__init__.py",
        plugins_dir / "extractor" / "__init__.py"
    ]
    
    removed_count = 0
    for file_path in files_to_remove:
        if file_path.exists():
            try:
                file_path.unlink()
                print(f"✅ Removed: {file_path}")
                removed_count += 1
            except Exception as e:
                print(f"❌ Failed to remove {file_path}: {e}")
        else:
            print(f"ℹ️ Not found: {file_path}")
    
    print(f"\n{'='*60}")
    if removed_count > 0:
        print(f"✅ Fixed! Removed {removed_count} files")
        print("You can now run: python main.py")
    else:
        print("✅ No problematic files found")
    print("="*60)
    
except ImportError:
    print("❌ yt-dlp not installed")
    print("Install with: pip install yt-dlp")
except Exception as e:
    print(f"❌ Error: {e}")
