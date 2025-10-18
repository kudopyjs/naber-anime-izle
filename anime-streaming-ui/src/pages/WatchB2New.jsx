import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import VideoPlayerPlyr from '../components/VideoPlayerPlyr'
import API_BASE_URL from '../config/api'

function WatchB2New() {
  const { animeSlug, seasonNumber, episodeNumber } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [anime, setAnime] = useState(null)
  const [allEpisodes, setAllEpisodes] = useState([])
  const [currentEpisode, setCurrentEpisode] = useState(null)
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(-1)

  useEffect(() => {
    loadVideoData()
  }, [animeSlug, seasonNumber, episodeNumber])

  const loadVideoData = async () => {
    setLoading(true)
    setError('')
    
    try {
      console.log('🔍 Loading B2 video:', { animeSlug, seasonNumber, episodeNumber })
      
      // B2'den anime ve sezon bilgilerini al
      const response = await fetch(`${API_BASE_URL}/b2/anime/${animeSlug}/season/${seasonNumber}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Video bulunamadı')
      }
      
      setAnime(data.anime)
      setAllEpisodes(data.episodes)
      
      // Episode number'a göre video bul
      const episodeIndex = parseInt(episodeNumber) - 1
      const foundEpisode = data.episodes[episodeIndex]
      
      if (!foundEpisode) {
        throw new Error(`Sezon ${seasonNumber} Bölüm ${episodeNumber} bulunamadı`)
      }
      
      console.log('✅ Found episode:', foundEpisode)
      setCurrentEpisode(foundEpisode)
      setCurrentEpisodeIndex(episodeIndex)
      
    } catch (err) {
      console.error('Error loading video:', err)
      setError(err.message || 'Video yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const nextEpisode = allEpisodes[currentEpisodeIndex + 1]
  const prevEpisode = allEpisodes[currentEpisodeIndex - 1]

  // B2 CDN URL'i oluştur
  const cdnUrl = import.meta.env.VITE_CDN_URL || 'https://f003.backblazeb2.com/file/kudopy'
  const videoUrl = currentEpisode ? `${cdnUrl}/${encodeURIComponent(currentEpisode.path)}/playlist.m3u8` : ''
  const posterUrl = currentEpisode ? `${cdnUrl}/${encodeURIComponent(currentEpisode.path)}/thumbnail.jpg` : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark">
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

  if (error || !currentEpisode) {
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
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-xl overflow-hidden bg-black shadow-2xl mb-6"
            >
              <VideoPlayerPlyr
                src={videoUrl}
                poster={posterUrl}
                onEnded={() => {
                  if (nextEpisode) {
                    navigate(`/watch/${animeSlug}/${seasonNumber}/${parseInt(episodeNumber) + 1}`)
                  }
                }}
              />
            </motion.div>

            {/* Video Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card-dark rounded-xl p-6 mb-6"
            >
              <h1 className="text-3xl font-bold text-white mb-2">
                {anime?.name} - Sezon {seasonNumber} Bölüm {episodeNumber}
              </h1>
              <p className="text-white/60">{currentEpisode.title || `Episode ${episodeNumber}`}</p>
            </motion.div>

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              {prevEpisode && (
                <Link
                  to={`/watch/${animeSlug}/${seasonNumber}/${parseInt(episodeNumber) - 1}`}
                  className="flex-1 bg-card-dark hover:bg-card-dark/80 rounded-xl p-4 transition-colors"
                >
                  <div className="text-white/60 text-sm mb-1">← Önceki Bölüm</div>
                  <div className="text-white font-semibold">Bölüm {parseInt(episodeNumber) - 1}</div>
                </Link>
              )}
              {nextEpisode && (
                <Link
                  to={`/watch/${animeSlug}/${seasonNumber}/${parseInt(episodeNumber) + 1}`}
                  className="flex-1 bg-card-dark hover:bg-card-dark/80 rounded-xl p-4 transition-colors text-right"
                >
                  <div className="text-white/60 text-sm mb-1">Sonraki Bölüm →</div>
                  <div className="text-white font-semibold">Bölüm {parseInt(episodeNumber) + 1}</div>
                </Link>
              )}
            </motion.div>
          </div>

          {/* Sidebar - Episodes List */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card-dark rounded-xl p-6 sticky top-4"
            >
              <h2 className="text-xl font-bold text-white mb-4">
                Tüm Bölümler ({allEpisodes.length})
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {allEpisodes.map((ep, index) => (
                  <Link
                    key={index}
                    to={`/watch/${animeSlug}/${seasonNumber}/${index + 1}`}
                    className={`block p-3 rounded-lg transition-colors ${
                      index === currentEpisodeIndex
                        ? 'bg-primary text-background-dark font-bold'
                        : 'bg-background-dark hover:bg-background-dark/60 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Bölüm {index + 1}</span>
                      {index === currentEpisodeIndex && (
                        <span className="text-xs">▶ Oynatılıyor</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default WatchB2New
