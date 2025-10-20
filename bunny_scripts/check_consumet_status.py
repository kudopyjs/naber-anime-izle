#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Consumet API'nin gerçek durumunu kontrol et"""
import sys
import io
import requests

# Windows console encoding fix
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def check_api_status():
    """Farklı Consumet endpoint'lerini test et"""
    
    endpoints = [
        ("Public API Root", "https://api.consumet.org"),
        ("9anime Top Airing", "https://api.consumet.org/anime/9anime/top-airing?page=1"),
        ("GogoAnime Top Airing", "https://api.consumet.org/anime/gogoanime/top-airing?page=1"),
        ("Alternative API", "https://consumet-api.herokuapp.com/anime/gogoanime/top-airing?page=1"),
        ("Docs", "https://docs.consumet.org"),
    ]
    
    print("🔍 Consumet API Durum Kontrolü\n")
    print("="*80)
    
    for name, url in endpoints:
        print(f"\n📍 {name}")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=10, allow_redirects=False)
            
            print(f"   Status: {response.status_code}")
            print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
            
            # Redirect kontrolü
            if 'location' in response.headers:
                print(f"   🔀 Redirect: {response.headers['location']}")
            
            # İçerik analizi
            content_preview = response.text[:200].replace('\n', ' ')
            print(f"   Preview: {content_preview}...")
            
            # JSON kontrolü
            if 'application/json' in response.headers.get('content-type', ''):
                try:
                    data = response.json()
                    print(f"   ✅ Valid JSON! Keys: {list(data.keys())[:5]}")
                except:
                    print(f"   ❌ Invalid JSON")
            elif 'text/html' in response.headers.get('content-type', ''):
                print(f"   ⚠️  HTML döndü (API çalışmıyor)")
                
        except requests.exceptions.Timeout:
            print(f"   ⏱️  Timeout")
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection Error")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "="*80)
    print("\n💡 Sonuç:")
    print("   Eğer tüm endpoint'ler HTML döndürüyorsa, public API kapatılmış demektir.")
    print("   Alternatif: Kendi Consumet instance'ınızı Docker ile çalıştırın.")

if __name__ == "__main__":
    check_api_status()
