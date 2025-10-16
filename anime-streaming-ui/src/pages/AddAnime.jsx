import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function AddAnime() {
  const navigate = useNavigate()
  const { user, canManageServer } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [collections, setCollections] = useState([])
  const [animeData, setAnimeData] = useState({
    name: '',
    collectionId: '',
    description: '',
    genres: [],
    year: new Date().getFullYear(),
    status: 'ongoing',
    coverImage: ''
  })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [nameWarning, setNameWarning] = useState('')
  const [checkingName, setCheckingName] = useState(false)

  // Load Bunny collections
  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/bunny/collections')
      const data = await response.json()
      
      if (data.success) {
        setCollections(data.collections || [])
      }
    } catch (err) {
      console.error('Error loading collections:', err)
      setError('Collectionlar yüklenemedi')
    } finally {
      setLoadingCollections(false)
    }
  }

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

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverFile(file)
      // Preview oluştur
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadCover = async () => {
    if (!coverFile) return null

    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('cover', coverFile)
      formData.append('animeName', animeData.name) // Anime adını gönder

      const response = await fetch('http://localhost:5002/api/anime/upload-cover', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.success) {
        console.log('Cover uploaded to folder:', result.folderName)
        return result.coverUrl
      } else {
        throw new Error(result.error || 'Görsel yüklenemedi')
      }
    } catch (err) {
      console.error('Cover upload error:', err)
      throw err
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Önce görseli yükle
      let coverUrl = animeData.coverImage
      if (coverFile) {
        coverUrl = await uploadCover()
      }

      // Anime metadata'sını kaydet (collection oluşturmaz)
      const response = await fetch('http://localhost:5002/api/anime/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: animeData.name,
          collectionId: animeData.collectionId,
          description: animeData.description,
          genres: animeData.genres,
          year: animeData.year,
          status: animeData.status,
          coverImage: coverUrl,
          createdBy: user.username
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        // Form'u temizle
        setAnimeData({
          name: '',
          collectionId: '',
          description: '',
          genres: [],
          year: new Date().getFullYear(),
          status: 'ongoing'
        })
        
        // 2 saniye sonra admin panele yönlendir
        setTimeout(() => {
          navigate('/admin')
        }, 2000)
      } else {
        setError(result.error || 'Anime oluşturulamadı')
      }
    } catch (err) {
      setError('Bağlantı hatası: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setAnimeData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // İsim değiştiğinde kontrol et
    if (name === 'name' && value.trim()) {
      checkAnimeName(value.trim())
    } else if (name === 'name') {
      setNameWarning('')
    }
  }

  // İsim kontrolü (debounce ile)
  const checkAnimeName = async (name) => {
    setCheckingName(true)
    setNameWarning('')
    
    try {
      // 500ms bekle (kullanıcı yazmayı bitirsin)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const response = await fetch('http://localhost:5002/api/anime/list')
      const data = await response.json()
      
      if (data.success) {
        const exists = data.animes.some(a => 
          a.name.toLowerCase() === name.toLowerCase()
        )
        
        if (exists) {
          setNameWarning(`⚠️ "${name}" isimli anime zaten kayıtlı!`)
        }
      }
    } catch (err) {
      console.error('Name check error:', err)
    } finally {
      setCheckingName(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12">
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
            <h1 className="text-4xl font-bold text-white mb-2">Yeni Anime Ekle</h1>
            <p className="text-white/60">
              Bunny.net'te yeni bir anime collection'ı oluşturun
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg"
            >
              <p className="text-green-400 font-semibold">✓ Anime başarıyla oluşturuldu!</p>
              <p className="text-green-400/80 text-sm mt-1">Admin panele yönlendiriliyorsunuz...</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
            >
              <p className="text-red-400 font-semibold">✗ Hata</p>
              <p className="text-red-400/80 text-sm mt-1">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="glassmorphic rounded-xl p-6 space-y-6">
            {/* Collection Selection */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Bunny Collection <span className="text-red-400">*</span>
              </label>
              {loadingCollections ? (
                <div className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white/60">
                  Collectionlar yükleniyor...
                </div>
              ) : (
                <select
                  name="collectionId"
                  value={animeData.collectionId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">Collection seçin...</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name} ({collection.videoCount} video)
                    </option>
                  ))}
                </select>
              )}
              <p className="text-white/40 text-sm mt-1">
                Bu anime hangi Bunny collection'ına ait?
              </p>
            </div>

            {/* Anime Name */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Anime Adı <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={animeData.name}
                  onChange={handleChange}
                  placeholder="örn: Naruto Shippuden"
                  className={`w-full px-4 py-3 bg-black/30 border rounded-lg text-white placeholder-white/50 focus:outline-none ${
                    nameWarning 
                      ? 'border-yellow-500/50 focus:border-yellow-500' 
                      : 'border-white/10 focus:border-primary'
                  }`}
                  required
                />
                {checkingName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                  </div>
                )}
              </div>
              {nameWarning ? (
                <p className="text-yellow-400 text-sm mt-2 flex items-center gap-2">
                  {nameWarning}
                </p>
              ) : (
                <p className="text-white/40 text-sm mt-1">
                  Bu isim Bunny.net'te collection adı olarak kullanılacak
                </p>
              )}
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Anime Görseli <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4">
                {/* Preview */}
                <div className="flex-shrink-0">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-32 h-48 object-cover rounded-lg border-2 border-primary"
                    />
                  ) : (
                    <div className="w-32 h-48 bg-black/30 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🎬</span>
                    </div>
                  )}
                </div>
                
                {/* Upload */}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label
                    htmlFor="cover-upload"
                    className="block w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white/60 hover:text-white hover:border-primary cursor-pointer transition-colors text-center"
                  >
                    {coverFile ? coverFile.name : 'Görsel Seç (JPG, PNG, WebP)'}
                  </label>
                  <p className="text-white/40 text-sm mt-2">
                    Önerilen boyut: 300x450px (2:3 oran)
                  </p>
                  <p className="text-white/40 text-sm">
                    Maksimum dosya boyutu: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Açıklama
              </label>
              <textarea
                name="description"
                value={animeData.description}
                onChange={handleChange}
                placeholder="Anime hakkında kısa açıklama..."
                rows="4"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Tür
              </label>
              <input
                type="text"
                name="genre"
                value={animeData.genre}
                onChange={handleChange}
                placeholder="örn: Aksiyon, Macera, Shounen"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Year & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Yıl
                </label>
                <input
                  type="number"
                  name="year"
                  value={animeData.year}
                  onChange={handleChange}
                  min="1960"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Durum
                </label>
                <select
                  name="status"
                  value={animeData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                >
                  <option value="ongoing">Devam Ediyor</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="upcoming">Yakında</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || uploadingCover || !animeData.name || !animeData.collectionId || !coverFile || nameWarning || checkingName}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/80 text-background-dark font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingCover ? '📤 Görsel Yükleniyor...' : loading ? '🔄 Kaydediliyor...' : checkingName ? '🔍 Kontrol ediliyor...' : '✓ Anime Kaydet'}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="text-blue-400 font-semibold mb-2">ℹ️ Bilgi</h3>
            <ul className="text-blue-400/80 text-sm space-y-1">
              <li>• Önce Bunny.net'te collection oluşturulmalı</li>
              <li>• Bu sayfa sadece anime metadata'sını kaydeder</li>
              <li>• Anime oluşturulduktan sonra "Toplu Anime Ekle" sekmesinden bölüm ekleyebilirsiniz</li>
              <li>• Anime adı benzersiz olmalıdır</li>
            </ul>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

export default AddAnime
