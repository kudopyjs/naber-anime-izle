#!/usr/bin/env python3
"""
FastAPI backend - Anime streaming API
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import requests
import json
from pathlib import Path
from typing import Optional
import pysubs2
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Anime Streaming API")

# Consumet API URL (local veya public)
CONSUMET_BASE_URL = os.getenv("CONSUMET_API_URL", "http://localhost:3000")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Veri yükleme
DATABASE_FILE = Path("anime-database.json")
anime_database = []

@app.on_event("startup")
async def load_data():
    """Anime veritabanını yükle"""
    global anime_database
    if DATABASE_FILE.exists():
        with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
            anime_database = json.load(f)
        print(f"✅ {len(anime_database)} anime yüklendi")
    else:
        print("⚠️  anime-database.json bulunamadı!")


@app.get("/")
async def root():
    return {
        "message": "Anime Streaming API",
        "endpoints": {
            "anime_list": "/api/anime/list",
            "anime_detail": "/api/anime/{slug}",
            "episode_sources": "/api/anime/{slug}/episode/{number}",
            "video_proxy": "/api/proxy/video?url=...",
            "subtitle_translate": "/api/subtitle/translate?url=...&lang=tr"
        }
    }


@app.get("/api/anime/list")
async def get_anime_list(
    search: Optional[str] = None,
    limit: int = Query(50, le=500)
):
    """
    Anime listesi (Consumet/9anime)
    
    Args:
        search: Arama terimi
        limit: Maksimum sonuç sayısı
    """
    results = anime_database.copy()
    
    # Arama filtresi
    if search:
        search_lower = search.lower()
        results = [
            anime for anime in results
            if search_lower in anime['title'].lower()
        ]
    
    # Limit
    results = results[:limit]
    
    return {
        "total": len(results),
        "results": results
    }


@app.get("/api/anime/{slug}")
async def get_anime_detail(slug: str):
    """Anime detayı"""
    anime = next((a for a in anime_database if a['id'] == slug), None)
    
    if not anime:
        raise HTTPException(status_code=404, detail="Anime bulunamadı")
    
    return anime


@app.get("/api/anime/{slug}/episode/{episode_number}")
async def get_episode_sources(slug: str, episode_number: int):
    """
    Bölüm video kaynakları (Consumet/9anime)
    
    Returns:
        {
            "sources": [...],  # Video kaynakları
            "subtitles": [...]  # Altyazılar
        }
    """
    anime = next((a for a in anime_database if a['id'] == slug), None)
    
    if not anime:
        raise HTTPException(status_code=404, detail="Anime bulunamadı")
    
    sources = []
    subtitles = []
    
    try:
        # Anime detayını al
        info_response = requests.get(f"{CONSUMET_BASE_URL}/anime/gogoanime/info/{slug}")
        info_data = info_response.json()
        
        # Bölümü bul
        episodes = info_data.get('episodes', [])
        episode = next((e for e in episodes if e['number'] == episode_number), None)
        
        if not episode:
            raise HTTPException(status_code=404, detail="Bölüm bulunamadı")
        
        # Video kaynaklarını al
        watch_response = requests.get(f"{CONSUMET_BASE_URL}/anime/gogoanime/watch/{episode['id']}")
        watch_data = watch_response.json()
        
        # Video kaynakları
        for video_source in watch_data.get('sources', []):
            sources.append({
                "provider": "gogoanime",
                "url": video_source['url'],
                "quality": video_source.get('quality', 'default'),
                "player": "HLS",
                "language": "english",
                "subtitle": "soft",
                "type": "m3u8"
            })
        
        # Altyazılar
        for subtitle in watch_data.get('subtitles', []):
            subtitles.append({
                "lang": subtitle['lang'],
                "url": subtitle['url'],
                "type": "original"
            })
            
            # AI çeviri linki ekle (İngilizce altyazılar için)
            if subtitle['lang'].lower() == 'english':
                subtitles.append({
                    "lang": "Turkish",
                    "url": f"/api/subtitle/translate?url={subtitle['url']}&lang=tr",
                    "type": "AI-Translated"
                })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Consumet API hatası: {str(e)}")
    
    return {
        "anime": anime['title'],
        "episode": episode_number,
        "sources": sources,
        "subtitles": subtitles
    }


@app.get("/api/proxy/video")
async def proxy_video(url: str):
    """Video proxy (CORS bypass)"""
    try:
        response = requests.get(url, stream=True)
        return Response(
            content=response.content,
            media_type=response.headers.get('content-type', 'video/mp4'),
            headers={
                "Access-Control-Allow-Origin": "*"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/subtitle/translate")
async def translate_subtitle(url: str, lang: str = "tr"):
    """
    Altyazı çevirisi (AI)
    
    Args:
        url: Altyazı dosyası URL'si
        lang: Hedef dil (tr, en, vb.)
    """
    try:
        # Altyazı dosyasını indir
        response = requests.get(url)
        subtitle_content = response.text
        
        # Parse et
        subs = pysubs2.SSAFile.from_string(subtitle_content)
        
        # Tüm altyazıları birleştir (kontekst korusun)
        lines = []
        for idx, line in enumerate(subs):
            lines.append(f"[{idx}] {line.text}")
        
        combined_text = "\n".join(lines)
        
        # AI ile çevir
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": f"Sen bir anime altyazı çevirmenisin. Verilen altyazıları {lang} diline çevir. Her satırın başındaki [index] numarasını koru. Sadece çeviriyi döndür, açıklama yapma."
                },
                {
                    "role": "user",
                    "content": combined_text
                }
            ],
            temperature=0.3
        )
        
        translated_text = response.choices[0].message.content
        
        # Index'lere göre ayır
        translated_lines = {}
        for line in translated_text.split('\n'):
            if line.strip() and '[' in line and ']' in line:
                try:
                    idx = int(line.split('[')[1].split(']')[0])
                    text = line.split(']', 1)[1].strip()
                    translated_lines[idx] = text
                except:
                    continue
        
        # Orijinal timing'leri koru, sadece metni değiştir
        for idx, line in enumerate(subs):
            if idx in translated_lines:
                line.text = translated_lines[idx]
        
        # VTT formatında döndür
        vtt_content = subs.to_string('vtt')
        
        return Response(
            content=vtt_content,
            media_type="text/vtt",
            headers={
                "Content-Disposition": f"inline; filename=subtitle_{lang}.vtt"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Çeviri hatası: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
