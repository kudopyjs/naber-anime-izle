import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getWatchHistory, removeFromHistory } from '../utils/watchHistory'

function ContinueWatching() {
  const [watchHistory, setWatchHistory] = useState([])

  useEffect(() => {
    loadWatchHistory()
  }, [])

  const loadWatchHistory = () => {
    const history = getWatchHistory()
    console.log('📺 Continue Watching - Loaded history:', history.length, 'items')
    console.log('📺 History data:', history)
    
    // Log the constructed URLs for debugging
    history.forEach(anime => {
      const epId = anime.episodeId.split('?ep=')[1] || anime.episodeNumber
      // animeId is already the full anime slug (e.g., "no-longer-allowed-in-another-world-19247")
      const url = `/watch/${anime.animeId}?ep=${epId}`
      console.log(`🔗 ${anime.animeName} Ep${anime.episodeNumber} → ${url}`)
      console.log(`   animeId: ${anime.animeId}, episodeId: ${anime.episodeId}`)
    })
    
    setWatchHistory(history)
  }

  const handleRemove = (animeId, e) => {
    e.preventDefault()
    e.stopPropagation()
    removeFromHistory(animeId)
    loadWatchHistory()
  }

  // Don't show if no watch history
  if (watchHistory.length === 0) return null

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-white text-2xl font-bold tracking-tight">
          Continue Watching
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-4">
        {watchHistory.map((anime) => (
          <motion.div
            key={anime.animeId}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 w-80 relative group"
          >
            <Link to={`/watch/${anime.animeId}?ep=${anime.episodeId.split('?ep=')[1] || anime.episodeNumber}`}>
              <div className="rounded-xl overflow-hidden bg-card-dark/50 shadow-lg hover:glow-cyan transition-all duration-300 border border-white/5">
                {/* Remove Button */}
                <button
                  onClick={(e) => handleRemove(anime.animeId, e)}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  title="Remove from history"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Thumbnail with Progress */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={anime.poster}
                    alt={anime.animeName}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${anime.progress}%` }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-base mb-1 truncate">
                    {anime.animeName}
                  </h3>
                  <p className="text-white/60 text-sm">
                    Episode {anime.episodeNumber} • {anime.progress}% watched
                  </p>
                  <p className="text-white/40 text-xs mt-1 truncate">
                    {anime.episodeTitle}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ContinueWatching
