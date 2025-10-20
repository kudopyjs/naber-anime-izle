import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import aniwatchApi from '../services/aniwatchApi'

function SearchBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef(null)

  // Handle search input with debounce
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length > 2) {
        setLoading(true)
        try {
          const data = await aniwatchApi.getSearchSuggestions(query)
          if (data.status === 200 && data.data?.suggestions) {
            setSuggestions(data.data.suggestions.slice(0, 5))
            setShowSuggestions(true)
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error)
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchSuggestions()
    }, 300)

    return () => clearTimeout(debounceTimer)
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
      setQuery('')
      setShowSuggestions(false)
    }
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
          onKeyPress={handleKeyPress}
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
                to={`/anime/${anime.id}`}
                onClick={handleSuggestionClick}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
              >
                {anime.poster && (
                  <img
                    src={anime.poster}
                    alt={anime.name}
                    className="w-12 h-16 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm line-clamp-1">{anime.name}</p>
                  <p className="text-white/60 text-xs line-clamp-1">{anime.jname}</p>
                  {anime.moreInfo && anime.moreInfo.length > 0 && (
                    <p className="text-white/40 text-xs">{anime.moreInfo.join(' • ')}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
