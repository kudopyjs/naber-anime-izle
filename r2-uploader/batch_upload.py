"""
Batch Upload Script
Upload multiple episodes at once
"""
import json
import time
import sys
from main import AnimeToR2Pipeline
from pathlib import Path

# Fix Windows encoding for emojis
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def load_episodes_from_json(file_path):
    """Load episodes from JSON file"""
    with open(file_path, 'r') as f:
        return json.load(f)


def create_episode_list(anime_slug, start_ep, end_ep):
    """Create episode list for a range"""
    episodes = []
    for i in range(start_ep, end_ep + 1):
        episodes.append({
            "anime_slug": anime_slug,
            "episode_id": str(i),
            "episode_number": i
        })
    return episodes


def batch_upload_with_delay(episodes, delay_seconds=5):
    """
    Upload episodes with delay between each
    Prevents rate limiting
    """
    pipeline = AnimeToR2Pipeline()
    results = []
    
    total = len(episodes)
    print(f"\n🚀 Starting batch upload: {total} episodes")
    print(f"⏱️ Delay between uploads: {delay_seconds}s\n")
    
    for idx, ep in enumerate(episodes, 1):
        print(f"\n{'='*60}")
        print(f"📊 Progress: {idx}/{total}")
        print(f"{'='*60}")
        
        result = pipeline.process_episode(
            ep["anime_slug"],
            ep["episode_id"],
            ep["episode_number"]
        )
        
        results.append({
            **ep,
            **result
        })
        
        # Save progress after each upload
        save_results(results)
        
        # Delay before next upload (except for last one)
        if idx < total:
            print(f"\n⏳ Waiting {delay_seconds}s before next upload...")
            time.sleep(delay_seconds)
    
    print(f"\n{'='*60}")
    print(f"✅ BATCH UPLOAD COMPLETED!")
    print(f"📊 Total: {total} episodes")
    print(f"✅ Success: {sum(1 for r in results if r.get('success'))}")
    print(f"❌ Failed: {sum(1 for r in results if not r.get('success'))}")
    print(f"{'='*60}\n")
    
    return results


def save_results(results, filename="batch_results.json"):
    """Save results to JSON file"""
    output_file = Path(filename)
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"💾 Results saved to: {output_file}")


def main():
    """Main batch upload"""
    import sys
    
    # Check if episodes.json exists
    episodes_file = Path("episodes.json")
    
    if episodes_file.exists():
        print("📁 Found episodes.json")
        print("Loading episodes from file...\n")
        episodes = load_episodes_from_json("episodes.json")
    else:
        print("⚠️ episodes.json not found")
        print("Run 'python generate_episodes.py' first to create it")
        print("\nOr create episodes manually:")
        print("  Example: Upload One Piece episodes 1-5")
        
        # Fallback: Create example episodes
        episodes = create_episode_list(
            anime_slug="one-piece-100",
            start_ep=1,
            end_ep=5
        )
        print(f"\n📊 Using example: {len(episodes)} episodes")
    
    if not episodes:
        print("❌ No episodes to upload")
        sys.exit(1)
    
    # Show what will be uploaded
    print(f"\n📋 Episodes to upload:")
    anime_groups = {}
    for ep in episodes:
        slug = ep['anime_slug']
        if slug not in anime_groups:
            anime_groups[slug] = []
        anime_groups[slug].append(ep['episode_number'])
    
    for slug, ep_numbers in anime_groups.items():
        print(f"  📺 {slug}: Episodes {min(ep_numbers)}-{max(ep_numbers)} ({len(ep_numbers)} total)")
    
    print(f"\n📊 Total: {len(episodes)} episodes")
    
    # Confirm
    confirm = input("\n⚠️ Start upload? (y/n): ").strip().lower()
    if confirm != 'y':
        print("❌ Upload cancelled")
        sys.exit(0)
    
    # Upload with delay
    delay = int(input("Delay between uploads (seconds, default: 10): ").strip() or "10")
    results = batch_upload_with_delay(episodes, delay_seconds=delay)
    
    # Print summary
    print("\n" + "="*60)
    print("📋 Upload Summary:")
    print("="*60)
    
    for result in results:
        status = "✅" if result.get("success") else "❌"
        anime_name = result.get('anime_name', result['anime_slug'])
        print(f"{status} {anime_name} - Episode {result['episode_number']}")
        if result.get("success"):
            print(f"   🔗 {result.get('video_url', 'N/A')}")
    
    # Final stats
    success_count = sum(1 for r in results if r.get('success'))
    print("\n" + "="*60)
    print(f"✅ Success: {success_count}/{len(results)}")
    print(f"❌ Failed: {len(results) - success_count}/{len(results)}")
    print("="*60)


if __name__ == "__main__":
    main()
