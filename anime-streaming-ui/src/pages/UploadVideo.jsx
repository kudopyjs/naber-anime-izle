import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { uploadVideoFile, uploadFromURL } from '../utils/bunnyUpload'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function UploadVideo() {
  const navigate = useNavigate()
  const { user, canUploadVideo } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [uploadMethod, setUploadMethod] = useState('file') // 'file' veya 'url'
  const [videoUrl, setVideoUrl] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: 'Action',
    episode: 1,
    season: 1,
    thumbnail: null,
    video: null
  })

  // Bunny.net yapılandırması kontrolü
  const bunnyConfigured = import.meta.env.VITE_BUNNY_STREAM_API_KEY && 
                          import.meta.env.VITE_BUNNY_LIBRARY_ID

  // Redirect if user doesn't have permission
  if (!canUploadVideo()) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60 mb-6">You need Fansub or Admin role to upload videos.</p>
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    setError('')
    setUploadProgress(0)

    try {
      let bunnyVideoId = null
      let bunnyEmbedUrl = null
      let bunnyThumbnailUrl = null

      // Bunny.net yapılandırıldıysa gerçek upload yap
      if (bunnyConfigured) {
        const videoTitle = `${formData.title} - S${formData.season}E${formData.episode}`
        const animeName = formData.title // Anime adı (collection için)
        
        if (uploadMethod === 'file' && formData.video) {
          // Dosyadan yükle (collection otomatik oluşturulur)
          const result = await uploadVideoFile(
            formData.video,
            videoTitle,
            animeName, // Anime adı
            '', // collectionId (otomatik bulunacak)
            (progress) => setUploadProgress(progress)
          )

          if (!result.success) {
            throw new Error(result.error || 'Video yüklenemedi')
          }

          bunnyVideoId = result.videoId
          bunnyEmbedUrl = result.embedUrl
          bunnyThumbnailUrl = result.thumbnailUrl
          
          console.log(`✅ Video yüklendi: ${bunnyVideoId}`)
          console.log(`📁 Collection: ${result.collectionId || 'Ana dizin'}`)

        } else if (uploadMethod === 'url' && videoUrl) {
          // URL'den aktar (collection otomatik oluşturulur)
          const result = await uploadFromURL(
            videoUrl,
            videoTitle,
            animeName // Anime adı
          )

          if (!result.success) {
            throw new Error(result.error || 'Video aktarılamadı')
          }

          bunnyVideoId = result.videoId
          bunnyEmbedUrl = result.embedUrl || `https://iframe.mediadelivery.net/embed/${import.meta.env.VITE_BUNNY_LIBRARY_ID}/${result.videoId}`
          
          console.log(`✅ Video aktarıldı: ${bunnyVideoId}`)
          console.log(`📁 Collection: ${result.collectionId || 'Ana dizin'}`)
        }
      }

      // localStorage'a kaydet
      const existingAnime = JSON.parse(localStorage.getItem('uploadedAnime') || '[]')
      
      const newAnime = {
        id: Date.now(),
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        episode: formData.episode,
        season: formData.season,
        uploadedBy: user.username,
        uploaderId: user.id,
        uploadedAt: new Date().toISOString(),
        // Bunny.net bilgileri
        bunnyVideoId: bunnyVideoId,
        bunnyEmbedUrl: bunnyEmbedUrl,
        bunnyThumbnailUrl: bunnyThumbnailUrl,
        // Fallback: lokal blob URLs (Bunny yapılandırılmamışsa)
        thumbnailUrl: formData.thumbnail ? URL.createObjectURL(formData.thumbnail) : bunnyThumbnailUrl,
        videoUrl: uploadMethod === 'file' && formData.video ? URL.createObjectURL(formData.video) : null,
        videoSourceUrl: uploadMethod === 'url' ? videoUrl : null
      }

      existingAnime.push(newAnime)
      localStorage.setItem('uploadedAnime', JSON.stringify(existingAnime))

      setSuccess(true)
      setUploadProgress(100)

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          genre: 'Action',
          episode: 1,
          season: 1,
          thumbnail: null,
          video: null
        })
        setVideoUrl('')
        setSuccess(false)
        setUploadProgress(0)
      }, 3000)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Yükleme sırasında bir hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports']

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphic rounded-xl p-8"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Video Yükle</h1>
            <p className="text-white/60">
              Kullanıcı: <span className="text-primary font-semibold">{user.username}</span> 
              {' '}({user.role})
            </p>
            {!bunnyConfigured && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-500 text-sm">
                  ⚠️ Bunny.net yapılandırılmamış. Videolar sadece localStorage'a kaydedilecek.
                  <br />
                  <span className="text-yellow-400 text-xs">
                    Gerçek streaming için BUNNY_SETUP_TR.md dosyasına bakın.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6"
            >
              <p className="text-green-500 font-semibold">
                ✓ Video başarıyla yüklendi!
                {bunnyConfigured && ' Bunny.net\'e aktarıldı.'}
              </p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6"
            >
              <p className="text-red-500 font-semibold">✗ {error}</p>
            </motion.div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Method Selection */}
            <div>
              <label className="block text-white font-medium mb-3">Yükleme Yöntemi</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
                    uploadMethod === 'file' 
                      ? 'bg-primary text-white shadow-neon-cyan' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  📁 Dosya Yükle
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('url')}
                  className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
                    uploadMethod === 'url' 
                      ? 'bg-primary text-white shadow-neon-cyan' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  🔗 URL'den Aktar
                </button>
              </div>
              <p className="text-white/40 text-sm mt-2">
                {uploadMethod === 'file' 
                  ? '• Bilgisayarınızdan video dosyası yükleyin' 
                  : '• Başka bir sunucudaki videoyu direkt aktarın (Bunny.net gerekli)'}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-white font-medium mb-2">Anime Başlığı *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Örn: Naruto"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-medium mb-2">Açıklama *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                placeholder="Anime hakkında kısa açıklama"
                rows={4}
                required
              />
            </div>

            {/* Video URL Input (URL method only) */}
            {uploadMethod === 'url' && (
              <div>
                <label className="block text-white font-medium mb-2">Video URL *</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="https://example.com/video.mp4"
                  required={uploadMethod === 'url'}
                />
                <p className="text-white/40 text-xs mt-1">
                  Direkt video dosyası URL'si (.mp4, .mkv, .avi vb.)
                </p>
                {!bunnyConfigured && (
                  <p className="text-red-400 text-xs mt-2">
                    ⚠️ URL'den aktarma için Bunny.net yapılandırması gerekli!
                  </p>
                )}
              </div>
            )}

            {/* Genre, Season, Episode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Genre *</label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Season *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Episode *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.episode}
                  onChange={(e) => setFormData({ ...formData, episode: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-white font-medium mb-2">Thumbnail Image *</label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files[0] })}
                  className="hidden"
                  id="thumbnail"
                  required
                />
                <label htmlFor="thumbnail" className="cursor-pointer">
                  <div className="text-primary text-4xl mb-2">📷</div>
                  <p className="text-white mb-1">
                    {formData.thumbnail ? formData.thumbnail.name : 'Click to upload thumbnail'}
                  </p>
                  <p className="text-white/50 text-sm">PNG, JPG up to 10MB</p>
                </label>
              </div>
            </div>

            {/* Video Upload (File method only) */}
            {uploadMethod === 'file' && (
              <div>
                <label className="block text-white font-medium mb-2">Video Dosyası *</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setFormData({ ...formData, video: e.target.files[0] })}
                    className="hidden"
                    id="video"
                    required={uploadMethod === 'file'}
                  />
                  <label htmlFor="video" className="cursor-pointer">
                    <div className="text-primary text-4xl mb-2">🎬</div>
                    <p className="text-white mb-1">
                      {formData.video ? formData.video.name : 'Video dosyası seçmek için tıklayın'}
                    </p>
                    <p className="text-white/50 text-sm">
                      MP4, MKV, AVI - {bunnyConfigured ? 'Max 5GB' : 'Max 2GB (localStorage)'}
                    </p>
                    {formData.video && (
                      <p className="text-primary text-sm mt-2">
                        Boyut: {(formData.video.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && uploadProgress > 0 && (
              <div>
                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-primary to-primary-magenta h-4 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-white text-center mt-2 font-semibold">
                  {uploadProgress < 100 ? `Yükleniyor: ${uploadProgress.toFixed(0)}%` : 'İşleniyor...'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading || (uploadMethod === 'url' && !bunnyConfigured)}
                className="flex-1 py-4 bg-gradient-to-r from-primary to-primary-magenta hover:from-primary/80 hover:to-primary-magenta/80 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {uploading 
                  ? (uploadMethod === 'file' ? 'Yükleniyor...' : 'Aktarılıyor...') 
                  : (uploadMethod === 'file' ? 'Video Yükle' : 'URL\'den Aktar')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={uploading}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default UploadVideo
