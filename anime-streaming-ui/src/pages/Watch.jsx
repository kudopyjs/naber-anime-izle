import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import aniwatchApi from '../services/aniwatchApi'
import { saveWatchProgress } from '../utils/watchHistory'

// Lazy load video player for better initial load
const CustomVideoPlayer = lazy(() => import('../components/CustomVideoPlayer'))

function Watch() {
  const { animeSlug } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [anime, setAnime] = useState(null)
  const [allEpisodes, setAllEpisodes] = useState([])
  const [currentEpisode, setCurrentEpisode] = useState(null)
  const [currentEpisodeId, setCurrentEpisodeId] = useState(null)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [currentCategory, setCurrentCategory] = useState('sub')
  const [currentServer, setCurrentServer] = useState('hd-2')
  const [retryCount, setRetryCount] = useState(0)
  const [retryTimer, setRetryTimer] = useState(null)
  const [subtitles, setSubtitles] = useState([])
  const [introOutro, setIntroOutro] = useState({ intro: null, outro: null })
  const [translationStatus, setTranslationStatus] = useState(null) // { status, progress, message }
  
  const PROXY_SERVER = import.meta.env.VITE_PROXY_URL || 'http://localhost:5000'
  const MAX_RETRIES = 5
  const RETRY_DELAYS = [2000, 3000, 5000, 8000, 10000] // Exponential backoff in ms
  
  // Get episode number from URL
  const urlParams = new URLSearchParams(window.location.search)
  const requestedEpNumber = urlParams.get('ep')

  useEffect(() => {
    loadAnimeData()
  }, [animeSlug])
  
  useEffect(() => {
    if (currentEpisodeId) {
      loadVideo()
    }
  }, [currentEpisodeId, currentCategory, currentServer])
  
  // Cleanup HLS and retry timer on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
      if (retryTimer) {
        clearTimeout(retryTimer)
      }
    }
  }, [retryTimer])

  const loadAnimeData = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Paralel olarak anime bilgileri ve bölümleri yükle (daha hızlı)
      const [animeJson, episodesJson] = await Promise.all([
        aniwatchApi.getAnimeInfo(animeSlug),
        aniwatchApi.getAnimeEpisodes(animeSlug)
      ])
      
      // Anime bilgilerini set et
      if (animeJson.status === 200 && animeJson.data) {
        const animeInfo = animeJson.data.anime.info
        setAnime({
          id: animeInfo.id,
          name: animeInfo.name,
          poster: animeInfo.poster,
          description: animeInfo.description
        })
      }
      
      // Bölümleri işle
      if (episodesJson.status === 200 && episodesJson.data) {
        const episodes = episodesJson.data.episodes || []
        setAllEpisodes(episodes)
        
        console.log('📺 Episodes loaded:', episodes.length)
        
        // Find the correct episode
        let foundEpisode = null
        
        if (requestedEpNumber) {
          // Try to find by ep parameter in episodeId
          foundEpisode = episodes.find(ep => ep.episodeId.includes(`?ep=${requestedEpNumber}`))
          
          if (!foundEpisode) {
            // Try to find by episode number
            foundEpisode = episodes.find(ep => ep.number === parseInt(requestedEpNumber))
          }
        }
        
        // If no episode found or no episode requested, use first episode
        if (!foundEpisode && episodes.length > 0) {
          foundEpisode = episodes[0]
        }
        
        if (foundEpisode) {
          console.log('✅ Loading episode:', foundEpisode.episodeId)
          setCurrentEpisode(foundEpisode)
          setCurrentEpisodeId(foundEpisode.episodeId)
        }
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading anime data:', err)
      setError(err.message || 'Anime bilgileri yüklenemedi')
      setLoading(false)
    }
  }

  const loadVideo = async (isRetry = false) => {
    if (!currentEpisodeId) return
    
    // Clear any existing retry timer
    if (retryTimer) {
      clearTimeout(retryTimer)
      setRetryTimer(null)
    }
    
    setLoadingVideo(true)
    if (!isRetry) {
      setRetryCount(0)
      setVideoError('')
    }
    
    try {
      console.log('🎬 Loading video:', currentEpisodeId, currentCategory, currentServer)
      
      // Fetch video sources from aniwatch API
      const sourcesData = await aniwatchApi.getEpisodeStreamingLinks(
        currentEpisodeId,
        currentServer,
        currentCategory
      )
      
      console.log('✅ Sources data:', sourcesData)
      console.log('📦 Full data object:', JSON.stringify(sourcesData.data, null, 2))
      
      if (!sourcesData.data || !sourcesData.data.sources || sourcesData.data.sources.length === 0) {
        throw new Error('No video sources available')
      }
      
      // Get the best quality source
      const source = sourcesData.data.sources[0]
      const videoUrl = source.url
      
      console.log('📹 Video URL:', videoUrl)
      
      // Get subtitles from tracks
      let subtitleTracks = []
      
      if (sourcesData.data.tracks && Array.isArray(sourcesData.data.tracks)) {
        // Filter out thumbnails and map to proper format
        const originalTracks = sourcesData.data.tracks
          .filter(track => track.lang && track.lang.toLowerCase() !== 'thumbnails')
          .map(track => ({
            file: track.url,
            label: track.lang,
            kind: 'subtitles',
            original: true
          }))
        
        subtitleTracks = [...originalTracks]
        
        // Add Turkish subtitle option for English tracks
        const englishTrack = originalTracks.find(track => 
          track.label.toLowerCase().includes('english')
        )
        
        if (englishTrack) {
          console.log('🌍 English subtitle found, will add Turkish translation option')
          
          // Add Turkish subtitle FIRST (default but disabled)
          subtitleTracks.unshift({
            file: englishTrack.file,
            label: 'Turkish (AI Translated)',
            kind: 'subtitles',
            needsTranslation: true,
            originalUrl: englishTrack.file,
            default: false // Will be enabled manually
          })
        }
      }
      
      console.log('📝 Subtitles found:', subtitleTracks.length, 'tracks')
      console.log('🎬 Intro:', sourcesData.data.intro)
      console.log('🎬 Outro:', sourcesData.data.outro)
      
      setSubtitles(subtitleTracks)
      
      // Set intro/outro times
      setIntroOutro({
        intro: sourcesData.data.intro,
        outro: sourcesData.data.outro
      })
      
      // Proxy the URL through our server
      const proxiedUrl = `${PROXY_SERVER}/proxy?url=${encodeURIComponent(videoUrl)}`
      console.log('🔄 Proxied URL:', proxiedUrl)
      
      // Initialize video player
      const video = videoRef.current
      if (!video) return
      
      // Load HLS.js if not already loaded
      if (!window.Hls) {
        await loadHlsScript()
      }
      
      // Check if HLS is supported
      if (window.Hls && window.Hls.isSupported()) {
        // Destroy previous instance if exists
        if (hlsRef.current) {
          hlsRef.current.destroy()
        }
        
        // Create new HLS instance
        const hls = new window.Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        })
        
        hlsRef.current = hls
        
        hls.loadSource(proxiedUrl)
        hls.attachMedia(video)
        
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ Manifest parsed, playing video')
          video.play().catch(e => console.log('Autoplay prevented:', e))
          setLoadingVideo(false)
        })
        
        hls.on(window.Hls.Events.ERROR, (event, data) => {
          console.error('❌ HLS error:', data)
          if (data.fatal) {
            switch (data.type) {
              case window.Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, attempting recovery...')
                hls.startLoad()
                // If recovery fails, trigger retry
                setTimeout(() => {
                  if (retryCount < MAX_RETRIES) {
                    scheduleRetry()
                  }
                }, 2000)
                break
              case window.Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, trying to recover...')
                hls.recoverMediaError()
                break
              default:
                if (retryCount < MAX_RETRIES) {
                  scheduleRetry()
                } else {
                  setVideoError('Video yüklenemedi. Lütfen farklı bir sunucu deneyin.')
                  setLoadingVideo(false)
                }
                break
            }
          }
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = proxiedUrl
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.log('Autoplay prevented:', e))
          setLoadingVideo(false)
        })
      } else {
        throw new Error('HLS is not supported in this browser')
      }
      
    } catch (err) {
      console.error('❌ Error loading video:', err)
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        scheduleRetry()
      } else {
        setVideoError(err.message || 'Video yüklenemedi. Lütfen farklı bir sunucu deneyin.')
        setLoadingVideo(false)
      }
    }
  }
  
  const scheduleRetry = () => {
    const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
    console.log(`🔄 Retry ${retryCount + 1}/${MAX_RETRIES} in ${delay/1000}s...`)
    
    setVideoError(`Video yükleniyor... (Deneme ${retryCount + 1}/${MAX_RETRIES})`)
    
    const timer = setTimeout(() => {
      setRetryCount(prev => prev + 1)
      loadVideo(true)
    }, delay)
    
    setRetryTimer(timer)
  }
  
  const loadHlsScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Hls) {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest'
      script.async = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  
  const handleEpisodeChange = (episode) => {
    // Extract episode number from episodeId
    const epMatch = episode.episodeId.match(/\?ep=(\d+)/)
    const episodeNumber = epMatch ? epMatch[1] : episode.number
    
    // Navigate to new episode and reload page for clean state
    window.location.href = `/watch/${animeSlug}?ep=${episodeNumber}`
  }

  const currentIndex = allEpisodes.findIndex(ep => ep.episodeId === currentEpisodeId)
  const nextEpisode = allEpisodes[currentIndex + 1]
  const prevEpisode = allEpisodes[currentIndex - 1]

  if (loading) {
    return (
      <div className="min-height-screen bg-background-dark">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-white/60">Video yükleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">😕 Video Bulunamadı</h1>
            <p className="text-white/60 mb-6">{error || 'Bu video mevcut değil'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/80 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden bg-black shadow-2xl mb-6"
            >
              {/* Custom Video Player with Suspense */}
              <Suspense fallback={
                <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
                    <p className="text-white/60">Player yükleniyor...</p>
                  </div>
                </div>
              }>
                <CustomVideoPlayer
                  videoRef={videoRef}
                  hlsRef={hlsRef}
                  anime={anime}
                  currentEpisode={currentEpisode}
                  subtitles={subtitles}
                  proxyServer={PROXY_SERVER}
                  introOutro={introOutro}
                  onTranslationStatus={setTranslationStatus}
                />
              </Suspense>
              
              {/* Translation Status Notification */}
              {translationStatus && (translationStatus.status === 'translating' || translationStatus.status === 'queued') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50"
                >
                  <div className="bg-black/90 backdrop-blur-sm border border-primary/30 rounded-lg px-6 py-4 shadow-xl min-w-[400px]">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                          {translationStatus.progress}%
                        </span>
                      </div>
                      <div className="flex-1">
                        {translationStatus.status === 'queued' ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-semibold">
                                ⏳ Sırada Bekleniyor
                              </p>
                              {translationStatus.queuePosition && (
                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                                  #{translationStatus.queuePosition}
                                </span>
                              )}
                            </div>
                            <p className="text-white/60 text-sm">
                              {translationStatus.message || 'Başka bir kullanıcı çeviri yapıyor...'}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-white font-semibold mb-1">
                              🌍 Yapay zeka ile altyazı çevriliyor...
                            </p>
                            <p className="text-white/60 text-sm">
                              {translationStatus.message || `Tahmini ${translationStatus.estimated || 180} saniye`}
                            </p>
                          </>
                        )}
                        <div className="mt-2 w-full bg-white/10 rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${translationStatus.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Episode Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {currentEpisode ? `Bölüm ${currentEpisode.number}: ${currentEpisode.title || 'Bölüm'}` : 'Video'}
                </h1>
                <Link 
                  to={`/anime/${animeSlug}`}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  ← {anime.name}
                </Link>
              </div>

              {currentEpisode && currentEpisode.isFiller && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded">
                    ⚠️ Filler Bölüm
                  </span>
                </div>
              )}
              
              {/* Server & Category Selector */}
              <div className="mb-4 space-y-4">
                {/* Category Selector */}
                <div>
                  <label className="text-white/60 text-sm font-medium mb-2 block">Ses</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentCategory('sub')}
                      className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
                        currentCategory === 'sub'
                          ? 'bg-primary text-background-dark'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Altyazılı
                    </button>
                    <button
                      onClick={() => setCurrentCategory('dub')}
                      className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
                        currentCategory === 'dub'
                          ? 'bg-primary text-background-dark'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Dublaj
                    </button>
                  </div>
                </div>
                
                {/* Server Selector */}
                <div>
                  <label className="text-white/60 text-sm font-medium mb-2 block">Sunucu</label>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setCurrentServer('hd-2')}
                      className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
                        currentServer === 'hd-2'
                          ? 'bg-primary text-background-dark'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      HD-2
                    </button>
                    <button
                      onClick={() => setCurrentServer('hd-1')}
                      className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
                        currentServer === 'hd-1'
                          ? 'bg-primary text-background-dark'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      HD-1
                    </button>
                    <button
                      onClick={() => setCurrentServer('megacloud')}
                      className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
                        currentServer === 'megacloud'
                          ? 'bg-primary text-background-dark'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Megacloud
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {prevEpisode && (
                  <button
                    onClick={() => handleEpisodeChange(prevEpisode)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold"
                  >
                    ← Önceki Bölüm
                  </button>
                )}
                {nextEpisode && (
                  <button
                    onClick={() => handleEpisodeChange(nextEpisode)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-background-dark rounded-lg transition-all font-semibold"
                  >
                    Sonraki Bölüm →
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Next Episode */}
            {nextEpisode && (
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h2 className="text-white font-bold text-lg mb-4">Sonraki Bölüm</h2>
                <button 
                  onClick={() => handleEpisodeChange(nextEpisode)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors w-full text-left"
                >
                  <div className="w-20 h-12 bg-black/50 rounded flex items-center justify-center">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm line-clamp-2">
                      {nextEpisode.number}: {nextEpisode.title || 'Bölüm'}
                    </p>
                  </div>
                  <span className="text-primary text-2xl">▶</span>
                </button>
              </div>
            )}

            {/* All Episodes */}
            {allEpisodes.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <h2 className="text-white font-bold text-lg mb-4">
                  Tüm Bölümler ({allEpisodes.length})
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allEpisodes.map((ep) => (
                    <button
                      key={ep.episodeId}
                      onClick={() => handleEpisodeChange(ep)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors w-full text-left ${
                        ep.episodeId === currentEpisodeId
                          ? 'bg-primary/20 border border-primary/30'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        ep.episodeId === currentEpisodeId
                          ? 'border-primary text-primary'
                          : 'border-white/20 text-white/60'
                      }`}>
                        {ep.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold line-clamp-1 ${
                          ep.episodeId === currentEpisodeId ? 'text-primary' : 'text-white'
                        }`}>
                          {ep.title || `Bölüm ${ep.number}`}
                        </p>
                        {ep.isFiller && (
                          <span className="text-yellow-400 text-xs">Filler</span>
                        )}
                      </div>
                      {ep.episodeId === currentEpisodeId && (
                        <span className="text-primary text-sm">▶</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Watch
