import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import aniwatchApi from '../services/aniwatchApi'

function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    
    if (q) {
      setQuery(q)
      setCurrentPage(page)
      performSearch(q, page)
    }
  }, [searchParams])

  const performSearch = async (searchQuery, page = 1) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/v2/hianime/search?q=${encodeURIComponent(searchQuery)}&page=${page}`)
      const data = await response.json()

      if (data.status === 200 && data.data) {
        setResults(data.data.animes || [])
        setTotalPages(data.data.totalPages || 1)
        setCurrentPage(data.data.currentPage || page)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query, page: '1' })
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ q: query, page: newPage.toString() })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            🔍 Search Anime
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for anime..."
                  className="w-full px-4 py-3 bg-card-dark border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-magenta hover:from-primary/80 hover:to-primary-magenta/80 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <>
            {results.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-white/80">
                    Found <span className="text-primary font-bold">{results.length}</span> results for "{query}"
                    {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.map((anime) => (
                    <motion.div
                      key={anime.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link
                        to={`/anime/${anime.id}`}
                        className="group block bg-card-dark rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                      >
                        <div className="relative aspect-[2/3] overflow-hidden">
                          <img
                            src={anime.poster}
                            alt={anime.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          {anime.type && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-primary/90 rounded text-xs font-bold text-white">
                              {anime.type}
                            </div>
                          )}
                          {anime.episodes && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs text-white">
                              {anime.episodes.sub && `SUB: ${anime.episodes.sub}`}
                              {anime.episodes.sub && anime.episodes.dub && ' | '}
                              {anime.episodes.dub && `DUB: ${anime.episodes.dub}`}
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {anime.name}
                          </h3>
                          {anime.jname && (
                            <p className="text-white/60 text-xs mt-1 line-clamp-1">
                              {anime.jname}
                            </p>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-card-dark border border-white/10 rounded-lg text-white hover:bg-primary/20 hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex gap-2">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              currentPage === pageNum
                                ? 'bg-primary text-white'
                                : 'bg-card-dark border border-white/10 text-white hover:bg-primary/20 hover:border-primary'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-card-dark border border-white/10 rounded-lg text-white hover:bg-primary/20 hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">😢</div>
                <h2 className="text-2xl font-bold text-white mb-2">No Results Found</h2>
                <p className="text-white/60">Try searching with different keywords</p>
              </div>
            )}
          </>
        )}

        {/* Initial State */}
        {!hasSearched && !loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">Search for Your Favorite Anime</h2>
            <p className="text-white/60">Enter a keyword above to start searching</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
