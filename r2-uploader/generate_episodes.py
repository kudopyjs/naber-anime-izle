"""
Generate episodes.json from Aniwatch API
Fetches popular anime and creates episode list for batch upload
"""
import os
import sys
import json
import requests
from dotenv import load_dotenv

# Fix Windows encoding for emojis
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()


class EpisodeGenerator:
    def __init__(self):
        self.api_url = os.getenv("ANIWATCH_API_URL", "http://localhost:4000")
    
    def get_trending_anime(self, page=1):
        """Get trending anime from Aniwatch API"""
        try:
            url = f"{self.api_url}/api/v2/hianime/home"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == 200:
                return data.get("data", {})
            
            return None
        except Exception as e:
            print(f"❌ Error fetching trending anime: {e}")
            return None
    
    def get_anime_episodes(self, anime_id):
        """Get all episodes for an anime"""
        try:
            url = f"{self.api_url}/api/v2/hianime/anime/{anime_id}/episodes"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == 200:
                return data.get("data", {}).get("episodes", [])
            
            return []
        except Exception as e:
            print(f"❌ Error fetching episodes for {anime_id}: {e}")
            return []
    
    def generate_episode_list(self, anime_list, max_episodes_per_anime=5):
        """
        Generate episode list from anime list
        
        Args:
            anime_list: List of anime objects
            max_episodes_per_anime: Maximum episodes to include per anime (default: 5)
        
        Returns:
            List of episode objects for episodes.json
        """
        episodes = []
        
        for anime in anime_list:
            anime_id = anime.get("id")
            anime_name = anime.get("name", "Unknown")
            
            print(f"\n📺 Processing: {anime_name}")
            print(f"   ID: {anime_id}")
            
            # Get episodes
            anime_episodes = self.get_anime_episodes(anime_id)
            
            if not anime_episodes:
                print(f"   ⚠️ No episodes found")
                continue
            
            total_episodes = len(anime_episodes)
            print(f"   📊 Total episodes: {total_episodes}")
            
            # Limit episodes
            episodes_to_add = anime_episodes[:max_episodes_per_anime]
            print(f"   ✅ Adding first {len(episodes_to_add)} episodes")
            
            for ep in episodes_to_add:
                episodes.append({
                    "anime_slug": anime_id,
                    "anime_name": anime_name,
                    "episode_id": ep.get("episodeId"),
                    "episode_number": ep.get("number"),
                    "episode_title": ep.get("title", "")
                })
        
        return episodes
    
    def save_to_json(self, episodes, filename="episodes.json"):
        """Save episodes to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(episodes, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Saved {len(episodes)} episodes to {filename}")
            return True
        except Exception as e:
            print(f"❌ Error saving to JSON: {e}")
            return False
    
    def generate_from_trending(self, category="trending", max_anime=5, max_episodes_per_anime=5):
        """
        Generate episodes.json from trending anime
        
        Args:
            category: "trending", "popular", "top-airing" (default: "trending")
            max_anime: Maximum number of anime to process (default: 5)
            max_episodes_per_anime: Max episodes per anime (default: 5)
        """
        print("="*60)
        print("🎬 Episode List Generator")
        print("="*60)
        print(f"\nSettings:")
        print(f"  Category: {category}")
        print(f"  Max Anime: {max_anime}")
        print(f"  Max Episodes per Anime: {max_episodes_per_anime}")
        print("="*60)
        
        # Get trending anime
        print(f"\n📡 Fetching {category} anime from Aniwatch API...")
        home_data = self.get_trending_anime()
        
        if not home_data:
            print("❌ Failed to fetch anime data")
            return []
        
        # Get anime list based on category
        anime_list = []
        if category == "trending":
            anime_list = home_data.get("trendingAnimes", [])
        elif category == "popular":
            anime_list = home_data.get("mostPopularAnimes", [])
        elif category == "top-airing":
            anime_list = home_data.get("topAiringAnimes", [])
        else:
            print(f"❌ Unknown category: {category}")
            return []
        
        if not anime_list:
            print(f"❌ No anime found in {category}")
            return []
        
        print(f"✅ Found {len(anime_list)} anime in {category}")
        
        # Limit anime count
        anime_list = anime_list[:max_anime]
        print(f"📊 Processing {len(anime_list)} anime...")
        
        # Generate episode list
        episodes = self.generate_episode_list(anime_list, max_episodes_per_anime)
        
        print("\n" + "="*60)
        print(f"✅ Generated {len(episodes)} episodes from {len(anime_list)} anime")
        print("="*60)
        
        return episodes
    
    def generate_from_specific_anime(self, anime_ids, max_episodes_per_anime=10):
        """
        Generate episodes.json from specific anime IDs
        
        Args:
            anime_ids: List of anime IDs (slugs)
            max_episodes_per_anime: Max episodes per anime
        """
        print("="*60)
        print("🎬 Episode List Generator (Specific Anime)")
        print("="*60)
        
        episodes = []
        
        for anime_id in anime_ids:
            print(f"\n📺 Processing: {anime_id}")
            
            anime_episodes = self.get_anime_episodes(anime_id)
            
            if not anime_episodes:
                print(f"   ⚠️ No episodes found")
                continue
            
            total_episodes = len(anime_episodes)
            print(f"   📊 Total episodes: {total_episodes}")
            
            episodes_to_add = anime_episodes[:max_episodes_per_anime]
            print(f"   ✅ Adding first {len(episodes_to_add)} episodes")
            
            for ep in episodes_to_add:
                episodes.append({
                    "anime_slug": anime_id,
                    "episode_id": ep.get("episodeId"),
                    "episode_number": ep.get("number"),
                    "episode_title": ep.get("title", "")
                })
        
        print("\n" + "="*60)
        print(f"✅ Generated {len(episodes)} episodes")
        print("="*60)
        
        return episodes


def main():
    """CLI Interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate episodes.json from Aniwatch API')
    parser.add_argument('--mode', choices=['trending', 'popular', 'top-airing', 'quick'], 
                       default='quick', help='Generation mode (default: quick)')
    parser.add_argument('--max-anime', type=int, default=5, 
                       help='Maximum anime to process (default: 5)')
    parser.add_argument('--max-episodes', type=int, default=3, 
                       help='Maximum episodes per anime (default: 3)')
    parser.add_argument('--output', default='episodes.json', 
                       help='Output filename (default: episodes.json)')
    parser.add_argument('--interactive', action='store_true', 
                       help='Interactive mode')
    
    args = parser.parse_args()
    generator = EpisodeGenerator()
    
    # Interactive mode
    if args.interactive:
        print("\n🎯 Episode List Generator")
        print("\nOptions:")
        print("  1. Generate from Trending Anime")
        print("  2. Generate from Popular Anime")
        print("  3. Generate from Top Airing Anime")
        print("  4. Generate from Specific Anime IDs")
        print("  5. Quick Generate (5 trending anime, 3 episodes each)")
        
        choice = input("\nSelect option (1-5): ").strip()
    else:
        # Non-interactive mode
        if args.mode == 'quick':
            choice = '5'
        elif args.mode == 'trending':
            choice = '1'
        elif args.mode == 'popular':
            choice = '2'
        elif args.mode == 'top-airing':
            choice = '3'
        else:
            choice = '5'
    
    episodes = []
    
    if choice == "1":
        if args.interactive:
            max_anime = int(input("How many anime? (default: 5): ") or "5")
            max_episodes = int(input("Episodes per anime? (default: 5): ") or "5")
        else:
            max_anime = args.max_anime
            max_episodes = args.max_episodes
        episodes = generator.generate_from_trending("trending", max_anime, max_episodes)
    
    elif choice == "2":
        if args.interactive:
            max_anime = int(input("How many anime? (default: 5): ") or "5")
            max_episodes = int(input("Episodes per anime? (default: 5): ") or "5")
        else:
            max_anime = args.max_anime
            max_episodes = args.max_episodes
        episodes = generator.generate_from_trending("popular", max_anime, max_episodes)
    
    elif choice == "3":
        if args.interactive:
            max_anime = int(input("How many anime? (default: 5): ") or "5")
            max_episodes = int(input("Episodes per anime? (default: 5): ") or "5")
        else:
            max_anime = args.max_anime
            max_episodes = args.max_episodes
        episodes = generator.generate_from_trending("top-airing", max_anime, max_episodes)
    
    elif choice == "4":
        if not args.interactive:
            print("❌ Specific anime IDs mode requires --interactive")
            return
        
        print("\nEnter anime IDs (slugs), one per line. Empty line to finish:")
        anime_ids = []
        while True:
            anime_id = input("Anime ID: ").strip()
            if not anime_id:
                break
            anime_ids.append(anime_id)
        
        if anime_ids:
            max_episodes = int(input("Episodes per anime? (default: 10): ") or "10")
            episodes = generator.generate_from_specific_anime(anime_ids, max_episodes)
    
    elif choice == "5":
        # Quick generate
        episodes = generator.generate_from_trending("trending", args.max_anime, args.max_episodes)
    
    else:
        print("❌ Invalid option")
        return
    
    if episodes:
        # Save to JSON
        if args.interactive:
            filename = input("\nSave as (default: episodes.json): ").strip() or "episodes.json"
        else:
            filename = args.output
        generator.save_to_json(episodes, filename)
        
        # Show summary
        print("\n📋 Summary:")
        anime_count = len(set(ep["anime_slug"] for ep in episodes))
        print(f"  Total Anime: {anime_count}")
        print(f"  Total Episodes: {len(episodes)}")
        
        # Show first few
        print("\n📺 First 5 episodes:")
        for ep in episodes[:5]:
            print(f"  - {ep['anime_slug']} Episode {ep['episode_number']}")
        
        if len(episodes) > 5:
            print(f"  ... and {len(episodes) - 5} more")
        
        print(f"\n✅ Ready to upload! Run: python batch_upload.py")
    else:
        print("\n❌ No episodes generated")


if __name__ == "__main__":
    main()
