import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CategoryRow from '../components/CategoryRow'
import ContinueWatching from '../components/ContinueWatching'
import aniwatchApi from '../services/aniwatchApi'

function Home() {
  const [homeData, setHomeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [featuredAnime, setFeaturedAnime] = useState(null)
  const { scrollY } = useScroll()
  
  // Parallax effect for hero image
  const heroY = useTransform(scrollY, [0, 500], [0, 150])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Aniwatch API'den ana sayfa verilerini al
      const response = await aniwatchApi.getHomePage()
      
      console.log('🔍 API Response:', response)
      console.log('📊 Data:', response.data)

      // API response'u {status: 200, data: {...}} formatında geliyor
      if (response.status === 200 && response.data) {
        setHomeData(response.data)
        
        console.log('🔥 Trending:', response.data.trendingAnimes?.length || 0)
        console.log('⭐ Popular:', response.data.mostPopularAnimes?.length || 0)
        console.log('🆕 Latest:', response.data.latestEpisodeAnimes?.length || 0)
        console.log('✅ Data loaded successfully!')
        
        // Spotlight anime'lerden birini featured olarak ayarla
        if (response.data.spotlightAnimes && response.data.spotlightAnimes.length > 0) {
          const featured = response.data.spotlightAnimes[0]
          setFeaturedAnime({
            name: featured.name,
            description: featured.description,
            coverImage: featured.poster,
            genres: response.data.genres?.slice(0, 3) || [],
            id: featured.id
          })
        }
      } else {
        console.error('❌ API returned unexpected response:', response)
      }
    } catch (error) {
      console.error('❌ Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // API'den gelen kategorileri kullan
  const trendingAnimes = homeData?.trendingAnimes || []
  const popularAnimes = homeData?.mostPopularAnimes || []
  const latestAnimes = homeData?.latestEpisodeAnimes || []
  const topAiringAnimes = homeData?.topAiringAnimes || []
  const mostFavoriteAnimes = homeData?.mostFavoriteAnimes || []
  const latestCompletedAnimes = homeData?.latestCompletedAnimes || []

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

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      {/* Hero Section with Parallax */}
      {featuredAnime && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative min-h-[600px] flex items-end overflow-hidden"
        >
          {/* Background Image with Parallax */}
          <motion.div 
            className="absolute inset-0"
            style={{ y: heroY }}
          >
            {featuredAnime.coverImage ? (
              <motion.img
                src={featuredAnime.coverImage}
                alt={featuredAnime.name}
                className="w-full h-full object-cover scale-110"
                style={{ opacity: heroOpacity }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-background-dark" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent" />
          </motion.div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="max-w-2xl"
            >
              <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
                {featuredAnime.name}
              </h1>
              <p className="text-white/80 text-lg mb-4 leading-relaxed">
                {featuredAnime.description || 'Harika bir anime serisi sizi bekliyor!'}
              </p>
              {featuredAnime.genres && featuredAnime.genres.length > 0 && (
                <div className="flex gap-2 mb-8">
                  {featuredAnime.genres.slice(0, 3).map((genre, index) => (
                    <span key={index} className="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              <Link
                to={`/anime/${featuredAnime.id}`}
                className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-background-dark font-bold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-neon-cyan"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                İzlemeye Başla
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto py-12">
        {/* Continue Watching - Only shows for logged in users */}
        <ContinueWatching />
        
        {trendingAnimes.length > 0 && (
          <CategoryRow title="🔥 Trend Animeler" animes={trendingAnimes} />
        )}
        
        {topAiringAnimes.length > 0 && (
          <CategoryRow title="📡 Yayında" animes={topAiringAnimes} />
        )}
        
        {popularAnimes.length > 0 && (
          <CategoryRow title="⭐ En Popüler" animes={popularAnimes} />
        )}
        
        {mostFavoriteAnimes.length > 0 && (
          <CategoryRow title="❤️ En Sevilen" animes={mostFavoriteAnimes} />
        )}
        
        {latestAnimes.length > 0 && (
          <CategoryRow title="🆕 Son Bölümler" animes={latestAnimes} />
        )}
        
        {latestCompletedAnimes.length > 0 && (
          <CategoryRow title="✅ Tamamlanan" animes={latestCompletedAnimes} />
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Home
