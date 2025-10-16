import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AddToListModal from '../components/AddToListModal'

function AnimeDetail() {
  const { animeSlug } = useParams()
  const navigate = useNavigate()
  const [anime, setAnime] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [showAllEpisodes, setShowAllEpisodes] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [error, setError] = useState('')
  const [showAddToListModal, setShowAddToListModal] = useState(false)

  useEffect(() => {
    loadAnimeDetails()
  }, [animeSlug])

  const loadAnimeDetails = async () => {
    setLoading(true)
    setError('')
    
    try {
      // 1. Anime metadata'sını anime.json'dan al
      const animeListResponse = await fetch('http://localhost:5002/api/anime/list')
      const animeListData = await animeListResponse.json()
      
      // 2. Bunny sync data'dan sezon bilgilerini al
      const syncResponse = await fetch('http://localhost:5002/api/bunny/sync-data')
      const syncData = await syncResponse.json()
      
      if (animeListData.success && syncData.success) {
        // Anime slug'a göre anime bul (metadata için)
        const animeMetadata = animeListData.animes.find(a => 
          a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === animeSlug.toLowerCase()
        )
        
        // Bunny sync'ten sezon bilgilerini al
        const syncedAnime = syncData.animes.find(a => 
          a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === animeSlug.toLowerCase()
        )
        
        if (!animeMetadata && !syncedAnime) {
          setError('Anime bulunamadı')
          setLoading(false)
          return
        }
        
        // Metadata ve sezon bilgilerini birleştir
        const combinedAnime = {
          ...(animeMetadata || {}),
          ...(syncedAnime || {}),
          // Metadata'dan gelen bilgiler öncelikli
          name: animeMetadata?.name || syncedAnime?.name,
          description: animeMetadata?.description,
          genres: animeMetadata?.genres,
          status: animeMetadata?.status,
          year: animeMetadata?.year,
          rating: animeMetadata?.rating,
          coverImage: animeMetadata?.coverImage,
          createdBy: animeMetadata?.createdBy,
          // Sezon bilgileri syncedAnime'den
          seasons: syncedAnime?.seasons || [],
          totalSeasons: syncedAnime?.totalSeasons || 0,
          totalEpisodes: syncedAnime?.totalEpisodes || 0
        }
        
        setAnime(combinedAnime)
        
        // Sezonları ayarla
        if (combinedAnime.seasons && combinedAnime.seasons.length > 0) {
          setSeasons(combinedAnime.seasons)
          // İlk sezonu seç ve bölümlerini yükle
          loadSeasonEpisodes(combinedAnime.seasons[0])
        }
      }
    } catch (err) {
      console.error('Error loading anime:', err)
      setError('Anime yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadSeasonEpisodes = async (season) => {
    setLoadingEpisodes(true)
    setSelectedSeason(season)
    
    try {
      const videosResponse = await fetch(`http://localhost:5002/api/bunny/collection/${season.collectionId}/videos`)
      const videosData = await videosResponse.json()
      
      if (videosData.success) {
        setEpisodes(videosData.videos)
      }
    } catch (err) {
      console.error('Error loading episodes:', err)
    } finally {
      setLoadingEpisodes(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-white/60">Yükleniyor...</p>
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
            <h1 className="text-4xl font-bold text-white mb-4">😕 Anime Bulunamadı</h1>
            <p className="text-white/60 mb-6">{error || 'Bu anime mevcut değil'}</p>
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

      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="text-primary hover:text-primary/80 mb-6 flex items-center gap-2 transition-colors"
          >
            ← Geri Dön
          </button>

          {/* Anime Header */}
          <div className="glassmorphic rounded-xl p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Cover Image */}
              <div className="w-full md:w-80 flex-shrink-0">
                <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-gradient-to-br from-primary/20 to-background-dark">
                  {anime.coverImage ? (
                    <img
                      src={anime.coverImage}
                      alt={anime.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-8xl">🎬</span>
                    </div>
                  )}
                  
                  {/* Listeye Ekle Butonu */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                    <button
                      onClick={() => setShowAddToListModal(true)}
                      className="w-full px-4 py-3 bg-primary hover:bg-primary/80 text-background-dark font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">+</span>
                      Listeye Ekle
                    </button>
                  </div>
                </div>
              </div>

              {/* Anime Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{anime.name}</h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        anime.status === 'ongoing' ? 'bg-green-500/20 text-green-400' :
                        anime.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {anime.status === 'ongoing' ? '📡 Devam Ediyor' :
                         anime.status === 'completed' ? '✓ Tamamlandı' : '🔜 Yakında'}
                      </span>
                      <span className="text-white/60">📅 {anime.year}</span>
                      <span className="text-white/60">🎭 {anime.genre || 'Belirtilmemiş'}</span>
                    </div>
                  </div>
                </div>

                {anime.description && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-2">📖 Açıklama</h3>
                    <p className="text-white/70 leading-relaxed">{anime.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/20 rounded-lg">
                  <div>
                    <p className="text-white/40 text-sm mb-1">Bölüm Sayısı</p>
                    <p className="text-white font-bold text-xl">{episodes.length}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-sm mb-1">Durum</p>
                    <p className="text-white font-bold text-xl">
                      {anime.status === 'ongoing' ? 'Devam' : anime.status === 'completed' ? 'Bitti' : 'Yakında'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-sm mb-1">Yıl</p>
                    <p className="text-white font-bold text-xl">{anime.year}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-sm mb-1">Ekleyen</p>
                    <p className="text-white font-bold text-xl">{anime.createdBy}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Episodes List */}
          <div className="glassmorphic rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">📺 Bölümler</h2>
              {selectedSeason && (
                <span className="text-white/60 text-sm">
                  {selectedSeason.episodeCount} bölüm
                </span>
              )}
            </div>

            {/* Sezon Seçici */}
            {seasons.length > 1 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {seasons.map((season) => (
                    <button
                      key={season.season}
                      onClick={() => loadSeasonEpisodes(season)}
                      disabled={loadingEpisodes}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        selectedSeason?.season === season.season
                          ? 'bg-primary text-background-dark'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      } disabled:opacity-50`}
                    >
                      Sezon {season.season} ({season.episodeCount} bölüm)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingEpisodes ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                <p className="text-white/60">Bölümler yükleniyor...</p>
              </div>
            ) : episodes.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(showAllEpisodes ? episodes : episodes.slice(0, 12)).map((episode, index) => (
                  <motion.div
                    key={episode.guid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      // Anime slug oluştur
                      const slug = anime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      // Episode number'ı bul (index + 1)
                      const epNumber = index + 1
                      // Sezon numarası
                      const season = selectedSeason?.season || 1
                      navigate(`/watch/${slug}/${season}/${epNumber}`)
                    }}
                    className="bg-black/30 border border-white/10 rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer group"
                  >
                    {/* Thumbnail */}
                    <div className="relative mb-3 rounded-lg overflow-hidden bg-black/50 aspect-video">
                      {episode.thumbnailFileName ? (
                        <img
                          src={`https://${import.meta.env.VITE_BUNNY_CDN_HOSTNAME}/${episode.guid}/${episode.thumbnailFileName}`}
                          alt={episode.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">🎬</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-2xl">▶</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Episode Info */}
                    <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {episode.title}
                    </h3>
                    
                    <div className="flex items-center text-sm text-white/60">
                      <span>⏱️ {Math.floor(episode.length / 60)} dakika</span>
                    </div>
                  </motion.div>
                  ))}
                </div>

                {/* Daha Fazla Göster Butonu */}
                {episodes.length > 12 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                      className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all border border-white/20 hover:border-primary"
                    >
                      {showAllEpisodes ? (
                        <>
                          <span>▲ Daha Az Göster</span>
                        </>
                      ) : (
                        <>
                          <span>▼ Daha Fazla Göster ({episodes.length - 12} bölüm daha)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-white/60 text-lg">Henüz bölüm eklenmemiş</p>
                <p className="text-white/40 text-sm mt-2">
                  Admin panelden bölüm ekleyebilirsiniz
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />
      
      {/* Add to List Modal */}
      <AddToListModal
        isOpen={showAddToListModal}
        onClose={() => setShowAddToListModal(false)}
        anime={anime}
      />
    </div>
  )
}

export default AnimeDetail
