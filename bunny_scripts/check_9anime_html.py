#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""9anime API'nin döndürdüğü HTML'i indir ve kaydet"""
import sys
import io
import requests

# Windows console encoding fix
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def check_9anime_html():
    url = "https://api.consumet.org/anime/9anime/top-airing?page=1"
    
    print(f"🔍 URL: {url}")
    print("📥 İstek gönderiliyor...\n")
    
    try:
        response = requests.get(url, timeout=10)
        
        print(f"✅ Status Code: {response.status_code}")
        print(f"📄 Content-Type: {response.headers.get('content-type', 'N/A')}")
        print(f"📏 Content Length: {len(response.text)} karakter\n")
        
        # HTML'i dosyaya kaydet
        with open('9anime_response.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        print("💾 Response 9anime_response.html dosyasına kaydedildi")
        
        # İlk 2000 karakteri göster
        print("\n" + "="*80)
        print("İLK 2000 KARAKTER:")
        print("="*80)
        print(response.text[:2000])
        print("="*80)
        
        # HTML içinde anahtar kelimeler ara
        print("\n🔍 HTML İçerik Analizi:")
        keywords = ['404', 'Not Found', 'Error', 'error', 'GitHub', 'Cloudflare', 'rate limit', 'blocked']
        for keyword in keywords:
            if keyword.lower() in response.text.lower():
                print(f"   ⚠️  '{keyword}' bulundu!")
        
    except Exception as e:
        print(f"❌ Hata: {str(e)}")

if __name__ == "__main__":
    check_9anime_html()
