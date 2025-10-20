const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5003;

// CORS'u etkinleştir
app.use(cors());

// Video proxy endpoint
app.get('/proxy/video', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    console.log('🎬 Proxying video:', url);

    // Video sunucusuna istek gönder
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'Referer': 'https://megacloud.blog/',
        'Origin': 'https://megacloud.blog',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      timeout: 30000,
      maxRedirects: 5
    });

    // Response headers'ı kopyala
    const allowedHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'etag',
      'last-modified'
    ];

    Object.keys(response.headers).forEach(key => {
      if (allowedHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, response.headers[key]);
      }
    });

    // CORS headers ekle
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    // Status code'u ayarla
    res.status(response.status);

    // Stream'i pipe et
    response.data.pipe(res);

    // Hata durumunda
    response.data.on('error', (error) => {
      console.error('❌ Stream error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error' });
      }
    });

  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    
    if (error.response) {
      // Sunucu response döndü ama hata var
      res.status(error.response.status).json({
        error: 'Upstream server error',
        status: error.response.status,
        message: error.message
      });
    } else if (error.request) {
      // İstek gönderildi ama response alınamadı
      res.status(504).json({
        error: 'Gateway timeout',
        message: 'No response from upstream server'
      });
    } else {
      // İstek oluşturulurken hata
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// M3U8 playlist proxy endpoint
app.get('/proxy/playlist', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    console.log('📋 Proxying playlist:', url);

    const response = await axios({
      method: 'GET',
      url: url,
      headers: {
        'Referer': 'https://megacloud.blog/',
        'Origin': 'https://megacloud.blog',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000
    });

    // M3U8 içeriğini al
    let content = response.data;

    // Eğer relative URL'ler varsa, onları da proxy'den geçir
    if (typeof content === 'string') {
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      
      // .ts ve .m3u8 dosyalarını proxy URL'ine çevir
      content = content.replace(
        /([\w\-]+\.(?:ts|m3u8))/g,
        (match) => {
          const fullUrl = baseUrl + match;
          return `/proxy/video?url=${encodeURIComponent(fullUrl)}`;
        }
      );
    }

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(content);

  } catch (error) {
    console.error('❌ Playlist proxy error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch playlist',
      message: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'video-proxy' });
});

// OPTIONS request için
app.options('*', cors());

app.listen(PORT, () => {
  console.log(`🎬 Video Proxy Server running on http://localhost:${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   - GET /proxy/video?url=<video_url>`);
  console.log(`   - GET /proxy/playlist?url=<playlist_url>`);
  console.log(`   - GET /health`);
});

module.exports = app;
