import { useEffect, useRef, useState } from 'react'

export default function SimpleVideoPlayer({ src, poster, onEnded, useProxy = true }) {
  const videoRef = useRef(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // Proxy server URL
  const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:5000'

  // Convert video URL to use proxy
  const getProxiedUrl = (url) => {
    if (!url || !useProxy) return url
    
    // If already proxied, return as is
    if (url.includes('/proxy?url=')) return url
    
    // Proxy the URL
    return `${PROXY_URL}/proxy?url=${encodeURIComponent(url)}`
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setLoading(true)
    setError(null)

    // Don't proxy R2 URLs
    const isR2 = src.includes('r2.dev')
    const videoUrl = isR2 ? src : getProxiedUrl(src)
    
    console.log('🎬 Loading video:', videoUrl)
    console.log('📦 Source type:', isR2 ? 'R2 (direct)' : 'HiAnime (proxy)')

    // Check if HLS.js is needed (M3U8 files)
    if (videoUrl.includes('.m3u8')) {
      // Try to load HLS.js from CDN
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest'
      script.async = true
      
      script.onload = () => {
        if (window.Hls && window.Hls.isSupported()) {
          console.log('✅ Using HLS.js for M3U8 playback')
          
          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            xhrSetup: (xhr, url) => {
              // Add CORS headers
              xhr.withCredentials = false
            }
          })
          
          hls.loadSource(videoUrl)
          hls.attachMedia(video)
          
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            console.log('✅ HLS manifest loaded')
            setLoading(false)
          })
          
          hls.on(window.Hls.Events.ERROR, (event, data) => {
            console.error('❌ HLS error:', data)
            if (data.fatal) {
              setError(`HLS Error: ${data.type}`)
              setLoading(false)
            }
          })
          
          // Cleanup
          return () => {
            hls.destroy()
          }
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          console.log('✅ Using native HLS support')
          video.src = videoUrl
          setLoading(false)
        } else {
          setError('HLS not supported in this browser')
          setLoading(false)
        }
      }
      
      script.onerror = () => {
        console.error('❌ Failed to load HLS.js')
        // Fallback to native
        video.src = videoUrl
        setLoading(false)
      }
      
      document.head.appendChild(script)
      
      return () => {
        document.head.removeChild(script)
      }
    } else {
      // Regular video file
      video.src = videoUrl
      setLoading(false)
    }

    // Set poster
    if (poster) {
      video.poster = poster
    }

    // Handle ended event
    if (onEnded) {
      video.addEventListener('ended', onEnded)
    }

    return () => {
      if (onEnded) {
        video.removeEventListener('ended', onEnded)
      }
    }
  }, [src, poster, onEnded, useProxy])

  return (
    <div className="w-full aspect-video bg-black relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
            <p className="text-white">Video yükleniyor...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">❌ {error}</p>
            <p className="text-white/60 text-sm">Lütfen sayfayı yenileyin</p>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        controlsList="nodownload"
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      >
        <p className="text-white p-4">
          Tarayıcınız video oynatmayı desteklemiyor.
        </p>
      </video>
    </div>
  )
}
