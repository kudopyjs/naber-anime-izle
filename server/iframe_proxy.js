/**
 * Iframe Proxy Server
 * X-Frame-Options header'ını kaldırarak iframe embedding'i bypass eder
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS - tüm originlere izin ver
app.use(cors({
  origin: '*',
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'iframe-proxy' });
});

/**
 * Proxy endpoint - X-Frame-Options'ı kaldırır
 */
app.get('/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    console.log('🔄 Proxying:', targetUrl);

    // Headers to bypass Cloudflare and look like a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://hianime.to/',
      'Origin': 'https://hianime.to',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Cache-Control': 'max-age=0'
    };

    // Fetch the page
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: headers,
      maxRedirects: 5,
      validateStatus: (status) => status < 500
    });

    // Get content
    let content = response.data;

    // Rewrite URLs to go through proxy
    if (typeof content === 'string') {
      // Rewrite absolute URLs
      content = content.replace(/https:\/\/hianime\.to/g, `http://localhost:${PORT}/proxy?url=https://hianime.to`);
      
      // Rewrite relative URLs
      content = content.replace(/href="\/([^"]*)"/g, `href="http://localhost:${PORT}/proxy?url=https://hianime.to/$1"`);
      content = content.replace(/src="\/([^"]*)"/g, `src="http://localhost:${PORT}/proxy?url=https://hianime.to/$1"`);
      
      // Add base tag to help with relative URLs
      content = content.replace('<head>', `<head><base href="https://hianime.to/">`);
    }

    // Set response headers WITHOUT X-Frame-Options
    res.setHeader('Content-Type', response.headers['content-type'] || 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Explicitly remove frame-blocking headers
    // Don't set X-Frame-Options
    // Don't set Content-Security-Policy frame-ancestors
    
    console.log('✅ Proxied successfully');
    
    res.send(content);

  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({ 
      error: 'Proxy failed',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('============================================================');
  console.log('🚀 Iframe Proxy Server');
  console.log('============================================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📺 Proxy endpoint: http://localhost:${PORT}/proxy?url=<target_url>`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('============================================================');
  console.log('🔓 X-Frame-Options bypass enabled');
  console.log('============================================================\n');
});
