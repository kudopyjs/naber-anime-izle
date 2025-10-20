"""
Cloudflare R2 Uploader
Streams video directly to R2 without local storage
"""
import boto3
import requests
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class R2Uploader:
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID")
        self.access_key = os.getenv("R2_ACCESS_KEY_ID")
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.public_url = os.getenv("R2_PUBLIC_URL")
        
        # S3-compatible client for R2
        self.s3_client = boto3.client(
            's3',
            endpoint_url=f'https://{self.account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name='auto'
        )
    
    def upload_from_url(self, source_url, destination_key, chunk_size=8192*1024):
        """
        Stream upload from URL to R2 (no local storage)
        chunk_size: 8MB chunks for efficient streaming
        """
        try:
            print(f"🚀 Starting stream upload to R2...")
            print(f"📥 Source: {source_url[:80]}...")
            print(f"📤 Destination: {destination_key}")
            
            # Stream from source URL
            response = requests.get(source_url, stream=True, timeout=30)
            response.raise_for_status()
            
            # Get content length
            content_length = int(response.headers.get('content-length', 0))
            print(f"📊 File size: {content_length / (1024*1024):.2f} MB")
            
            # Upload to R2 with streaming
            self.s3_client.upload_fileobj(
                response.raw,
                self.bucket_name,
                destination_key,
                ExtraArgs={
                    'ContentType': 'video/mp4',
                    'CacheControl': 'public, max-age=31536000'
                }
            )
            
            # Generate public URL
            public_url = f"{self.public_url}/{destination_key}"
            print(f"✅ Upload successful!")
            print(f"🔗 Public URL: {public_url}")
            
            return public_url
            
        except Exception as e:
            print(f"❌ Upload error: {e}")
            return None
    
    def upload_file(self, file_path, destination_key):
        """Upload local file to R2"""
        try:
            print(f"📤 Uploading {file_path} to R2...")
            
            with open(file_path, 'rb') as f:
                self.s3_client.upload_fileobj(
                    f,
                    self.bucket_name,
                    destination_key,
                    ExtraArgs={
                        'ContentType': self._get_content_type(file_path),
                        'CacheControl': 'public, max-age=31536000'
                    }
                )
            
            public_url = f"{self.public_url}/{destination_key}"
            print(f"✅ Upload successful: {public_url}")
            return public_url
            
        except Exception as e:
            print(f"❌ Upload error: {e}")
            return None
    
    def upload_subtitle(self, subtitle_path, destination_key):
        """Upload subtitle file (.srt, .vtt)"""
        try:
            with open(subtitle_path, 'rb') as f:
                self.s3_client.upload_fileobj(
                    f,
                    self.bucket_name,
                    destination_key,
                    ExtraArgs={
                        'ContentType': 'text/vtt' if subtitle_path.endswith('.vtt') else 'text/plain',
                        'CacheControl': 'public, max-age=31536000'
                    }
                )
            
            public_url = f"{self.public_url}/{destination_key}"
            print(f"✅ Subtitle uploaded: {public_url}")
            return public_url
            
        except Exception as e:
            print(f"❌ Subtitle upload error: {e}")
            return None
    
    def file_exists(self, key):
        """Check if file exists in R2"""
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except:
            return False
    
    def _get_content_type(self, file_path):
        """Get content type based on file extension"""
        ext = Path(file_path).suffix.lower()
        content_types = {
            '.mp4': 'video/mp4',
            '.mkv': 'video/x-matroska',
            '.webm': 'video/webm',
            '.srt': 'text/plain',
            '.vtt': 'text/vtt',
            '.jpg': 'image/jpeg',
            '.png': 'image/png'
        }
        return content_types.get(ext, 'application/octet-stream')


if __name__ == "__main__":
    # Test
    uploader = R2Uploader()
    print("✅ R2 Uploader initialized")
    print(f"📦 Bucket: {uploader.bucket_name}")
    print(f"🔗 Public URL: {uploader.public_url}")
