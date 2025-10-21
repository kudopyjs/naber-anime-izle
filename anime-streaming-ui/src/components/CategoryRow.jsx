import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AnimeCard from './AnimeCard'

function CategoryRow({ title, animes, genre = 'action' }) {
  const scrollRef = useRef(null)
  const [uniqueAnimes, setUniqueAnimes] = useState([])

  // Remove duplicates based on anime id
  useEffect(() => {
    const seen = new Set()
    const filtered = animes.filter(anime => {
      if (seen.has(anime.id)) {
        return false
      }
      seen.add(anime.id)
      return true
    })
    setUniqueAnimes(filtered)
  }, [animes])

  // Duplicate animes for infinite scroll effect (5 copies for smoother experience)
  const displayAnimes = uniqueAnimes.length > 0 
    ? [...uniqueAnimes, ...uniqueAnimes, ...uniqueAnimes, ...uniqueAnimes, ...uniqueAnimes]
    : []

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Handle infinite scroll with seamless looping
  useEffect(() => {
    const container = scrollRef.current
    if (!container || displayAnimes.length === 0) return

    let isScrolling = false
    let scrollTimeout

    const handleScroll = () => {
      // Clear timeout
      clearTimeout(scrollTimeout)
      
      // Set scrolling flag
      isScrolling = true
      
      // Set timeout to detect when scrolling stops
      scrollTimeout = setTimeout(() => {
        isScrolling = false
        
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth
        const scrollLeft = container.scrollLeft
        const maxScroll = scrollWidth - clientWidth
        
        // Calculate one set width (1/5 of total since we have 5 copies)
        const oneSetWidth = scrollWidth / 5
        
        // If we're near the end (last 20%), jump to equivalent position in middle
        if (scrollLeft > maxScroll - oneSetWidth * 0.2) {
          const offset = scrollLeft - (oneSetWidth * 4)
          container.scrollLeft = oneSetWidth * 2 + offset
        }
        // If we're near the start (first 20%), jump to equivalent position in middle
        else if (scrollLeft < oneSetWidth * 0.2) {
          const offset = scrollLeft
          container.scrollLeft = oneSetWidth * 2 + offset
        }
      }, 150) // Wait 150ms after scroll stops
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Set initial position to middle set (2/5 of total width)
    setTimeout(() => {
      const oneSetWidth = container.scrollWidth / 5
      container.scrollLeft = oneSetWidth * 2
    }, 100)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [displayAnimes])

  return (
    <div className="mb-12">
      {/* Title */}
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-white text-2xl font-bold tracking-tight">
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full bg-card-dark/50 hover:bg-primary/20 border border-white/10 hover:border-primary flex items-center justify-center transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full bg-card-dark/50 hover:bg-primary/20 border border-white/10 hover:border-primary flex items-center justify-center transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-4"
      >
        {displayAnimes.map((anime, index) => (
          <AnimeCard
            key={`${anime.id}-${index}`}
            id={anime.id}
            title={anime.name || anime.title}
            rating={anime.rating || 'N/A'}
            image={anime.poster || anime.coverImage || anime.image}
            genre={anime.genres?.[0] || genre}
            episodes={anime.episodes}
            type={anime.type}
          />
        ))}
      </div>
    </div>
  )
}

export default CategoryRow
