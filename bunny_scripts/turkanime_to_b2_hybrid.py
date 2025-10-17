"""
Hybrid TurkAnime to B2 Uploader
Kendi PC'de video indir, Vast.ai'da encode et
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

# Vast.ai SSH bilgileri
VASTAI_HOST = "163.5.212.69"
VASTAI_PORT = "20647"
VASTAI_USER = "root"

def download_locally(anime_slug: str, episode: int) -> str:
    """Kendi PC'de video indir"""
    print(f"📥 {anime_slug} {episode}. bölüm indiriliyor...")
    
    import turkanime_api as ta
    
    anime = ta.Anime(anime_slug, parse_fansubs=True)
    bolum = anime.bolumler[episode - 1]
    
    # En iyi videoyu bul
    best_video = bolum.best_video(by_res=True)
    if not best_video:
        raise Exception("Video bulunamadı!")
    
    video_url = best_video.url
    
    # yt-dlp ile indir
    from yt_dlp import YoutubeDL
    
    output_dir = Path("temp_downloads")
    output_dir.mkdir(exist_ok=True)
    
    output_file = output_dir / f"{anime_slug}_ep{episode}.mp4"
    
    ydl_opts = {
        'outtmpl': str(output_file),
        'format': 'best',
        'quiet': False,
    }
    
    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([video_url])
    
    print(f"✅ İndirildi: {output_file}")
    return str(output_file)

def upload_to_vastai(local_file: str) -> str:
    """Vast.ai'a yükle"""
    print(f"📤 Vast.ai'a yükleniyor...")
    
    remote_path = f"/root/videos/{Path(local_file).name}"
    
    cmd = [
        "scp",
        "-P", VASTAI_PORT,
        local_file,
        f"{VASTAI_USER}@{VASTAI_HOST}:{remote_path}"
    ]
    
    subprocess.run(cmd, check=True)
    print(f"✅ Yüklendi: {remote_path}")
    return remote_path

def encode_on_vastai(remote_file: str, anime_slug: str, episode: int):
    """Vast.ai'da encode et ve B2'ye yükle"""
    print(f"🎬 Vast.ai'da encoding başlıyor...")
    
    # SSH ile komut çalıştır
    cmd = [
        "ssh",
        "-p", VASTAI_PORT,
        f"{VASTAI_USER}@{VASTAI_HOST}",
        f"python3 /root/encode_and_upload.py {remote_file} {anime_slug} {episode}"
    ]
    
    subprocess.run(cmd, check=True)
    print(f"✅ Encoding ve upload tamamlandı!")

def main():
    parser = argparse.ArgumentParser(description="Hybrid TurkAnime to B2")
    parser.add_argument("--anime", required=True, help="Anime slug")
    parser.add_argument("--start", type=int, default=1, help="Başlangıç bölümü")
    parser.add_argument("--end", type=int, required=True, help="Bitiş bölümü")
    
    args = parser.parse_args()
    
    for ep in range(args.start, args.end + 1):
        print(f"\n{'='*60}")
        print(f"Bölüm {ep}/{args.end}")
        print(f"{'='*60}\n")
        
        try:
            # 1. Kendi PC'de indir
            local_file = download_locally(args.anime, ep)
            
            # 2. Vast.ai'a yükle
            remote_file = upload_to_vastai(local_file)
            
            # 3. Vast.ai'da encode et
            encode_on_vastai(remote_file, args.anime, ep)
            
            # 4. Local dosyayı sil
            os.remove(local_file)
            print(f"🗑️ Local dosya silindi")
            
        except Exception as e:
            print(f"❌ Hata: {e}")
            continue

if __name__ == "__main__":
    main()
