import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import SearchBar from './SearchBar'
import GenreFilter from './GenreFilter'

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleGenreSelect = (genre) => {
    console.log('Selected genre:', genre)
    // TODO: Implement genre filtering logic
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-sm border-b border-white/5"
    >
      <div className="flex items-center justify-between px-4 py-4">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="text-3xl text-primary group-hover:scale-110 transition-transform">
              🎌
            </div>
            <span className="text-xl font-bold text-white hidden md:block">
              ANIMEX
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-white hover:text-primary transition-colors font-medium"
            >
              Home
            </Link>
            <a 
              href="#genres" 
              className="text-white hover:text-primary transition-colors font-medium"
            >
              Genres
            </a>
            <a 
              href="#episodes" 
              className="text-white hover:text-primary transition-colors font-medium"
            >
              New Episodes
            </a>
            <a 
              href="#mylist" 
              className="text-white hover:text-primary transition-colors font-medium"
            >
              My List
            </a>
          </div>
        </div>

        {/* Search, Filter and User */}
        <div className="flex items-center gap-4">
          {/* Genre Filter */}
          <GenreFilter onGenreSelect={handleGenreSelect} />
          
          {/* Search Bar with Suggestions */}
          <SearchBar />

          {/* User Profile */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-card-dark hover:bg-primary/20 border border-white/10 hover:border-primary transition-all"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-white text-sm hidden md:block">{user.username}</span>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-card-dark border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-white font-semibold text-sm">{user.username}</p>
                    <p className="text-white/60 text-xs truncate">{user.email}</p>
                    <p className="text-primary text-xs mt-1 font-semibold uppercase">{user.role}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/"
                      className="block px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                      onClick={() => setShowUserMenu(false)}
                    >
                      My List
                    </Link>
                    <Link
                      to="/"
                      className="block px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Settings
                    </Link>
                    
                    {/* Fansub/Admin Upload Option */}
                    {(user.role === 'fansub' || user.role === 'admin') && (
                      <Link
                        to="/upload"
                        className="block px-4 py-2 text-primary hover:bg-white/10 transition-colors text-sm font-semibold"
                        onClick={() => setShowUserMenu(false)}
                      >
                        📤 Upload Video
                      </Link>
                    )}
                    
                    {/* Admin Panel Option */}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-primary-magenta hover:bg-white/10 transition-colors text-sm font-semibold"
                        onClick={() => setShowUserMenu(false)}
                      >
                        ⚙️ Admin Panel
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-white/10">
                    <button
                      onClick={() => {
                        logout()
                        setShowUserMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/10 transition-colors text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/login"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-card-dark hover:bg-primary/20 border border-white/10 hover:border-primary transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
