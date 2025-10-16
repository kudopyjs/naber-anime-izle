import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

function BulkAnimeImport() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [animeDetails, setAnimeDetails] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [episodes, setEpisodes] = useState([])
  const [selectedEpisodes, setSelectedEpisodes] = useState([])
  const [importStatus, setImportStatus] = useState({})

  // TürkAnime API'sinden anime listesi çek
  const searchAnime = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Simüle edilmiş API çağrısı - gerçek implementasyonda backend'e istek atılacak
      // Backend, turkanime-indirici'deki get_anime_listesi metodunu kullanacak
      const response = await fetch(`http://localhost:5002/api/turkanime/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error('Arama hatası:', error)
      // Demo için mock data
      setSearchResults([
        { slug: 'non-non-biyori', name: 'Non Non Biyori' },
        { slug: 'naruto', name: 'Naruto' },
        { slug: 'one-piece', name: 'One Piece' },
      ].filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())))
    } finally {
      setIsSearching(false)
    }
  }

  // Anime detaylarını ve bölümlerini çek
  const loadAnimeDetails = async (slug) => {
    setIsLoadingDetails(true)
    setSelectedAnime(slug)
    setAnimeDetails(null)
    setEpisodes([])
    setSelectedEpisodes([])

    try {
      // Backend'den anime detaylarını çek
      const response = await fetch(`http://localhost:5002/api/turkanime/anime/${slug}`)
      const data = await response.json()
      
      setAnimeDetails(data.info)
      setEpisodes(data.episodes || [])
    } catch (error) {
      console.error('Detay yükleme hatası:', error)
      // Demo için mock data
      setAnimeDetails({
        title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        image: 'https://via.placeholder.com/300x400',
        genre: ['Action', 'Adventure'],
        rating: 8.5,
        summary: 'Anime açıklaması buraya gelecek...',
        studio: 'Studio Name',
        episodeCount: 24
      })
      setEpisodes(
        Array.from({ length: 12 }, (_, i) => ({
          slug: `${slug}-${i + 1}-bolum`,
          title: `${i + 1}. Bölüm`,
          number: i + 1
        }))
      )
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Bölüm seçimi toggle
  const toggleEpisode = (episodeSlug) => {
    setSelectedEpisodes(prev => 
      prev.includes(episodeSlug)
        ? prev.filter(s => s !== episodeSlug)
        : [...prev, episodeSlug]
    )
  }

  // Tümünü seç/kaldır
  const toggleAllEpisodes = () => {
    if (selectedEpisodes.length === episodes.length) {
      setSelectedEpisodes([])
    } else {
      setSelectedEpisodes(episodes.map(ep => ep.slug))
    }
  }

  // Seçili bölümleri içe aktar
  const importSelectedEpisodes = async () => {
    if (selectedEpisodes.length === 0) {
      alert('Lütfen en az bir bölüm seçin!')
      return
    }

    const confirmed = confirm(`${selectedEpisodes.length} bölüm içe aktarılacak. Bu işlem uzun sürebilir. Devam edilsin mi?`)
    if (!confirmed) return

    // Her bölüm için import işlemi başlat
    const newStatus = {}
    selectedEpisodes.forEach(slug => {
      newStatus[slug] = { status: 'pending', progress: 0, message: 'Bekliyor...' }
    })
    setImportStatus(newStatus)

    // Sırayla bölümleri işle
    for (const episodeSlug of selectedEpisodes) {
      try {
        setImportStatus(prev => ({
          ...prev,
          [episodeSlug]: { status: 'processing', progress: 0, message: 'Video indiriliyor ve yükleniyor...' }
        }))

        // Backend'e bölüm import isteği gönder
        const response = await fetch('http://localhost:5002/api/turkanime/import-episode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animeSlug: selectedAnime,
            episodeSlug: episodeSlug,
            uploadedBy: user.username
          })
        })

        const result = await response.json()

        if (result.success) {
          // Başarılı import - localStorage'a kaydet
          if (result.animeData) {
            const existingAnime = JSON.parse(localStorage.getItem('uploadedAnime') || '[]')
            existingAnime.push(result.animeData)
            localStorage.setItem('uploadedAnime', JSON.stringify(existingAnime))
          }
          
          setImportStatus(prev => ({
            ...prev,
            [episodeSlug]: { status: 'completed', progress: 100, message: result.message || 'Tamamlandı!' }
          }))
        } else {
          throw new Error(result.error || 'Import failed')
        }
      } catch (error) {
        console.error(`Bölüm import hatası (${episodeSlug}):`, error)
        setImportStatus(prev => ({
          ...prev,
          [episodeSlug]: { status: 'error', progress: 0, error: error.message, message: 'Hata oluştu!' }
        }))
      }
    }
    
    alert(`İçe aktarma tamamlandı! ${Object.values(importStatus).filter(s => s.status === 'completed').length} bölüm başarılı.`)
  }

  // Enter tuşu ile arama
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchAnime()
    }
  }

  return (
    <div className="space-y-6">
      {/* Arama Bölümü */}
      <div className="glassmorphic rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">TürkAnime'den Anime Ara</h2>
        
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Anime adı yazın... (örn: Naruto, One Piece)"
            className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary"
          />
          <button
            onClick={searchAnime}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-primary hover:bg-primary/80 text-background-dark font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? '🔍 Aranıyor...' : '🔍 Ara'}
          </button>
        </div>

        {/* Arama Sonuçları */}
        {searchResults.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-white font-semibold mb-3">Arama Sonuçları ({searchResults.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((anime) => (
                <motion.button
                  key={anime.slug}
                  onClick={() => loadAnimeDetails(anime.slug)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAnime === anime.slug
                      ? 'bg-primary/20 border-primary'
                      : 'bg-black/30 border-white/10 hover:border-primary/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-white font-semibold">{anime.name}</div>
                  <div className="text-white/50 text-sm">{anime.slug}</div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Anime Detayları ve Bölüm Seçimi */}
      <AnimatePresence>
        {selectedAnime && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glassmorphic rounded-xl p-6"
          >
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-white text-lg">⏳ Anime detayları yükleniyor...</div>
              </div>
            ) : animeDetails ? (
              <div className="space-y-6">
                {/* Anime Bilgileri */}
                <div className="flex gap-6">
                  <img
                    src={animeDetails.image}
                    alt={animeDetails.title}
                    className="w-48 h-64 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2">{animeDetails.title}</h2>
                    <div className="flex gap-2 mb-3">
                      {animeDetails.genre?.map((g, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                          {g}
                        </span>
                      ))}
                    </div>
                    <div className="text-white/80 mb-2">⭐ {animeDetails.rating}/10</div>
                    <div className="text-white/80 mb-2">🎬 {animeDetails.studio}</div>
                    <div className="text-white/80 mb-4">📺 {animeDetails.episodeCount} Bölüm</div>
                    <p className="text-white/60 text-sm">{animeDetails.summary}</p>
                  </div>
                </div>

                {/* Bölüm Seçimi */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                      Bölümleri Seç ({selectedEpisodes.length}/{episodes.length})
                    </h3>
                    <div className="flex gap-3">
                      <button
                        onClick={toggleAllEpisodes}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      >
                        {selectedEpisodes.length === episodes.length ? '❌ Tümünü Kaldır' : '✅ Tümünü Seç'}
                      </button>
                      <button
                        onClick={importSelectedEpisodes}
                        disabled={selectedEpisodes.length === 0}
                        className="px-6 py-2 bg-primary hover:bg-primary/80 text-background-dark font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        📥 İçe Aktar ({selectedEpisodes.length})
                      </button>
                    </div>
                  </div>

                  {/* Bölüm Listesi */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                    {episodes.map((episode) => {
                      const isSelected = selectedEpisodes.includes(episode.slug)
                      const status = importStatus[episode.slug]

                      return (
                        <motion.button
                          key={episode.slug}
                          onClick={() => toggleEpisode(episode.slug)}
                          className={`p-3 rounded-lg border-2 transition-all relative ${
                            status?.status === 'completed'
                              ? 'bg-green-500/20 border-green-500'
                              : status?.status === 'error'
                              ? 'bg-red-500/20 border-red-500'
                              : status?.status === 'processing'
                              ? 'bg-yellow-500/20 border-yellow-500'
                              : isSelected
                              ? 'bg-primary/20 border-primary'
                              : 'bg-black/30 border-white/10 hover:border-primary/50'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={status?.status === 'processing'}
                        >
                          <div className="text-white font-semibold text-sm">
                            {episode.number || episode.title}
                          </div>
                          {status?.status === 'completed' && (
                            <div className="absolute top-1 right-1 text-green-400">✓</div>
                          )}
                          {status?.status === 'error' && (
                            <div className="absolute top-1 right-1 text-red-400">✗</div>
                          )}
                          {status?.status === 'processing' && (
                            <div className="absolute top-1 right-1 text-yellow-400">⏳</div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Import Durumu */}
                {Object.keys(importStatus).length > 0 && (
                  <div className="bg-black/30 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">İçe Aktarma Durumu</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {Object.entries(importStatus).map(([slug, status]) => (
                        <div key={slug} className="bg-black/20 rounded p-3 border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/80 text-sm font-medium">{slug}</span>
                            <span className={`font-semibold text-xs ${
                              status.status === 'completed' ? 'text-green-400' :
                              status.status === 'error' ? 'text-red-400' :
                              status.status === 'processing' ? 'text-yellow-400' :
                              'text-white/60'
                            }`}>
                              {status.status === 'completed' ? '✓ Tamamlandı' :
                               status.status === 'error' ? '✗ Hata' :
                               status.status === 'processing' ? '⏳ İşleniyor' :
                               '⏸ Bekliyor'}
                            </span>
                          </div>
                          {status.message && (
                            <div className="text-white/60 text-xs mt-1">{status.message}</div>
                          )}
                          {status.error && (
                            <div className="text-red-400 text-xs mt-1">Hata: {status.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bilgilendirme */}
      <div className="glassmorphic rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">ℹ️ Nasıl Kullanılır?</h3>
        <ol className="text-white/80 space-y-2 list-decimal list-inside">
          <li>Yukarıdaki arama kutusuna anime adını yazın ve arama yapın</li>
          <li>Arama sonuçlarından istediğiniz anime'yi seçin</li>
          <li>Anime detayları ve bölüm listesi yüklenecektir</li>
          <li>İçe aktarmak istediğiniz bölümleri seçin (veya tümünü seçin)</li>
          <li>"İçe Aktar" butonuna tıklayın</li>
          <li>Sistem otomatik olarak seçili bölümleri TürkAnime'den çekip Bunny CDN'e yükleyecektir</li>
        </ol>
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            ⚠️ <strong>Not:</strong> Bu özelliğin çalışması için backend API'nin (port 5002) çalışıyor olması gerekir.
            Backend, turkanime-indirici kütüphanesini kullanarak anime verilerini çeker.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BulkAnimeImport
