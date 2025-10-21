import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CategoryRow from '../components/CategoryRow'
import ContinueWatching from '../components/ContinueWatching'
import SpotlightCarousel from '../components/SpotlightCarousel'
import aniwatchApi from '../services/aniwatchApi'

function Home() {
  const [homeData, setHomeData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Paralel olarak tüm verileri çek
      const [homeResponse, topAiringResponse, trendingResponse, popularResponse, favoriteResponse, completedResponse, recentlyUpdatedResponse] = await Promise.all([
        aniwatchApi.getHomePage(),
        aniwatchApi.getTopAiring(1),
        aniwatchApi.getAnimesByCategory('most-favorite', 1), // Trending için most-favorite kullan
        aniwatchApi.getMostPopular(1),
        aniwatchApi.getMostFavorite(1),
        aniwatchApi.getCompleted(1),
        aniwatchApi.getRecentlyUpdated(1)
      ])

      console.log('🔍 API Responses loaded')

      // Combine all data
      const combinedData = {
        spotlightAnimes: homeResponse.data?.spotlightAnimes || [],
        topAiringAnimes: topAiringResponse.data?.animes || [],
        trendingAnimes: trendingResponse.data?.animes || [],
        mostPopularAnimes: popularResponse.data?.animes || [],
        mostFavoriteAnimes: favoriteResponse.data?.animes || [],
        latestCompletedAnimes: completedResponse.data?.animes || [],
        latestEpisodeAnimes: recentlyUpdatedResponse.data?.animes || []
      }

      setHomeData(combinedData)
      
      console.log('📡 Yayında:', combinedData.topAiringAnimes.length)
      console.log('🔥 Trend:', combinedData.trendingAnimes.length)
      console.log('⭐ Popüler:', combinedData.mostPopularAnimes.length)
      console.log('❤️ Favori:', combinedData.mostFavoriteAnimes.length)
      console.log('✅ Tamamlanan:', combinedData.latestCompletedAnimes.length)
      console.log('🆕 Son Bölümler:', combinedData.latestEpisodeAnimes.length)
      console.log('💫 Spotlight:', combinedData.spotlightAnimes.length)
      console.log('✅ Data loaded successfully!')
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

      {/* Spotlight Carousel */}
      {homeData?.spotlightAnimes && homeData.spotlightAnimes.length > 0 && (
        <SpotlightCarousel spotlightAnimes={homeData.spotlightAnimes} />
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
