#!/bin/bash

# Test Bunny upload speed with curl
# Usage: ./test_upload_speed.sh <video_id> <file_path>

VIDEO_ID=$1
FILE_PATH=$2
BUNNY_API_KEY="53c7d7fb-32c8-491e-aeffa1a04974-1412-4208"
BUNNY_LIBRARY_ID="515326"

if [ -z "$VIDEO_ID" ] || [ -z "$FILE_PATH" ]; then
    echo "Usage: $0 <video_id> <file_path>"
    exit 1
fi

echo "🧪 Testing Bunny upload speed with curl..."
echo "📦 File: $FILE_PATH"
echo "🎬 Video ID: $VIDEO_ID"
echo ""

# Upload with curl (shows progress and speed)
curl -X PUT \
    "https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${VIDEO_ID}" \
    -H "AccessKey: ${BUNNY_API_KEY}" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@${FILE_PATH}" \
    --progress-bar \
    -w "\n\n✅ Upload complete!\nTime: %{time_total}s\nSpeed: %{speed_upload} bytes/s\n"
