import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import API_BASE_URL from '../config/api'

function Watch() {
  const { animeSlug, seasonNumber, episodeNumber } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [videoData, setVideoData] = useState(null)
  const [anime, setAnime] = useState(null)
  const [allEpisodes, setAllEpisodes] = useState([])
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(-1)
  const [videoId, setVideoId] = useState(null)

  useEffect(() => {
    loadVideoData()
  }, [animeSlug, seasonNumber, episodeNumber])

  const loadVideoData = async () => {
    setLoading(true)
    setError('')
    
    try {
      console.log('🔍 Loading video:', { animeSlug, seasonNumber, episodeNumber })
      
      // Anime listesinden anime bilgisini bul
      const animesResponse = await fetch(`${API_BASE_URL}/anime/list`)
      const animesData = await animesResponse.json()
      
      if (!animesData.success) {
        throw new Error('Anime verisi yüklenemedi')
      }
      
      // Anime slug'a göre anime bul
      const foundAnime = animesData.animes.find(a => 
        a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === animeSlug.toLowerCase()
      )
      
      if (!foundAnime) {
        throw new Error('Anime bulunamadı')
      }
      
      console.log('✅ Found anime:', foundAnime.name)
      
      // Sezon bilgisini bul
      const season = foundAnime.seasons?.find(s => s.seasonNumber === parseInt(seasonNumber))
      
      if (!season) {
        throw new Error(`Sezon ${seasonNumber} bulunamadı`)
      }
      
      console.log('✅ Found season:', season.seasonNumber, season.collectionId)
      
      // Collection'daki tüm videoları çek
      const episodesResponse = await fetch(`${API_BASE_URL}/bunny/collection/${season.collectionId}/videos`)
      const episodesData = await episodesResponse.json()
      
      if (!episodesData.success) {
        throw new Error('Bölümler yüklenemedi')
      }
      
      // Videoları tarihe göre sırala (en eski en başta)
      const sortedVideos = [...episodesData.videos].sort((a, b) => 
        new Date(a.dateUploaded) - new Date(b.dateUploaded)
      )
      
      setAllEpisodes(sortedVideos)
      setAnime({ ...foundAnime, currentSeason: season })
      
      // Episode number'a göre video bul (1-indexed)
      const episodeIndex = parseInt(episodeNumber) - 1
      const foundVideo = sortedVideos[episodeIndex]
      
      if (!foundVideo) {
        throw new Error(`Sezon ${seasonNumber} Bölüm ${episodeNumber} bulunamadı`)
      }
      
      console.log('✅ Found episode:', foundVideo.title)
      setVideoData(foundVideo)
      setVideoId(foundVideo.guid)
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

  if (error || !videoData) {
    console.log('❌ Showing error page:', { error, hasVideoData: !!videoData })
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

  console.log('✅ Rendering video player page')

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
              className="relative rounded-xl overflow-hidden bg-black shadow-2xl"
              style={{ paddingTop: '56.25%' }} // 16:9 aspect ratio
            >
              {/* Bunny Stream Beta Player */}
              <iframe
                src={`https://iframe.mediadelivery.net/embed/${import.meta.env.VITE_BUNNY_LIBRARY_ID}/${videoData?.guid}?autoplay=false&preload=true`}
                loading="lazy"
                style={{
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '100%',
                }}
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                allowFullScreen={true}
              />
              
              {/* Encoding Warning Overlay */}
              {videoData && videoData.status !== 4 && videoData.status !== 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="text-center p-8">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
                    <h3 className="text-white text-2xl font-bold mb-2">⚠️ Video Henüz Hazır Değil</h3>
                    <p className="text-white/60 mb-2">
                      Video Status: {videoData.status}
                    </p>
                    <p className="text-white/60 mb-4 text-sm">
                      (Status 4 = Ready, Status 5 = Encoding)
                    </p>
                    {videoData.encodeProgress > 0 && (
                      <div className="w-64 mx-auto mb-4">
                        <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${videoData.encodeProgress}%` }}
                          />
                        </div>
                        <p className="text-white/60 text-sm mt-2">{videoData.encodeProgress}%</p>
                      </div>
                    )}
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-2 bg-primary hover:bg-primary/80 text-background-dark font-semibold rounded-lg transition-colors"
                    >
                      🔄 Yenile
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Debug Info */}
            {import.meta.env.DEV && videoData && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm font-mono">
                  <strong>Debug:</strong><br/>
                  Video ID: {videoId}<br/>
                  Video GUID: {videoData.guid}<br/>
                  CDN Hostname: {import.meta.env.VITE_BUNNY_CDN_HOSTNAME}<br/>
                  Video URL: https://{import.meta.env.VITE_BUNNY_CDN_HOSTNAME}/{videoData.guid || videoData.videoLibraryId}/playlist.m3u8<br/>
                  <br/>
                  <strong>Video Status:</strong><br/>
                  Status: {videoData.status || 'Unknown'}<br/>
                  Encoding Progress: {videoData.encodeProgress || 0}%<br/>
                  Available Resolutions: {videoData.availableResolutions || 'None'}<br/>
                  Has Thumbnail: {videoData.thumbnailFileName ? 'Yes' : 'No'}<br/>
                  Video Length: {videoData.length ? `${Math.floor(videoData.length / 60)} min` : 'Unknown'}<br/>
                  <br/>
                  <strong>Player Status:</strong><br/>
                  VideoPlayerPlyr Component: ✅ Active<br/>
                  <br/>
                  {videoData.status !== 4 && videoData.status !== 5 ? (
                    <span className="text-red-400">
                      ⚠️ Video henüz hazır değil! Status: {videoData.status}<br/>
                      (Status 4 = Ready, Status 5 = Encoding)<br/>
                      Player başlatılmayacak!
                    </span>
                  ) : (
                    <span className="text-green-400">
                      ✅ Video hazır! Status: {videoData.status}<br/>
                      Player başlatılmalı. Console'u kontrol edin!
                    </span>
                  )}
                  <br/>
                  <a 
                    href={`https://${import.meta.env.VITE_BUNNY_CDN_HOSTNAME}/${videoData.guid || videoData.videoLibraryId}/playlist.m3u8`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    → Test URL in New Tab
                  </a>
                </p>
                
                <div className="mt-4 pt-4 border-t border-yellow-500/30">
                  <p className="text-yellow-400 text-xs">
                    <strong>🔧 Video Yüklenmiyorsa Kontrol Listesi:</strong><br/>
                    <br/>
                    <strong>1. Console'u Kontrol Edin (F12):</strong><br/>
                    • Network sekmesinde playlist.m3u8 isteğini bulun<br/>
                    • Status: 200 OK ✅ veya 403/404 ❌?<br/>
                    <br/>
                    <strong>2. Bunny.net Dashboard Ayarları:</strong><br/>
                    • Stream → Library → Security<br/>
                    • Allowed Referrers: "localhost" ekleyin (veya boş bırakın)<br/>
                    • Token Authentication: ❌ KAPALI<br/>
                    • Block Direct Access: ❌ KAPALI<br/>
                    • CORS: ✅ Allow All Origins<br/>
                    <br/>
                    <strong>3. Video Status:</strong><br/>
                    • Status 4 veya 5 olmalı (yukarıda gösterildi)<br/>
                    • Encoding bitene kadar bekleyin<br/>
                    <br/>
                    <strong>4. CDN Hostname:</strong><br/>
                    • .env dosyasında doğru mu?<br/>
                    • VITE_BUNNY_CDN_HOSTNAME=vz-xxxxx.b-cdn.net<br/>
                    <br/>
                    📚 Detaylı rehber: BUNNY_SETUP.md
                  </p>
                </div>
              </div>
            )}

            {/* Video Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {videoData.title}
                  </h1>
                  {anime && (
                    <Link 
                      to={`/anime/${anime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="text-primary hover:text-primary/80 font-semibold transition-colors"
                    >
                      ← {anime.name}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-white/60 text-sm mb-6">
                <span>⏱️ {Math.floor(videoData.length / 60)} dakika</span>
                <span>👁️ {videoData.views || 0} görüntülenme</span>
                <span>📅 {new Date(videoData.dateUploaded).toLocaleDateString('tr-TR')}</span>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {prevEpisode && (
                  <button
                    onClick={() => {
                      const slug = anime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      navigate(`/watch/${slug}/${seasonNumber}/${currentEpisodeIndex}`)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold"
                  >
                    ← Önceki Bölüm
                  </button>
                )}
                {nextEpisode && (
                  <button
                    onClick={() => {
                      const slug = anime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      navigate(`/watch/${slug}/${seasonNumber}/${currentEpisodeIndex + 2}`)
                    }}
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
                <Link 
                  to={`/watch/${anime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${seasonNumber}/${currentEpisodeIndex + 2}`} 
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {nextEpisode.thumbnailFileName ? (
                    <img
                      src={`https://${import.meta.env.VITE_BUNNY_CDN_HOSTNAME}/${nextEpisode.guid}/${nextEpisode.thumbnailFileName}`}
                      alt={nextEpisode.title}
                      className="w-28 h-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-28 h-16 bg-black/50 rounded-md flex items-center justify-center">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm line-clamp-2">{nextEpisode.title}</p>
                    <p className="text-white/60 text-xs">{Math.floor(nextEpisode.length / 60)} dk</p>
                  </div>
                  <span className="text-primary text-2xl">▶</span>
                </Link>
              </div>
            )}

            {/* All Episodes */}
            {allEpisodes.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h2 className="text-white font-bold text-lg mb-4">Tüm Bölümler ({allEpisodes.length})</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allEpisodes.map((ep, index) => (
                    <Link
                      key={ep.guid}
                      to={`/watch/${anime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${seasonNumber}/${index + 1}`}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        ep.guid === videoId ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        ep.guid === videoId ? 'border-primary text-primary' : 'border-white/20 text-white/60'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm line-clamp-1 ${ep.guid === videoId ? 'text-primary' : 'text-white'}`}>
                          {ep.title}
                        </p>
                        <p className="text-white/60 text-xs">{Math.floor(ep.length / 60)} dk</p>
                      </div>
                      {ep.guid === videoId && (
                        <span className="text-primary text-sm">▶</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to Anime */}
            {anime && (
              <Link
                to={`/anime/${anime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="block bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
              >
                <h2 className="text-white font-bold text-lg mb-2">Anime Sayfası</h2>
                <p className="text-primary font-semibold">{anime.name}</p>
                <p className="text-white/60 text-sm mt-1">Tüm bölümleri görüntüle →</p>
              </Link>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Watch
