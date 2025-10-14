import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function Navbar() {
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

        {/* Search and User */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="hidden md:flex items-center bg-card-dark/50 rounded-lg overflow-hidden border border-white/10 focus-within:border-primary transition-colors">
            <div className="px-3 text-primary/60">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for anime..."
              className="bg-transparent text-white placeholder-white/50 px-4 py-2 outline-none w-64"
            />
          </div>

          {/* User Profile */}
          <Link 
            to="/login"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-card-dark hover:bg-primary/20 border border-white/10 hover:border-primary transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
