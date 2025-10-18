#!/usr/bin/env python3
"""
Test multipart/chunked upload to Bunny
Upload file in small chunks (like .ts segments)
"""

import os
import requests
import time

BUNNY_API_KEY = "53c7d7fb-32c8-491e-aeffa1a04974-1412-4208"
BUNNY_LIBRARY_ID = "515326"
VIDEO_ID = "test-video-id"  # Replace with actual video ID

def upload_in_chunks(file_path, video_id, chunk_size=5*1024*1024):
    """Upload file in chunks (like .ts segments)"""
    
    file_size = os.path.getsize(file_path)
    url = f"https://video.bunnycdn.com/library/{BUNNY_LIBRARY_ID}/videos/{video_id}"
    
    print(f"📦 File size: {file_size / (1024*1024):.2f} MB")
    print(f"📦 Chunk size: {chunk_size / (1024*1024):.2f} MB")
    print(f"📦 Total chunks: {(file_size + chunk_size - 1) // chunk_size}")
    
    start_time = time.time()
    uploaded = 0
    
    with open(file_path, 'rb') as f:
        chunk_num = 0
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            
            chunk_num += 1
            chunk_start = uploaded
            chunk_end = uploaded + len(chunk) - 1
            
            print(f"\n📤 Chunk {chunk_num}: {chunk_start}-{chunk_end}/{file_size-1}")
            
            # Upload chunk with range header
            headers = {
                'AccessKey': BUNNY_API_KEY,
                'Content-Type': 'application/octet-stream',
                'Content-Range': f'bytes {chunk_start}-{chunk_end}/{file_size}'
            }
            
            response = requests.put(
                url,
                headers=headers,
                data=chunk
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code not in [200, 201, 206]:
                print(f"   ❌ Error: {response.text}")
                return False
            
            uploaded += len(chunk)
            progress = (uploaded / file_size) * 100
            elapsed = time.time() - start_time
            speed = (uploaded / (1024*1024)) / elapsed if elapsed > 0 else 0
            
            print(f"   ✅ Progress: {progress:.1f}% | Speed: {speed:.2f} MB/s")
    
    elapsed = time.time() - start_time
    speed = (file_size / (1024*1024)) / elapsed if elapsed > 0 else 0
    print(f"\n✅ Upload complete! ({elapsed:.1f}s, {speed:.2f} MB/s)")
    return True

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python3 test_multipart_upload.py <video_id> <file_path>")
        sys.exit(1)
    
    video_id = sys.argv[1]
    file_path = sys.argv[2]
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    # Test with 5MB chunks (like .ts segments)
    upload_in_chunks(file_path, video_id, chunk_size=5*1024*1024)
