#!/usr/bin/env python3
"""
Test Bunny API upload methods
"""

import requests
import sys

BUNNY_API_KEY = "53c7d7fb-32c8-491e-aeffa1a04974-1412-4208"
BUNNY_LIBRARY_ID = "515326"

# Test 1: Check video info
video_id = sys.argv[1] if len(sys.argv) > 1 else None

if video_id:
    print(f"🔍 Checking video: {video_id}")
    response = requests.get(
        f"https://video.bunnycdn.com/library/{BUNNY_LIBRARY_ID}/videos/{video_id}",
        headers={"AccessKey": BUNNY_API_KEY}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Title: {data.get('title')}")
        print(f"Status: {data.get('status')}")
        print(f"Available Resolutions: {data.get('availableResolutions')}")
        print(f"Storage Size: {data.get('storageSize')} bytes")
        print(f"Encode Progress: {data.get('encodeProgress')}%")
        print(f"\nFull response:")
        import json
        print(json.dumps(data, indent=2))
else:
    print("Usage: python3 test_bunny_api.py <video_id>")
    print("\nAlternatively, checking library info...")
    
    response = requests.get(
        f"https://video.bunnycdn.com/library/{BUNNY_LIBRARY_ID}",
        headers={"AccessKey": BUNNY_API_KEY}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Library Name: {data.get('Name')}")
        print(f"Storage Used: {data.get('StorageUsed')} bytes")
        print(f"Traffic Used: {data.get('TrafficUsed')} bytes")
        print(f"Video Count: {data.get('VideoCount')}")
