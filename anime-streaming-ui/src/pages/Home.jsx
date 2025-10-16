import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CategoryRow from '../components/CategoryRow'
import ContinueWatching from '../components/ContinueWatching'

function Home() {
  const [animes, setAnimes] = useState([])
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
      // Sadece anime listesini yükle (collections'a ihtiyaç yok)
      const animesResponse = await fetch('http://localhost:5002/api/anime/list')
      const animesData = await animesResponse.json()

      if (animesData.success) {
        setAnimes(animesData.animes)
        // İlk anime'yi featured olarak ayarla
        if (animesData.animes.length > 0) {
          setFeaturedAnime(animesData.animes[0])
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Anime'leri kategorilere ayır
  const getAnimesByGenre = (genre) => {
    return animes.filter(anime => 
      anime.genres?.some(g => g.toLowerCase().includes(genre.toLowerCase()))
    )
  }

  // En popüler animeler (en yeni eklenenler)
  const popularAnimes = [...animes]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)

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
                to={`/anime/${featuredAnime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
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
        
        {popularAnimes.length > 0 && (
          <CategoryRow title="🔥 Popüler Animeler" animes={popularAnimes} />
        )}
        
        {getAnimesByGenre('action').length > 0 && (
          <CategoryRow title="⚔️ Aksiyon" animes={getAnimesByGenre('action')} />
        )}
        
        {getAnimesByGenre('comedy').length > 0 && (
          <CategoryRow title="😂 Komedi" animes={getAnimesByGenre('comedy')} />
        )}
        
        {getAnimesByGenre('drama').length > 0 && (
          <CategoryRow title="🎭 Drama" animes={getAnimesByGenre('drama')} />
        )}
        
        {animes.length > 0 && (
          <CategoryRow title="📺 Tüm Animeler" animes={animes} />
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Home
