import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

function SpotlightCarousel({ spotlightAnimes }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Auto-play carousel
  useEffect(() => {
    if (!spotlightAnimes || spotlightAnimes.length === 0) return

    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % spotlightAnimes.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [spotlightAnimes])

  if (!spotlightAnimes || spotlightAnimes.length === 0) {
    return null
  }

  const currentAnime = spotlightAnimes[currentIndex]

  const goToNext = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % spotlightAnimes.length)
  }

  const goToPrev = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + spotlightAnimes.length) % spotlightAnimes.length)
  }

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  return (
    <div className="relative min-h-[600px] flex items-end overflow-hidden">
      {/* Background Image with Animation */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0"
        >
          {currentAnime.poster ? (
            <img
              src={currentAnime.poster}
              alt={currentAnime.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-background-dark" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
        aria-label="Previous"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
        aria-label="Next"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-20 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            {/* Rank Badge */}
            {currentAnime.rank && (
              <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 mb-4">
                <span className="text-primary font-bold">#{currentAnime.rank}</span>
                <span className="text-white/80 text-sm">Spotlight</span>
              </div>
            )}

            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
              {currentAnime.name}
            </h1>

            {/* Anime Info */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-white/70">
              {currentAnime.type && (
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                  {currentAnime.type}
                </span>
              )}
              {currentAnime.episodes?.sub && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  {currentAnime.episodes.sub} Episodes
                </span>
              )}
              {currentAnime.duration && (
                <span>{currentAnime.duration}</span>
              )}
            </div>

            <p className="text-white/80 text-lg mb-6 leading-relaxed line-clamp-3">
              {currentAnime.description || 'Harika bir anime serisi sizi bekliyor!'}
            </p>

            <div className="flex gap-4">
              <Link
                to={`/anime/${currentAnime.id}`}
                className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-background-dark font-bold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-neon-cyan"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                İzlemeye Başla
              </Link>

              <Link
                to={`/anime/${currentAnime.id}`}
                className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-lg transition-all backdrop-blur-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Detaylar
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {spotlightAnimes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all ${
              index === currentIndex
                ? 'w-8 h-2 bg-primary'
                : 'w-2 h-2 bg-white/30 hover:bg-white/50'
            } rounded-full`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default SpotlightCarousel
