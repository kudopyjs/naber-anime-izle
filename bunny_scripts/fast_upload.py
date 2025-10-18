#!/usr/bin/env python3
"""
Fast upload using pycurl (C library, much faster than requests)
"""

import pycurl
import os
import sys
import time
from io import BytesIO

def upload_with_pycurl(file_path, video_id, api_key, library_id):
    """Upload file using pycurl for maximum speed"""
    
    file_size = os.path.getsize(file_path)
    url = f"https://video.bunnycdn.com/library/{library_id}/videos/{video_id}"
    
    print(f"📦 File size: {file_size / (1024*1024):.2f} MB")
    print(f"🚀 Uploading with pycurl (C library)...")
    
    # Progress callback
    start_time = time.time()
    last_progress = [0]
    
    def progress_callback(download_total, downloaded, upload_total, uploaded):
        if upload_total > 0:
            progress = (uploaded / upload_total) * 100
            if progress - last_progress[0] >= 5 or uploaded == upload_total:
                elapsed = time.time() - start_time
                speed = (uploaded / (1024*1024)) / elapsed if elapsed > 0 else 0
                print(f"  [{progress:.0f}%] {uploaded / (1024*1024):.1f}/{upload_total / (1024*1024):.1f} MB ({speed:.2f} MB/s)", flush=True)
                last_progress[0] = progress
    
    # Setup curl
    c = pycurl.Curl()
    c.setopt(pycurl.URL, url)
    c.setopt(pycurl.UPLOAD, 1)
    c.setopt(pycurl.READDATA, open(file_path, 'rb'))
    c.setopt(pycurl.INFILESIZE, file_size)
    c.setopt(pycurl.HTTPHEADER, [
        f"AccessKey: {api_key}",
        "Content-Type: application/octet-stream"
    ])
    c.setopt(pycurl.NOPROGRESS, 0)
    c.setopt(pycurl.XFERINFOFUNCTION, progress_callback)
    c.setopt(pycurl.WRITEDATA, BytesIO())
    
    # Optimize for speed
    c.setopt(pycurl.TCP_NODELAY, 1)
    c.setopt(pycurl.BUFFERSIZE, 16 * 1024 * 1024)  # 16MB buffer
    
    try:
        c.perform()
        status_code = c.getinfo(pycurl.RESPONSE_CODE)
        
        elapsed = time.time() - start_time
        speed = (file_size / (1024*1024)) / elapsed if elapsed > 0 else 0
        
        print(f"\n✅ Upload complete!")
        print(f"   Status: {status_code}")
        print(f"   Time: {elapsed:.1f}s")
        print(f"   Speed: {speed:.2f} MB/s")
        
        return status_code == 200
        
    except pycurl.error as e:
        print(f"❌ Upload failed: {e}")
        return False
    finally:
        c.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 fast_upload.py <video_id> <file_path>")
        sys.exit(1)
    
    video_id = sys.argv[1]
    file_path = sys.argv[2]
    api_key = "53c7d7fb-32c8-491e-aeffa1a04974-1412-4208"
    library_id = "515326"
    
    success = upload_with_pycurl(file_path, video_id, api_key, library_id)
    sys.exit(0 if success else 1)
