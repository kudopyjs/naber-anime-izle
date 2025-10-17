#!/bin/bash

# Anime Streaming Platform - Deploy Script
# Usage: ./deploy.sh

set -e

echo "================================"
echo "🚀 Deployment Starting..."
echo "================================"

# Git pull
echo ""
echo "[1/5] Pulling latest changes..."
git pull origin main

# Install dependencies
echo ""
echo "[2/5] Installing dependencies..."
cd anime-streaming-ui
npm install

# Build
echo ""
echo "[3/5] Building production bundle..."
npm run build

# Restart backend (if exists)
if pm2 list | grep -q "anime-api"; then
    echo ""
    echo "[4/5] Restarting backend..."
    pm2 restart anime-api
else
    echo ""
    echo "[4/5] Backend not running, skipping..."
fi

# Reload Nginx
echo ""
echo "[5/5] Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "🌐 Site: https://keyani.me"
echo "📊 PM2: pm2 status"
echo "📝 Logs: pm2 logs anime-api"
echo ""
