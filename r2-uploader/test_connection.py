"""
Test R2 Connection and yt-dlp
"""
import os
import sys
from dotenv import load_dotenv
from r2_uploader import R2Uploader
from hianime_downloader import HiAnimeDownloader

# Fix Windows encoding for emojis
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()


def test_r2_connection():
    """Test R2 connection"""
    print("\n" + "="*60)
    print("🧪 Testing Cloudflare R2 Connection")
    print("="*60 + "\n")
    
    try:
        uploader = R2Uploader()
        
        print(f"✅ Account ID: {uploader.account_id[:8]}...")
        print(f"✅ Bucket: {uploader.bucket_name}")
        print(f"✅ Public URL: {uploader.public_url}")
        
        # Test file upload (small test file)
        test_key = "test/connection-test.txt"
        test_content = b"Hello from R2 Uploader!"
        
        print(f"\n📤 Uploading test file...")
        
        uploader.s3_client.put_object(
            Bucket=uploader.bucket_name,
            Key=test_key,
            Body=test_content,
            ContentType='text/plain'
        )
        
        test_url = f"{uploader.public_url}/{test_key}"
        print(f"✅ Test file uploaded: {test_url}")
        
        # Check if file exists
        if uploader.file_exists(test_key):
            print(f"✅ File verification successful")
        
        print(f"\n✅ R2 Connection Test: PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ R2 Connection Test: FAILED")
        print(f"Error: {e}")
        return False


def test_ytdlp():
    """Test yt-dlp installation"""
    print("\n" + "="*60)
    print("🧪 Testing yt-dlp")
    print("="*60 + "\n")
    
    try:
        import yt_dlp
        
        # Check yt-dlp version
        version = yt_dlp.version.__version__
        print(f"✅ yt-dlp version: {version}")
        
        # Test with a simple URL (YouTube)
        print(f"\n📡 Testing video info extraction...")
        
        downloader = HiAnimeDownloader()
        
        # Test URL (use a short video)
        test_url = "https://www.youtube.com/watch?v=jNQXAC9IVRw"  # "Me at the zoo"
        
        info = downloader.get_video_info(test_url)
        
        if info:
            print(f"✅ Title: {info['title']}")
            print(f"✅ Duration: {info['duration']}s")
            print(f"✅ Formats available: {len(info['formats'])}")
        
        print(f"\n✅ yt-dlp Test: PASSED")
        return True
        
    except ImportError:
        print(f"\n❌ yt-dlp Test: FAILED")
        print(f"Error: yt-dlp module not found")
        print(f"\nℹ️ Install yt-dlp: pip install yt-dlp")
        return False
    except Exception as e:
        print(f"\n❌ yt-dlp Test: FAILED")
        print(f"Error: {e}")
        print(f"\nℹ️ Install yt-dlp: pip install yt-dlp")
        return False


def test_env_variables():
    """Test environment variables"""
    print("\n" + "="*60)
    print("🧪 Testing Environment Variables")
    print("="*60 + "\n")
    
    required_vars = [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "R2_PUBLIC_URL"
    ]
    
    all_present = True
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if "KEY" in var or "SECRET" in var:
                display_value = value[:8] + "..." if len(value) > 8 else "***"
            else:
                display_value = value
            
            print(f"✅ {var}: {display_value}")
        else:
            print(f"❌ {var}: NOT SET")
            all_present = False
    
    if all_present:
        print(f"\n✅ Environment Variables Test: PASSED")
    else:
        print(f"\n❌ Environment Variables Test: FAILED")
        print(f"\nℹ️ Copy .env.example to .env and fill in your values")
    
    return all_present


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🚀 R2 Uploader - Connection Tests")
    print("="*60)
    
    results = {
        "Environment Variables": test_env_variables(),
        "yt-dlp": test_ytdlp(),
        "R2 Connection": test_r2_connection()
    }
    
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60 + "\n")
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed! You're ready to upload videos.")
        print("\nNext steps:")
        print("  1. python main.py <anime_slug> <episode_id> <episode_number>")
        print("  2. python batch_upload.py")
    else:
        print("\n⚠️ Some tests failed. Please fix the issues above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
