import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

function SearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)

  // Mock anime database for search
  const animeDatabase = [
    { id: 1, title: 'Cybernetic Echoes', genre: 'Sci-Fi' },
    { id: 2, title: 'Blade of the Void', genre: 'Action' },
    { id: 3, title: "Shadow's Creed", genre: 'Action' },
    { id: 4, title: 'Cosmic Heart', genre: 'Romance' },
    { id: 5, title: 'Kyoto Mornings', genre: 'Slice of Life' },
    { id: 6, title: 'Iron Genesis', genre: 'Mecha' },
    { id: 7, title: 'Crimson Fist', genre: 'Action' },
    { id: 8, title: "Ronin's Path", genre: 'Historical' },
    { id: 9, title: 'The Unseen', genre: 'Horror' },
    { id: 10, title: 'Echoes of the Past', genre: 'Mystery' }
  ]

  // Handle search input
  useEffect(() => {
    if (query.length > 0) {
      const filtered = animeDatabase.filter(anime =>
        anime.title.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 5)) // Limit to 5 suggestions
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSuggestionClick = () => {
    setQuery('')
    setShowSuggestions(false)
  }

  return (
    <div ref={searchRef} className="relative hidden md:flex items-center">
      <div className="flex items-center bg-card-dark/50 rounded-lg overflow-hidden border border-white/10 focus-within:border-primary transition-colors">
        <div className="px-3 text-primary/60">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowSuggestions(true)}
          placeholder="Search for anime..."
          className="bg-transparent text-white placeholder-white/50 px-4 py-2 outline-none w-64"
        />
      </div>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-0 right-0 bg-card-dark border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
          >
            {suggestions.map((anime) => (
              <Link
                key={anime.id}
                to={`/watch/${anime.id}`}
                onClick={handleSuggestionClick}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
              >
                <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{anime.title}</p>
                  <p className="text-white/60 text-xs">{anime.genre}</p>
                </div>
                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchBar
