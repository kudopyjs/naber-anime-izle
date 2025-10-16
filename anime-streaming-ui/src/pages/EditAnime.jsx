import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function EditAnime() {
  const { animeSlug } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    genres: [],
    status: 'Devam Ediyor',
    year: new Date().getFullYear(),
    rating: 0,
    coverImage: ''
  })

  const [newGenre, setNewGenre] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)

  const statusOptions = ['Yakında', 'Devam Ediyor', 'Tamamlandı', 'Durduruldu']

  useEffect(() => {
    loadAnimeData()
  }, [animeSlug])

  const loadAnimeData = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5002/api/anime/list')
      const data = await response.json()
      
      console.log('📊 All animes:', data.animes)
      console.log('🔍 Looking for slug:', animeSlug)
      
      if (data.success) {
        const anime = data.animes.find(a => {
          const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          console.log(`Comparing: "${slug}" === "${animeSlug.toLowerCase()}"`)
          return slug === animeSlug.toLowerCase()
        })
        
        console.log('✅ Found anime:', anime)
        
        if (anime) {
          setFormData({
            name: anime.name || '',
            description: anime.description || '',
            genres: anime.genres || [],
            status: anime.status || 'Devam Ediyor',
            year: anime.year || new Date().getFullYear(),
            rating: anime.rating || 0,
            coverImage: anime.coverImage || ''
          })
          setCoverPreview(anime.coverImage || '')
        } else {
          setError('Anime bulunamadı')
        }
      }
    } catch (err) {
      console.error('Error loading anime:', err)
      setError('Anime yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadCover = async (animeName) => {
    if (!coverFile) return null

    console.log('📤 Uploading cover for anime:', animeName)
    
    setUploadingCover(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('cover', coverFile)
      uploadFormData.append('animeName', animeName)
      
      console.log('📦 FormData contents:', {
        cover: coverFile.name,
        animeName: animeName
      })

      const response = await fetch('http://localhost:5002/api/anime/upload-cover', {
        method: 'POST',
        body: uploadFormData
      })

      const data = await response.json()
      
      if (data.success) {
        return data.coverUrl
      } else {
        throw new Error(data.error || 'Cover yüklenemedi')
      }
    } catch (err) {
      console.error('Error uploading cover:', err)
      setError('Cover yüklenirken hata oluştu')
      return null
    } finally {
      setUploadingCover(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddGenre = () => {
    if (newGenre.trim() && !formData.genres.includes(newGenre.trim())) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, newGenre.trim()]
      }))
      setNewGenre('')
    }
  }

  const handleRemoveGenre = (genre) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Eğer yeni cover seçildiyse, önce onu yükle
      let coverUrl = formData.coverImage
      if (coverFile) {
        const uploadedUrl = await uploadCover(formData.name)
        if (uploadedUrl) {
          coverUrl = uploadedUrl
        }
      }

      const response = await fetch('http://localhost:5002/api/anime/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldName: formData.name, // Anime'yi bulmak için
          ...formData,
          coverImage: coverUrl
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Anime başarıyla güncellendi!')
        setTimeout(() => {
          navigate('/admin')
        }, 2000)
      } else {
        setError(data.error || 'Anime güncellenirken hata oluştu')
      }
    } catch (err) {
      console.error('Error updating anime:', err)
      setError('Anime güncellenirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-white/60">Anime yükleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphic rounded-xl p-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Anime Düzenle</h1>
          <p className="text-white/60 mb-8">Anime bilgilerini güncelleyin</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Anime Adı */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Anime Adı *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                placeholder="Örn: One Punch Man"
              />
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Açıklama
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none resize-none"
                placeholder="Anime hakkında kısa açıklama..."
              />
            </div>

            {/* Türler */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Türler
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGenre())}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="Tür ekle (Örn: Aksiyon)"
                />
                <button
                  type="button"
                  onClick={handleAddGenre}
                  className="px-6 py-2 bg-primary hover:bg-primary/80 text-background-dark font-semibold rounded-lg transition-colors"
                >
                  Ekle
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.genres.map((genre, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2"
                  >
                    {genre}
                    <button
                      type="button"
                      onClick={() => handleRemoveGenre(genre)}
                      className="hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Durum */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Durum *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status} className="bg-background-dark">
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Yıl */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Yıl *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  min="1900"
                  max="2100"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Puan (0-10)
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                />
              </div>

            </div>

            {/* Cover Image Upload */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Kapak Görseli
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-background-dark file:font-semibold hover:file:bg-primary/80"
                  />
                  <p className="text-white/40 text-xs mt-2">
                    Görsel seçin veya aşağıya URL girin
                  </p>
                </div>
              </div>
              
              <div className="mt-3">
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="Veya görsel URL'i girin (https://...)"
                />
              </div>
            </div>

            {/* Cover Preview */}
            {coverPreview && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Kapak Önizleme
                </label>
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-48 h-64 object-cover rounded-lg border-2 border-white/10"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
                {uploadingCover && (
                  <p className="text-primary text-sm mt-2">📤 Görsel yükleniyor...</p>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/80 text-background-dark font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Kaydediliyor...' : '💾 Değişiklikleri Kaydet'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

export default EditAnime
