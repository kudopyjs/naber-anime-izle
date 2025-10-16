# TürkAnime Helper Scripts

Bu klasör, Node.js backend'den çağrılan Python helper script'lerini içerir.

## Script'ler

### 1. `search_anime.py`
TürkAnime'de anime arar.

**Kullanım:**
```bash
python search_anime.py "naruto"
```

**Çıktı:**
```json
{
  "results": [
    {"slug": "naruto", "name": "Naruto"}
  ],
  "total": 1
}
```

### 2. `get_anime_details.py`
Anime detaylarını ve bölüm listesini getirir.

**Kullanım:**
```bash
python get_anime_details.py "naruto"
```

**Çıktı:**
```json
{
  "info": {
    "title": "Naruto",
    "image": "https://...",
    "genre": ["Action"],
    "rating": 8.5,
    ...
  },
  "episodes": [...]
}
```

### 3. `import_episode.py`
Bir bölümü TürkAnime'den çekip Bunny CDN'e yükler.

**Kullanım:**
```bash
python import_episode.py "naruto" "naruto-1-bolum" "admin"
```

**Çıktı:**
```json
{
  "success": true,
  "videoGuid": "abc-123",
  "message": "Bölüm başarıyla içe aktarıldı"
}
```

### 4. `list_all_anime.py`
Tüm anime listesini getirir.

**Kullanım:**
```bash
python list_all_anime.py
```

## Gereksinimler

```bash
pip install turkanime-cli python-dotenv requests
```

## Not

Bu script'ler doğrudan çağrılmamalı, `turkanime-api.js` üzerinden kullanılmalıdır.
