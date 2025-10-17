#!/bin/bash

# API URL'lerini düzelten script
# Tüm localhost:5002 referanslarını API_BASE_URL ile değiştirir

cd "$(dirname "$0")/anime-streaming-ui"

echo "🔧 Fixing API URLs..."
echo "================================"

# Değiştirilecek dosyalar
FILES=(
  "src/components/AddToListModal.jsx"
  "src/pages/AdminPanel.jsx"
  "src/pages/AddAnime.jsx"
  "src/pages/AnimeDetail.jsx"
  "src/pages/BulkAnimeImport.jsx"
  "src/pages/BunnySync.jsx"
  "src/pages/EditAnime.jsx"
  "src/pages/UserProfile.jsx"
  "src/pages/Watch.jsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Fixing: $file"
    
    # Import ekle (yoksa)
    if ! grep -q "import API_BASE_URL" "$file"; then
      # İlk import satırından sonra ekle
      sed -i "1a import API_BASE_URL from '../config/api'" "$file"
    fi
    
    # URL'leri değiştir
    sed -i "s|'http://localhost:5002/api|API_BASE_URL + '|g" "$file"
    sed -i 's|"http://localhost:5002/api|API_BASE_URL + "|g' "$file"
    sed -i 's|`http://localhost:5002/api|`${API_BASE_URL}|g' "$file"
    
    echo "   ✅ Done"
  else
    echo "   ⚠️  File not found: $file"
  fi
done

echo ""
echo "================================"
echo "✅ All files fixed!"
echo ""
echo "Checking for remaining localhost:5002..."
grep -r "localhost:5002" src/ --include="*.js" --include="*.jsx" || echo "✅ No localhost:5002 found!"
echo ""
echo "Next steps:"
echo "1. npm run build"
echo "2. systemctl restart nginx"
