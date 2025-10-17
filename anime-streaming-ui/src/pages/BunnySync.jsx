import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import API_BASE_URL from '../config/api'

function BunnySync() {
  const navigate = useNavigate()
  const { canManageServer } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Redirect if not authorized
  if (!canManageServer()) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60 mb-6">You need Admin or Fansub role to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/bunny/sync`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Senkronizasyon başarısız')
      }
    } catch (err) {
      console.error('Sync error:', err)
      setError('Senkronizasyon sırasında hata oluştu')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/admin')}
              className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2"
            >
              ← Admin Panel'e Dön
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">🔄 Bunny.net Senkronizasyon</h1>
            <p className="text-white/60">
              Bunny.net'teki collection'ları tarayıp anime detaylarını otomatik olarak günceller
            </p>
          </div>

          {/* Info Box */}
          <div className="glassmorphic rounded-xl p-6 mb-6">
            <h3 className="text-white font-semibold text-lg mb-3">ℹ️ Nasıl Çalışır?</h3>
            <ul className="text-white/70 space-y-2">
              <li>• Bunny.net'teki tüm collection'ları tarar</li>
              <li>• Collection adlarından anime adı ve sezon numarasını çıkarır</li>
              <li>• Her sezon için bölüm sayısını hesaplar</li>
              <li>• Anime detaylarını JSON dosyasına kaydeder</li>
              <li>• Örnek: "One Punch Man Season 1" → Anime: One Punch Man, Sezon: 1</li>
            </ul>
          </div>

          {/* Sync Button */}
          <div className="glassmorphic rounded-xl p-6 mb-6">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full px-8 py-4 bg-primary hover:bg-primary/80 text-background-dark font-bold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? '🔄 Senkronize Ediliyor...' : '🚀 Senkronizasyonu Başlat'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphic rounded-xl p-6 mb-6 border-2 border-red-500/50"
            >
              <h3 className="text-red-400 font-semibold text-lg mb-2">❌ Hata</h3>
              <p className="text-red-400/80">{error}</p>
            </motion.div>
          )}

          {/* Success Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphic rounded-xl p-6"
            >
              <h3 className="text-green-400 font-semibold text-lg mb-4">✅ Senkronizasyon Başarılı!</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-black/30 rounded-lg p-4">
                  <p className="text-white/60 text-sm mb-1">Toplam Anime</p>
                  <p className="text-white font-bold text-3xl">{result.total}</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4">
                  <p className="text-white/60 text-sm mb-1">Toplam Sezon</p>
                  <p className="text-white font-bold text-3xl">
                    {result.animes?.reduce((sum, a) => sum + a.totalSeasons, 0)}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-4">
                  <p className="text-white/60 text-sm mb-1">Toplam Bölüm</p>
                  <p className="text-white font-bold text-3xl">
                    {result.animes?.reduce((sum, a) => sum + a.totalEpisodes, 0)}
                  </p>
                </div>
              </div>

              <h4 className="text-white font-semibold mb-3">📚 Senkronize Edilen Animeler:</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {result.animes?.map((anime, index) => (
                  <div
                    key={index}
                    className="bg-black/30 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="text-white font-semibold text-lg">{anime.name}</h5>
                      <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-semibold rounded">
                        {anime.totalSeasons} Sezon
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {anime.seasons?.map((season) => (
                        <div
                          key={season.season}
                          className="bg-white/10 rounded px-3 py-1 text-sm"
                        >
                          <span className="text-white/60">S{season.season}:</span>{' '}
                          <span className="text-white font-semibold">{season.episodeCount} bölüm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

export default BunnySync
