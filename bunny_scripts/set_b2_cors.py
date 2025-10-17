#!/usr/bin/env python3
"""
Backblaze B2 CORS kurallarını ayarla
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

# B2 credentials
KEY_ID = os.getenv('VITE_B2_KEY_ID')
APP_KEY = os.getenv('VITE_B2_APPLICATION_KEY')
BUCKET_ID = os.getenv('VITE_B2_BUCKET_ID')

def authorize_account():
    """B2 hesabını authorize et"""
    url = 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account'
    
    response = requests.get(
        url,
        auth=(KEY_ID, APP_KEY)
    )
    
    if response.status_code != 200:
        raise Exception(f"Authorization failed: {response.text}")
    
    return response.json()

def update_bucket_cors(auth_data):
    """Bucket CORS kurallarını güncelle"""
    
    cors_rules = [
        {
            "corsRuleName": "allowAll",
            "allowedOrigins": [
                "*"  # Tüm domain'lere izin ver (geliştirme için)
            ],
            "allowedOperations": [
                "b2_download_file_by_name",
                "b2_download_file_by_id"
            ],
            "allowedHeaders": ["*"],
            "exposeHeaders": ["x-bz-content-sha1"],
            "maxAgeSeconds": 3600
        }
    ]
    
    url = f"{auth_data['apiUrl']}/b2api/v2/b2_update_bucket"
    
    headers = {
        'Authorization': auth_data['authorizationToken']
    }
    
    data = {
        'accountId': auth_data['accountId'],
        'bucketId': BUCKET_ID,
        'corsRules': cors_rules
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code != 200:
        raise Exception(f"CORS update failed: {response.text}")
    
    return response.json()

def main():
    print("Backblaze B2 CORS Ayarlari")
    print("=" * 60)
    
    # Authorize
    print("\n[1] B2 hesabi authorize ediliyor...")
    auth_data = authorize_account()
    print(f"   OK - Authorized: {auth_data['accountId']}")
    
    # Update CORS
    print("\n[2] CORS kurallari guncelleniyor...")
    result = update_bucket_cors(auth_data)
    print(f"   OK - CORS updated for bucket: {result['bucketName']}")
    
    # Show CORS rules
    print("\nAktif CORS Kurallari:")
    print(json.dumps(result.get('corsRules', []), indent=2))
    
    print("\n" + "=" * 60)
    print("BASARILI! CORS ayarlari guncellendi!")
    print("\nSimdi bu URL'leri test edebilirsin:")
    print("   - http://localhost:5173/watch-b2/one-piece/1/36")
    print("   - https://yourdomain.com/watch-b2/one-piece/1/36")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\nHATA: {e}")
        exit(1)
