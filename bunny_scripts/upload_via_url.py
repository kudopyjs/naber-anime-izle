#!/usr/bin/env python3
"""
Upload to Bunny via URL method:
1. Download video to local server
2. Serve via nginx (public URL)
3. Tell Bunny to fetch from URL
4. Delete temp file
"""

import os
import sys
import time
import requests
from yt_dlp import YoutubeDL

BUNNY_API_KEY = "53c7d7fb-32c8-491e-aeffa1a04974-1412-4208"
BUNNY_LIBRARY_ID = "515326"
PUBLIC_URL_BASE = "https://keyani.me/temp"
TEMP_DIR = "/var/www/naber-anime-izle/temp"

def download_video(video_url, output_path):
    """Download video with yt-dlp + aria2c"""
    print(f"📥 Downloading video...")
    
    ydl_opts = {
        'outtmpl': output_path,
        'format': 'bestvideo[height=1080]+bestaudio/bestvideo+bestaudio/best',
        'quiet': False,
        'concurrent_fragment_downloads': 8,
        'http_chunk_size': 10485760,
        'retries': 10,
        'fragment_retries': 10,
    }
    
    # aria2c if available
    import shutil
    if shutil.which('aria2c'):
        print(f"⚡ Using aria2c (16 parallel connections)")
        ydl_opts['external_downloader'] = 'aria2c'
        ydl_opts['external_downloader_args'] = ['-x', '16', '-s', '16', '-k', '1M']
    
    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([video_url])
    
    file_size = os.path.getsize(output_path)
    print(f"✅ Downloaded: {file_size / (1024*1024):.2f} MB")
    return file_size

def upload_to_bunny_via_url(public_url, title, collection_id=None):
    """Tell Bunny to fetch video from URL"""
    print(f"📤 Telling Bunny to fetch from URL...")
    print(f"   URL: {public_url}")
    
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
        return None
    
    video_id = response.json().get("guid")
    print(f"✅ Video created: {video_id}")
    
    # 2. Fetch from URL
    fetch_payload = {"url": public_url}
    
    response = requests.post(
        f"https://video.bunnycdn.com/library/{BUNNY_LIBRARY_ID}/videos/{video_id}/fetch",
        headers={"AccessKey": BUNNY_API_KEY},
        json=fetch_payload
    )
    
    print(f"📡 Fetch response: {response.status_code}")
    print(f"   {response.text}")
    
    if response.status_code in [200, 201]:
        print(f"✅ Bunny is fetching the video!")
        return video_id
    else:
        print(f"❌ Fetch failed: {response.status_code}")
        return None

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 upload_via_url.py <video_url> <title> [collection_id]")
        sys.exit(1)
    
    video_url = sys.argv[1]
    title = sys.argv[2]
    collection_id = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Create temp dir
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    # Generate unique filename
    import hashlib
    filename = hashlib.md5(video_url.encode()).hexdigest() + ".mp4"
    local_path = os.path.join(TEMP_DIR, filename)
    public_url = f"{PUBLIC_URL_BASE}/{filename}"
    
    try:
        # 1. Download
        download_video(video_url, local_path)
        
        # 2. Upload via URL
        video_id = upload_to_bunny_via_url(public_url, title, collection_id)
        
        if video_id:
            print(f"\n✅ Success! Video ID: {video_id}")
            print(f"⏳ Bunny is now fetching the video...")
            print(f"💡 You can delete the temp file after a few minutes")
            print(f"   rm {local_path}")
        else:
            print(f"\n❌ Failed to upload")
            # Clean up
            os.remove(local_path)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        if os.path.exists(local_path):
            os.remove(local_path)

if __name__ == "__main__":
    main()
