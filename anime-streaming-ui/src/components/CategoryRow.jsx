import { useRef } from 'react'
import { motion } from 'framer-motion'
import AnimeCard from './AnimeCard'

function CategoryRow({ title, animes, genre = 'action' }) {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

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
        {animes.map((anime) => (
          <AnimeCard
            key={anime.id}
            id={anime.id}
            title={anime.title}
            rating={anime.rating}
            image={anime.image}
            genre={genre}
          />
        ))}
      </div>
    </div>
  )
}

export default CategoryRow
