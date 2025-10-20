#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""9anime API'yi test et"""
import sys
import io
import requests
import json

# Windows console encoding fix
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def test_9anime():
    base_url = "https://api.consumet.org/anime/9anime"
    
    print("🔍 9anime API Test Ediliyor...\n")
    
    # Test 1: Top Airing
    print("1️⃣ Top Airing Test:")
    try:
        response = requests.get(f"{base_url}/top-airing?page=1", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
        print(f"   Response ilk 500 karakter:\n   {response.text[:500]}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Başarılı! {len(data.get('results', []))} anime bulundu")
            if data.get('results'):
                print(f"   İlk anime: {data['results'][0].get('title', 'N/A')}")
        else:
            print(f"   ❌ Hata: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 2: Recent Episodes
    print("\n2️⃣ Recent Episodes Test:")
    try:
        response = requests.get(f"{base_url}/recent-episodes?page=1", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Başarılı! {len(data.get('results', []))} bölüm bulundu")
        else:
            print(f"   ❌ Hata: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 3: GogoAnime (alternatif)
    print("\n3️⃣ GogoAnime (Alternatif) Test:")
    try:
        response = requests.get("https://api.consumet.org/anime/gogoanime/top-airing?page=1", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Başarılı! {len(data.get('results', []))} anime bulundu")
            if data.get('results'):
                print(f"   İlk anime: {data['results'][0].get('title', 'N/A')}")
        else:
            print(f"   ❌ Hata: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")

if __name__ == "__main__":
    test_9anime()
