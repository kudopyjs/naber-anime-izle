"""
TurkAnime Video URL'lerini Al (Kendi PC'de çalıştır)
Sonra URL'leri Vast.ai'a gönder
"""

import sys
import json
import argparse

try:
    import turkanime_api as ta
except ImportError:
    print("❌ turkanime-cli kurulu değil!")
    print("Kurulum: pip install turkanime-cli")
    sys.exit(1)

def get_video_urls(anime_slug: str, start_ep: int, end_ep: int):
    """Video URL'lerini al"""
    
    print(f"🔍 {anime_slug} için URL'ler alınıyor...")
    
    anime = ta.Anime(anime_slug, parse_fansubs=True)
    print(f"✅ Anime: {anime.title}")
    print(f"📊 Toplam bölüm: {len(anime.bolumler)}")
    
    results = []
    
    for i in range(start_ep - 1, min(end_ep, len(anime.bolumler))):
        bolum = anime.bolumler[i]
        ep_num = i + 1
        
        print(f"\n[{ep_num}] {bolum.title}")
        
        try:
            # En iyi videoyu bul
            best_video = bolum.best_video(by_res=True)
            
            if not best_video:
                print("  ⚠️ Video bulunamadı")
                continue
            
            video_url = best_video.url
            
            if not video_url:
                print("  ⚠️ URL alınamadı")
                continue
            
            print(f"  ✅ {best_video.player} - {best_video.fansub}")
            print(f"  🔗 {video_url[:80]}...")
            
            results.append({
                "episode": ep_num,
                "title": bolum.title,
                "url": video_url,
                "player": best_video.player,
                "fansub": best_video.fansub
            })
            
        except Exception as e:
            print(f"  ❌ Hata: {e}")
            continue
    
    return {
        "anime": anime_slug,
        "anime_title": anime.title,
        "episodes": results
    }

def main():
    parser = argparse.ArgumentParser(description="TurkAnime Video URL Getter")
    parser.add_argument("--anime", required=True, help="Anime slug")
    parser.add_argument("--start", type=int, default=1, help="Başlangıç bölümü")
    parser.add_argument("--end", type=int, required=True, help="Bitiş bölümü")
    parser.add_argument("--output", default="video_urls.json", help="Output JSON dosyası")
    
    args = parser.parse_args()
    
    # URL'leri al
    data = get_video_urls(args.anime, args.start, args.end)
    
    # JSON'a kaydet
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ {len(data['episodes'])} bölüm URL'si kaydedildi: {args.output}")
    print(f"\nŞimdi bu dosyayı Vast.ai'a yükle:")
    print(f"  scp -P 20647 {args.output} root@163.5.212.69:/root/")

if __name__ == "__main__":
    main()
