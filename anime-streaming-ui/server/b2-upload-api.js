/**
 * Backblaze B2 Upload API
 * Video indirme, encoding ve B2'ye yükleme için backend API
 * 
 * Kullanım:
 *   node server/b2-upload-api.js
 * 
 * Gereksinimler:
 *   - FFmpeg kurulu olmalı
 *   - npm install backblaze-b2 express cors dotenv fluent-ffmpeg axios
 */

const express = require('express');
const cors = require('cors');
const B2 = require('backblaze-b2');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.B2_API_PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// B2 Client
const b2 = new B2({
  applicationKeyId: process.env.VITE_B2_KEY_ID,
  applicationKey: process.env.VITE_B2_APPLICATION_KEY
});

// Temp directory
const TEMP_DIR = path.join(__dirname, 'temp_b2');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Helper: B2 Authorize
let b2Auth = null;
async function authorizeB2() {
  if (b2Auth && Date.now() < b2Auth.expiresAt) {
    return b2Auth;
  }

  try {
    await b2.authorize();
    b2Auth = {
      token: b2.authorizationToken,
      apiUrl: b2.apiUrl,
      downloadUrl: b2.downloadUrl,
      expiresAt: Date.now() + (23 * 60 * 60 * 1000)
    };
    return b2Auth;
  } catch (error) {
    console.error('B2 authorization failed:', error);
    throw error;
  }
}

// Helper: Video indir
async function downloadVideo(url, outputPath) {
  console.log('📥 Video indiriliyor:', url);
  
  const writer = fs.createWriteStream(outputPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      const size = fs.statSync(outputPath).size;
      console.log(`✅ İndirildi: ${(size / (1024 * 1024)).toFixed(2)} MB`);
      resolve();
    });
    writer.on('error', reject);
  });
}

// Helper: Video encode (HLS)
async function encodeToHLS(inputPath, outputDir) {
  console.log('🎬 Video encoding başlıyor...');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx265',        // H.265 (HEVC) codec
        '-crf 28',             // CRF 28 (H.265 için optimal, H.264'teki 23'e eşdeğer)
        '-preset medium',      // Encoding hızı (slow daha iyi kalite ama yavaş)
        '-tag:v hvc1',         // Apple uyumluluğu için
        '-c:a aac',
        '-b:a 128k',
        '-hls_time 10',
        '-hls_playlist_type vod',
        '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts')
      ])
      .output(path.join(outputDir, 'playlist.m3u8'))
      .on('start', (cmd) => {
        console.log('FFmpeg command:', cmd);
      })
      .on('progress', (progress) => {
        console.log(`⏳ Encoding: ${progress.percent?.toFixed(1)}%`);
      })
      .on('end', () => {
        console.log('✅ Encoding tamamlandı!');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ Encoding hatası:', err);
        reject(err);
      })
      .run();
  });
}

// Helper: Thumbnail oluştur
async function createThumbnail(inputPath, outputPath) {
  console.log('📸 Thumbnail oluşturuluyor...');
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['00:00:01'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720'
      })
      .on('end', () => {
        console.log('✅ Thumbnail oluşturuldu!');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ Thumbnail hatası:', err);
        reject(err);
      });
  });
}

// Helper: B2'ye dosya yükle
async function uploadToB2(filePath, b2FileName) {
  try {
    await authorizeB2();
    
    // Upload URL al
    const uploadUrlResponse = await b2.getUploadUrl({
      bucketId: process.env.VITE_B2_BUCKET_ID
    });

    // Dosyayı oku
    const fileData = fs.readFileSync(filePath);
    
    // SHA1 hash hesapla
    const sha1 = crypto.createHash('sha1').update(fileData).digest('hex');

    // Upload
    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: b2FileName,
      data: fileData,
      hash: sha1,
      contentType: 'application/octet-stream'
    });

    console.log(`✅ Yüklendi: ${b2FileName}`);
    return uploadResponse.data;
  } catch (error) {
    console.error(`❌ Upload hatası (${b2FileName}):`, error.message);
    throw error;
  }
}

// Helper: Klasördeki tüm dosyaları B2'ye yükle
async function uploadDirectoryToB2(localDir, b2Prefix) {
  const files = fs.readdirSync(localDir);
  const results = [];

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const b2Path = `${b2Prefix}/${file}`;
    
    if (fs.statSync(localPath).isFile()) {
      try {
        const result = await uploadToB2(localPath, b2Path);
        results.push({ file, success: true, result });
      } catch (error) {
        results.push({ file, success: false, error: error.message });
      }
    }
  }

  return results;
}

