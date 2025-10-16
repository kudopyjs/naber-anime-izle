import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function AnimeCard({ id, title, rating, image, genre = 'action' }) {
  const glowColor = genre === 'horror' ? 'glow-magenta' : 'glow-cyan'
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ duration: 0.3 }}
      className="flex-shrink-0 w-60"
    >
      <Link to={`/anime/${slug}`}>
        <div className={`rounded-xl overflow-hidden bg-card-dark/50 shadow-lg hover:${glowColor} transition-all duration-300 border border-white/5`}>
          {/* Thumbnail */}
          <div className="relative aspect-[3/4] overflow-hidden">
            {image ? (
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.classList.add('bg-gradient-to-br', 'from-primary/20', 'to-background-dark')
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-background-dark flex items-center justify-center">
                <span className="text-6xl">🎬</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4">
                <button className="w-full bg-primary hover:bg-primary/80 text-background-dark font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  İzle
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="text-white font-semibold text-base mb-2 truncate">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span className="text-primary text-sm font-medium">{rating}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default AnimeCard
