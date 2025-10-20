/**
 * HiAnime Video Proxy Server
 * Bypasses Cloudflare and CORS to stream videos directly from HiAnime
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PROXY_PORT || 5000;

// Enable JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges'],
  credentials: true
}));

// Ultra-strong Cloudflare bypass headers with rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

let currentUserAgentIndex = 0;

const getRandomUserAgent = () => {
  currentUserAgentIndex = (currentUserAgentIndex + 1) % userAgents.length;
  return userAgents[currentUserAgentIndex];
};

const getBypassHeaders = (referer = 'https://hianime.to/', videoUrl = '') => {
  // Determine origin based on video URL - CRITICAL for bypass
  let origin = null; // Don't send Origin header by default
  let actualReferer = null; // Don't send Referer by default
  
  // Extract domain from video URL
  try {
    const urlObj = new URL(videoUrl);
    const domain = urlObj.hostname;
    
    // Set origin and referer based on domain
    if (domain.includes('sunburst')) {
      origin = `https://${domain}`;
      actualReferer = `https://${domain}/`;
    } else if (domain.includes('haildrop')) {
      origin = `https://${domain}`;
      actualReferer = `https://${domain}/`;
    } else if (domain.includes('rainveil')) {
      origin = `https://${domain}`;
      actualReferer = `https://${domain}/`;
    } else if (domain.includes('megacloud')) {
      origin = `https://${domain}`;
      actualReferer = `https://${domain}/`;
    } else {
      // Generic CDN - no origin/referer
      origin = null;
      actualReferer = null;
    }
  } catch (e) {
    console.log('⚠️ Could not parse URL for headers:', e.message);
  }

  const headers = {
    'User-Agent': getRandomUserAgent(),
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8,ja;q=0.7',
    'Accept-Encoding': 'identity', // Don't use compression for better compatibility
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'video',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Ch-Ua': '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'DNT': '1',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  // Only add Origin/Referer if we determined them
  if (origin) headers['Origin'] = origin;
  if (actualReferer) headers['Referer'] = actualReferer;

  return headers;
};

/**
 * Helper: Check if URL is M3U8 playlist
 */
const isM3U8 = (url) => {
  return url.includes('.m3u8') || url.includes('master.m3u8') || url.includes('playlist.m3u8');
};

/**
 * Helper: Rewrite M3U8 playlist to proxy all URLs
 */
const rewriteM3U8 = (content, baseUrl) => {
  const lines = content.split('\n');
  const rewritten = lines.map(line => {
    const trimmed = line.trim();
    
    // Keep all comments and empty lines as-is
    if (trimmed.startsWith('#') || trimmed === '') {
      return line;
    }
    
    // This is a URL line - rewrite it
    try {
      let fullUrl = trimmed;
      
      // If relative URL, make it absolute
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        const base = new URL(baseUrl);
        const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
        fullUrl = `${base.origin}${basePath}${trimmed}`;
      }
      
      // Proxy the URL
      return `/proxy?url=${encodeURIComponent(fullUrl)}`;
    } catch (e) {
      console.error('Error rewriting URL:', trimmed, e);
      return line; // Return original if error
    }
  });
  
  return rewritten.join('\n');
};

/**
 * Proxy endpoint for video streaming
 * GET /proxy?url=<video_url>
 */
