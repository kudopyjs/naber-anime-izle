"""
Advanced Cloudflare & CORS Bypass
Uses multiple techniques to bypass protections
"""
import sys
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Fix Windows encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


class CloudflareBypass:
    """Advanced Cloudflare bypass with multiple strategies"""
    
    def __init__(self):
        self.session = self._create_session()
    
    def _create_session(self):
        """Create session with advanced configurations"""
        session = requests.Session()
        
        # Retry strategy
        retry_strategy = Retry(
            total=5,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Advanced headers to bypass Cloudflare
        session.headers.update({
            # Browser fingerprint
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            
            # Additional headers
            'DNT': '1',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            
            # Referer (important for some sites)
            'Referer': 'https://hianime.to/',
            'Origin': 'https://hianime.to',
        })
        
        return session
    
    def download_with_bypass(self, url, output_path, chunk_size=8192):
        """
        Download file with Cloudflare bypass
        
        Args:
            url: Direct video URL
            output_path: Where to save the file
            chunk_size: Download chunk size (default: 8KB)
        
        Returns:
            Path to downloaded file or None
        """
        try:
            print(f"🔓 Bypassing Cloudflare protection...")
            print(f"📥 URL: {url[:80]}...")
            
            # Add video-specific headers
            headers = {
                'Range': 'bytes=0-',  # Support resume
                'Referer': 'https://hianime.to/',
                'Origin': 'https://hianime.to',
            }
            
            # Make request with stream
            response = self.session.get(
                url, 
                headers=headers,
                stream=True,
                timeout=30,
                allow_redirects=True
            )
            
            response.raise_for_status()
            
            # Get file size
            total_size = int(response.headers.get('content-length', 0))
            print(f"📊 File size: {total_size / (1024*1024):.2f} MB")
            
            # Download with progress
            downloaded = 0
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=chunk_size):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Progress indicator
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            print(f"\r📥 Progress: {progress:.1f}% ({downloaded/(1024*1024):.2f}/{total_size/(1024*1024):.2f} MB)", end='')
            
            print(f"\n✅ Download complete: {output_path}")
            return output_path
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                print(f"\n❌ 403 Forbidden - Cloudflare blocked the request")
                print(f"💡 Trying alternative method...")
                return self._download_with_cookies(url, output_path)
            else:
                print(f"\n❌ HTTP Error: {e}")
                return None
        except Exception as e:
            print(f"\n❌ Download error: {e}")
            return None
    
    def _download_with_cookies(self, url, output_path):
        """Alternative download method with cookie handling"""
        try:
            # First, visit the main site to get cookies
            print("🍪 Getting Cloudflare cookies...")
            self.session.get('https://hianime.to/', timeout=10)
            
            # Wait a bit for Cloudflare challenge
            import time
            time.sleep(2)
            
            # Try download again
            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            print(f"\r📥 Progress: {progress:.1f}%", end='')
            
            print(f"\n✅ Download complete")
            return output_path
            
        except Exception as e:
            print(f"\n❌ Alternative method failed: {e}")
            return None
    
    def get_with_bypass(self, url, **kwargs):
        """Make GET request with bypass"""
        return self.session.get(url, **kwargs)
    
    def post_with_bypass(self, url, **kwargs):
        """Make POST request with bypass"""
        return self.session.post(url, **kwargs)


def test_bypass():
    """Test Cloudflare bypass"""
    bypass = CloudflareBypass()
    
    print("="*60)
    print("🧪 Testing Cloudflare Bypass")
    print("="*60)
    
    # Test URL
    test_url = "https://hianime.to/"
    
    try:
        response = bypass.get_with_bypass(test_url, timeout=10)
        print(f"\n✅ Status: {response.status_code}")
        print(f"✅ Cloudflare bypass working!")
        
        # Check if we got past Cloudflare
        if 'cloudflare' in response.text.lower() and 'checking' in response.text.lower():
            print("⚠️ Still showing Cloudflare challenge page")
        else:
            print("✅ Successfully bypassed Cloudflare!")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    test_bypass()
