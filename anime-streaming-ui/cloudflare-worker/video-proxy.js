/**
 * Cloudflare Worker - Video URL Proxy
 * Sibnet gibi platformlardan videoları Bunny.net'e proxy eder
 */

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // OPTIONS request (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Sadece POST kabul et
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      const { video_url } = await request.json()

      if (!video_url) {
        return new Response(
          JSON.stringify({ error: 'video_url gerekli' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('🔍 Video URL proxy ediliyor:', video_url)

      // Sibnet için özel headers
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://video.sibnet.ru/',
        'Origin': 'https://video.sibnet.ru',
      }

      // Video'yu fetch et
      const videoResponse = await fetch(video_url, { headers })

      if (!videoResponse.ok) {
        return new Response(
          JSON.stringify({
            error: `Video fetch failed: ${videoResponse.status}`,
            status: videoResponse.status
          }),
          { status: videoResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Video stream'i döndür
      return new Response(videoResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': videoResponse.headers.get('Content-Type') || 'video/mp4',
          'Content-Length': videoResponse.headers.get('Content-Length'),
          'Cache-Control': 'public, max-age=3600',
        }
      })

    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
}
