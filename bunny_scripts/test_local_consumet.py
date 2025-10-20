#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Local Consumet API'yi test et"""
import sys
import io
import requests
import json

# Windows console encoding fix
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def test_local_api():
    base_url = "http://localhost:3000"
    
    print("🔍 Local Consumet API Test\n")
    
    # Test 1: Root endpoint
    print("1️⃣ Root Endpoint:")
    try:
        response = requests.get(base_url, timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}\n")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}\n")
    
    # Test 2: GogoAnime top airing
    print("2️⃣ GogoAnime Top Airing:")
    try:
        response = requests.get(f"{base_url}/anime/gogoanime/top-airing?page=1", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Başarılı!")
            print(f"   Sonuç sayısı: {len(data.get('results', []))}")
            
            if data.get('results'):
                first = data['results'][0]
                print(f"   İlk anime: {first.get('title', 'N/A')}")
                print(f"   ID: {first.get('id', 'N/A')}")
        else:
            print(f"   ❌ Hata: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test 3: 9anime top airing
    print("\n3️⃣ 9anime Top Airing:")
    try:
        response = requests.get(f"{base_url}/anime/9anime/top-airing?page=1", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Başarılı!")
            print(f"   Sonuç sayısı: {len(data.get('results', []))}")
            
            if data.get('results'):
                first = data['results'][0]
                print(f"   İlk anime: {first.get('title', 'N/A')}")
        else:
            print(f"   ❌ Hata: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    test_local_api()
