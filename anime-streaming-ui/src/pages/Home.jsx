import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CategoryRow from '../components/CategoryRow'
import { animeData } from '../data/mockData'

function Home() {
  const { featured, popular, action, horror } = animeData

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative min-h-[600px] flex items-end"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={featured.image}
            alt={featured.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
              {featured.title}
            </h1>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              {featured.description}
            </p>
            <Link
              to={`/watch/${featured.id}`}
              className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-background-dark font-bold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-neon-cyan"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Now
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto py-12">
        <CategoryRow title="Popular Now" animes={popular} genre="action" />
        <CategoryRow title="Action" animes={action} genre="action" />
        <CategoryRow title="Horror" animes={horror} genre="horror" />
      </div>

      <Footer />
    </div>
  )
}

export default Home