app.get('/proxy', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'Missing video URL parameter' });
    }

    console.log('🎬 Proxying:', videoUrl.substring(0, 80) + '...');
    console.log('📝 Is M3U8:', isM3U8(videoUrl));

    // Get range header from client
    const range = req.headers.range;
    
    // Prepare headers with Cloudflare bypass (dynamic based on URL)
    const headers = {
      ...getBypassHeaders('https://hianime.to/', videoUrl),
    };

    // Add range header if client requested it
    if (range) {
      headers['Range'] = range;
      console.log('📊 Range request:', range);
    }

    console.log('🔓 Using headers:', {
      'User-Agent': headers['User-Agent'].substring(0, 50) + '...',
      'Origin': headers['Origin'] || 'none',
      'Referer': headers['Referer'] || 'none'
    });

    // Make request to video source with retry logic
    let response;
    let retries = 5; // Increase retries
    let lastError;
    
    while (retries > 0) {
      try {
        // Try different strategies on each retry
        const strategy = 5 - retries;
        
        if (strategy === 0) {
          // Strategy 1: Full headers
          console.log('🔄 Strategy 1: Full headers');
        } else if (strategy === 1) {
          // Strategy 2: Minimal headers (just User-Agent)
          console.log('🔄 Strategy 2: Minimal headers');
          Object.keys(headers).forEach(key => {
            if (key !== 'User-Agent' && key !== 'Accept') {
              delete headers[key];
            }
          });
        } else if (strategy === 2) {
          // Strategy 3: No custom headers at all
          console.log('🔄 Strategy 3: No custom headers');
          headers = {
            'User-Agent': getRandomUserAgent()
          };
        } else if (strategy === 3) {
          // Strategy 4: Different User-Agent
          console.log('🔄 Strategy 4: Different UA');
          headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          };
        } else {
          // Strategy 5: Curl-like
          console.log('🔄 Strategy 5: Curl-like');
          headers = {
            'User-Agent': 'curl/7.68.0',
            'Accept': '*/*'
          };
        }
        
        response = await axios({
          method: 'GET',
          url: videoUrl,
          headers: headers,
          responseType: 'stream',
          timeout: 60000,
          maxRedirects: 10,
          validateStatus: (status) => status < 500,
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false
          })
        });
        
        console.log(`✅ Success with strategy ${strategy + 1}`);
        break; // Success, exit retry loop
        
      } catch (error) {
        lastError = error;
        retries--;
        
        if (retries === 0) {
          console.error('❌ All strategies failed:', error.message);
          throw error;
        }
        
        console.log(`⚠️ Attempt ${5 - retries}/5 failed: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
      }
    }

    // Check if this is an M3U8 playlist
    const contentType = response.headers['content-type'] || '';
    const isPlaylist = isM3U8(videoUrl) || contentType.includes('mpegurl') || contentType.includes('m3u8');

    // Check if we got HTML instead (Cloudflare block page)
    if (contentType.includes('text/html')) {
      console.error('❌ Got HTML response instead of video - Cloudflare blocked!');
      return res.status(403).json({
        error: 'Cloudflare Protection',
        message: 'Video source is protected by Cloudflare and cannot be accessed',
        suggestion: 'Try a different video source or server'
      });
    }

    if (isPlaylist) {
      console.log('📋 M3U8 Playlist detected - rewriting URLs');
      
      // Read the entire playlist
      let playlistContent = '';
      response.data.on('data', chunk => {
        playlistContent += chunk.toString();
      });
      
      response.data.on('end', () => {
        // Check if content is actually HTML (double-check)
        if (playlistContent.trim().startsWith('<!DOCTYPE') || playlistContent.trim().startsWith('<html')) {
          console.error('❌ Playlist content is HTML - Cloudflare blocked!');
          return res.status(403).json({
            error: 'Cloudflare Protection',
            message: 'Received HTML instead of M3U8 playlist'
          });
        }
        
        // Check if it's a valid M3U8
        if (!playlistContent.includes('#EXTM3U')) {
          console.error('❌ Invalid M3U8 - missing #EXTM3U header');
          console.log('Content preview:', playlistContent.substring(0, 200));
          return res.status(500).json({
            error: 'Invalid M3U8',
            message: 'Received content is not a valid M3U8 playlist'
          });
        }
        
        // Rewrite URLs in playlist
        const rewritten = rewriteM3U8(playlistContent, videoUrl);
        
        // Send rewritten playlist
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', '*');
        res.send(rewritten);
        
        console.log('✅ M3U8 playlist rewritten and sent');
      });
      
      response.data.on('error', (error) => {
        console.error('❌ Stream error:', error.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error' });
        }
      });
      
    } else {
      // Regular video file - stream it
      console.log('🎥 Video file - streaming');
      
      // Set response headers
      res.status(response.status);
      
      // Copy important headers
      const headersToProxy = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'cache-control',
        'etag',
        'last-modified'
      ];

      headersToProxy.forEach(header => {
        if (response.headers[header]) {
          res.setHeader(header, response.headers[header]);
        }
      });

      // Enable range requests
      if (!response.headers['accept-ranges']) {
        res.setHeader('Accept-Ranges', 'bytes');
      }

      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

      console.log('✅ Streaming started');

      // Pipe the video stream to client
      response.data.pipe(res);
    }

    // Handle errors
    response.data.on('error', (error) => {
      console.error('❌ Stream error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error' });
      }
    });

  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    
    if (error.response) {
      // Forward error status from source
      res.status(error.response.status).json({
        error: 'Source error',
        status: error.response.status,
        message: error.message
      });
    } else {
      res.status(500).json({
        error: 'Proxy error',
        message: error.message
      });
    }
  }
});

/**
 * Get video info endpoint
 * POST /get-video-info
 * Body: { animeId, episodeId }
 */
app.post('/get-video-info', async (req, res) => {
  try {
    const { animeId, episodeId } = req.body;
    
    if (!animeId || !episodeId) {
      return res.status(400).json({ error: 'Missing animeId or episodeId' });
    }

    console.log(`🔍 Getting video info: ${animeId} - Episode ${episodeId}`);

    // Call your Aniwatch API
    const aniwatchApiUrl = process.env.ANIWATCH_API_URL || 'http://localhost:4000';
    const response = await axios.get(
      `${aniwatchApiUrl}/api/v2/hianime/episode/sources?animeEpisodeId=${episodeId}`
    );

    const sources = response.data;
    
    // Return sources with proxy URLs
    const proxiedSources = {
      ...sources,
      sources: sources.sources?.map(source => ({
        ...source,
        url: `/proxy?url=${encodeURIComponent(source.url)}`
      }))
    };

    res.json(proxiedSources);

  } catch (error) {
    console.error('❌ Error getting video info:', error.message);
    res.status(500).json({
      error: 'Failed to get video info',
      message: error.message
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HiAnime Video Proxy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Test endpoint
 */
app.get('/test', async (req, res) => {
  try {
    const testUrl = 'https://hianime.to/';
    const response = await axios.get(testUrl, {
      headers: getBypassHeaders(),
      timeout: 10000
    });

    res.json({
      status: 'ok',
      message: 'Cloudflare bypass working',
      statusCode: response.status,
      cloudflareDetected: response.data.includes('Checking your browser')
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 HiAnime Video Proxy Server');
  console.log('='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📺 Proxy endpoint: http://localhost:${PORT}/proxy?url=<video_url>`);
  console.log(`🔍 Video info: POST http://localhost:${PORT}/get-video-info`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
});

module.exports = app;