// Helper: Temp dosyaları temizle
function cleanupTemp(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log('🗑️ Temp dosyalar temizlendi');
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// API: Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    await authorizeB2();
    res.json({
      success: true,
      message: 'B2 API çalışıyor!',
      b2: {
        apiUrl: b2.apiUrl,
        downloadUrl: b2.downloadUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: Video URL'den B2'ye yükle
app.post('/api/upload-to-b2', async (req, res) => {
  const { videoUrl, title, animeName, collectionId } = req.body;

  if (!videoUrl || !title) {
    return res.status(400).json({
      success: false,
      error: 'videoUrl ve title gerekli'
    });
  }

  // Video ID oluştur (unique)
  const videoId = crypto.randomBytes(16).toString('hex');
  const folder = collectionId || animeName || 'videos';
  const b2Prefix = `${folder}/${videoId}`;

  // Temp paths
  const tempVideoPath = path.join(TEMP_DIR, `${videoId}_original.mp4`);
  const tempHlsDir = path.join(TEMP_DIR, `${videoId}_hls`);
  const tempThumbnailPath = path.join(TEMP_DIR, `${videoId}_thumbnail.jpg`);

  try {
    console.log('\n🚀 Upload işlemi başlıyor...');
    console.log('  Video URL:', videoUrl);
    console.log('  Title:', title);
    console.log('  Video ID:', videoId);
    console.log('  B2 Prefix:', b2Prefix);

    // 1. Video'yu indir
    await downloadVideo(videoUrl, tempVideoPath);

    // 2. HLS encode
    await encodeToHLS(tempVideoPath, tempHlsDir);

    // 3. Thumbnail oluştur
    await createThumbnail(tempVideoPath, tempThumbnailPath);

    // 4. B2'ye yükle
    console.log('📤 B2\'ye yükleniyor...');
    
    // HLS dosyalarını yükle
    const hlsResults = await uploadDirectoryToB2(tempHlsDir, b2Prefix);
    
    // Thumbnail yükle
    await uploadToB2(tempThumbnailPath, `${b2Prefix}/thumbnail.jpg`);

    // Metadata oluştur ve yükle
    const metadata = {
      videoId,
      title,
      animeName: animeName || null,
      collectionId: collectionId || null,
      uploadDate: new Date().toISOString(),
      playlistUrl: `${process.env.VITE_CDN_URL}/${b2Prefix}/playlist.m3u8`,
      thumbnailUrl: `${process.env.VITE_CDN_URL}/${b2Prefix}/thumbnail.jpg`
    };

    const metadataPath = path.join(TEMP_DIR, `${videoId}_metadata.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    await uploadToB2(metadataPath, `${b2Prefix}/metadata.json`);

    // 5. Temp temizle
    cleanupTemp(tempVideoPath);
    cleanupTemp(tempHlsDir);
    cleanupTemp(tempThumbnailPath);
    cleanupTemp(metadataPath);

    console.log('✅ Upload tamamlandı!');

    res.json({
      success: true,
      videoId,
      playlistUrl: metadata.playlistUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      hlsFiles: hlsResults.length,
      metadata
    });

  } catch (error) {
    console.error('❌ Upload hatası:', error);
    
    // Cleanup on error
    cleanupTemp(tempVideoPath);
    cleanupTemp(tempHlsDir);
    cleanupTemp(tempThumbnailPath);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: Video encode (sadece encoding, upload yok)
app.post('/api/encode-video', async (req, res) => {
  const { videoPath, animeName, episodeNumber } = req.body;

  if (!videoPath) {
    return res.status(400).json({
      success: false,
      error: 'videoPath gerekli'
    });
  }

  const videoId = crypto.randomBytes(16).toString('hex');
  const tempHlsDir = path.join(TEMP_DIR, `${videoId}_hls`);

  try {
    await encodeToHLS(videoPath, tempHlsDir);

    res.json({
      success: true,
      videoId,
      hlsDir: tempHlsDir
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: URL çözümle (yt-dlp ile)
app.post('/api/resolve-url', async (req, res) => {
  const { video_url } = req.body;

  if (!video_url) {
    return res.status(400).json({
      success: false,
      error: 'video_url gerekli'
    });
  }

  try {
    // yt-dlp kullanarak URL çözümle
    const { execSync } = require('child_process');
    
    const command = `yt-dlp -g --no-warnings "${video_url}"`;
    const directUrl = execSync(command, { encoding: 'utf-8' }).trim();

    res.json({
      success: true,
      resolved_url: directUrl,
      platform: 'generic'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 B2 Upload API çalışıyor!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`\n📝 Endpoints:`);
  console.log(`  GET  /api/test`);
  console.log(`  POST /api/upload-to-b2`);
  console.log(`  POST /api/encode-video`);
  console.log(`  POST /api/resolve-url`);
  console.log(`\n⚙️  Gereksinimler:`);
  console.log(`  - FFmpeg kurulu olmalı`);
  console.log(`  - .env dosyası yapılandırılmalı`);
  console.log(`\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Server kapatılıyor...');
  cleanupTemp(TEMP_DIR);
  process.exit(0);
});
