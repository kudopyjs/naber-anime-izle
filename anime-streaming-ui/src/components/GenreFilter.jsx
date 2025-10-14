import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function GenreFilter({ onGenreSelect }) {
  const [showMenu, setShowMenu] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState('All')

  const genres = [
    { name: 'All', icon: '🎬' },
    { name: 'Action', icon: '⚔️' },
    { name: 'Adventure', icon: '🗺️' },
    { name: 'Comedy', icon: '😂' },
    { name: 'Drama', icon: '🎭' },
    { name: 'Fantasy', icon: '🔮' },
    { name: 'Horror', icon: '👻' },
    { name: 'Mystery', icon: '🔍' },
    { name: 'Romance', icon: '💕' },
    { name: 'Sci-Fi', icon: '🚀' },
    { name: 'Slice of Life', icon: '🌸' },
    { name: 'Sports', icon: '⚽' }
  ]

  const handleGenreClick = (genre) => {
    setSelectedGenre(genre.name)
    setShowMenu(false)
    if (onGenreSelect) {
      onGenreSelect(genre.name)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-card-dark/50 hover:bg-card-dark border border-white/10 hover:border-primary rounded-lg transition-all"
      >
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="text-white font-medium text-sm">{selectedGenre}</span>
        <svg 
          className={`w-4 h-4 text-white transition-transform ${showMenu ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-0 w-64 bg-card-dark border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
          >
            <div className="p-2 max-h-96 overflow-y-auto">
              {genres.map((genre) => (
                <button
                  key={genre.name}
                  onClick={() => handleGenreClick(genre)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedGenre === genre.name
                      ? 'bg-primary/20 text-primary'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">{genre.icon}</span>
                  <span className="font-medium text-sm">{genre.name}</span>
                  {selectedGenre === genre.name && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GenreFilter
