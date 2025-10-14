import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

function ContinueWatching() {
  const { user } = useAuth()

  // Mock data - in production, this would come from user's watch history
  const continueWatchingData = [
    {
      id: 1,
      title: 'Cybernetic Echoes',
      episode: 7,
      progress: 65, // percentage
      thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrM-ake220VcwIftnHrIBbIruMwoHsP0iO4gGDwt2-vO7jxWiVzTn3KZmB-HlU2QtwfroYqwNR5kSGayfF2iv9JZ25jMkamJTO37KfGqtKKYXm5hCabPAnzqEYa1aRCiFO1CNtOiIfK8XM1CtFl89-FJ1SyYfJoJ3XwikRzpJCopobZfVWQBrL6MV-ENHSaOTodRbqmD8wOHEpQyEOnde16fTVrKRSbsYVvipRnsQMAKxHFkJkpP9fAHR7j0Bu147LyRwLsH_y4k2I'
    },
    {
      id: 2,
      title: 'Blade of the Void',
      episode: 12,
      progress: 30,
      thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtCYVBqXi_y3XIWh3y2JG93_7kWHsNPzZundyKLW-bwPPav8SLhboFyP9KVzfA1TqaMUQsxCPtcHXnxZBgVKaTmJThv-nXy8KdedtzxMCe0l0Kw8VIjpQbsq4v6PX1gwWEmiTEiBr7g5zYW5mUoMDMDCwUwdp-AsmpLkXrZOHFkQLPNFx1onJozIVZwnSv91oGmJEz6f2y_c3K_kgD7Xbf3wWWxGVDlpliuLKHiGK5I1LcmkTkWO8oFDYdczaiiG8Up3wrFtaNzM3E'
    },
    {
      id: 3,
      title: "Shadow's Creed",
      episode: 5,
      progress: 80,
      thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAc2ypnUaAZX6m49SpUOVfun7xws2fGNnJylXkXbXz0xUkJtoy9k1NK-cH4wgcmvBx5c3l7po65ByfRn6KXP5tPPo9MJ7jCLNq2ZFnNFpLL3n7VbN8-_x41YOqry_djcng04jqV5hPJ429eKudWPJx9Zak8FbPPxLf-neeG3BwZth74NmHoePFozi5fM36mealhLuzx_o7nd6o7pJqfVUCDnc7Q_UXdKZYHSOtRxlX_cL6XI9kjAc2mMXKOA5AmZGOAV6qBKTqszfX9'
    }
  ]

  // Don't show if user is not logged in
  if (!user) return null

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-white text-2xl font-bold tracking-tight">
          Continue Watching
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-4">
        {continueWatchingData.map((anime) => (
          <motion.div
            key={anime.id}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 w-80"
          >
            <Link to={`/watch/${anime.id}`}>
              <div className="rounded-xl overflow-hidden bg-card-dark/50 shadow-lg hover:glow-cyan transition-all duration-300 border border-white/5">
                {/* Thumbnail with Progress */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={anime.thumbnail}
                    alt={anime.title}
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
                    {anime.title}
                  </h3>
                  <p className="text-white/60 text-sm">
                    Episode {anime.episode} • {anime.progress}% watched
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
