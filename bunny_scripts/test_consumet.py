#!/usr/bin/env python3
"""
Consumet API test
"""
import sys
import io
import requests

# Windows console encoding fix
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

BASE_URL = "https://api.consumet.org/anime/gogoanime"

print("🔍 Consumet API test...")
print(f"Base URL: {BASE_URL}\n")

# Test 1: Anime ara
print("1️⃣ Anime arama testi (Naruto):")
try:
    response = requests.get(f"{BASE_URL}/naruto")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}...")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Sonuç sayısı: {len(data.get('results', []))}")
except Exception as e:
    print(f"❌ Hata: {e}")

print("\n" + "="*50 + "\n")

# Test 2: Top airing
print("2️⃣ Top airing testi:")
try:
    response = requests.get(f"{BASE_URL}/top-airing")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}...")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Sonuç sayısı: {len(data.get('results', []))}")
except Exception as e:
    print(f"❌ Hata: {e}")

print("\n" + "="*50 + "\n")

# Test 3: Recent episodes
print("3️⃣ Recent episodes testi:")
try:
    response = requests.get(f"{BASE_URL}/recent-episodes")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}...")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Sonuç sayısı: {len(data.get('results', []))}")
except Exception as e:
    print(f"❌ Hata: {e}")
