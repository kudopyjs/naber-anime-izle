import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { uploadVideoFile, uploadFromURL, listCollections } from '../utils/bunnyUpload'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function UploadVideoNew() {
  const navigate = useNavigate()
  const { user, canUploadVideo } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [uploadMethod, setUploadMethod] = useState('url') // 'file', 'url', veya 'download'
  
  // Anime listesi ve seçimi
  const [animeList, setAnimeList] = useState([])
  const [selectedAnime, setSelectedAnime] = useState('')
  const [loadingAnime, setLoadingAnime] = useState(false)
  const [showAddAnimeModal, setShowAddAnimeModal] = useState(false)
  const [newAnimeName, setNewAnimeName] = useState('')
  const [addingAnime, setAddingAnime] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    episodeNumber: 1,
    episodeTitle: '',
    videoUrl: '',
    videoFile: null,
    fansub: ''
  })

  // Bunny.net yapılandırması kontrolü
  const bunnyConfigured = import.meta.env.VITE_BUNNY_STREAM_API_KEY && 
                          import.meta.env.VITE_BUNNY_LIBRARY_ID
  
  // Debug: API bilgilerini kontrol et
  useEffect(() => {
    console.log('🔑 Bunny.net Yapılandırması:')
    console.log('  API Key:', import.meta.env.VITE_BUNNY_STREAM_API_KEY ? '✅ Var' : '❌ Yok')
    console.log('  Library ID:', import.meta.env.VITE_BUNNY_LIBRARY_ID ? '✅ Var' : '❌ Yok')
    console.log('  CDN Hostname:', import.meta.env.VITE_BUNNY_CDN_HOSTNAME ? '✅ Var' : '❌ Yok')
    
    if (!bunnyConfigured) {
      console.error('❌ Bunny.net yapılandırılmamış! .env dosyasını kontrol edin.')
      setError('Bunny.net yapılandırılmamış. Lütfen .env dosyasını kontrol edin.')
    }
  }, [])

  // Redirect if user doesn't have permission
  if (!canUploadVideo()) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Erişim Reddedildi</h1>
          <p className="text-white/60 mb-6">Video yüklemek için Fansub veya Admin rolü gerekli.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/80 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  // Anime listesini yükle (Bunny.net collections'dan)
  useEffect(() => {
    if (bunnyConfigured) {
      loadAnimeList()
    } else {
      console.warn('⚠️ Bunny.net yapılandırılmamış, anime listesi yüklenemedi')
    }
  }, [bunnyConfigured])

  const loadAnimeList = async () => {
    setLoadingAnime(true)
    try {
      console.log('📋 Bunny.net collection\'ları yükleniyor...')
      const result = await listCollections()
      
      console.log('📦 Collection sonucu:', result)
      
      if (result.success && result.collections) {
        const animeNames = result.collections.map(c => c.name).filter(name => name)
        console.log(`✅ ${animeNames.length} anime bulundu:`, animeNames)
        setAnimeList(animeNames)
        
        if (animeNames.length === 0) {
          console.warn('⚠️ Hiç collection bulunamadı. Bunny.net dashboard\'dan collection oluşturun.')
        }
      } else {
        console.error('❌ Collection yüklenemedi:', result.error)
        setError('Anime listesi yüklenemedi: ' + (result.error || 'Bilinmeyen hata'))
      }
    } catch (err) {
      console.error('❌ Anime listesi yükleme hatası:', err)
      setError('Anime listesi yüklenemedi: ' + err.message)
    } finally {
      setLoadingAnime(false)
    }
  }

  const handleAddAnime = async () => {
    if (!newAnimeName.trim()) {
      return
    }
    
    const animeName = newAnimeName.trim()
    setAddingAnime(true)
    
    try {
      console.log(`📁 Yeni anime ekleniyor: ${animeName}`)
      
      // Bunny.net'te collection oluştur
      if (bunnyConfigured) {
        const { getOrCreateCollection } = await import('../utils/bunnyUpload')
        const result = await getOrCreateCollection(animeName)
        
        if (result.success) {
          console.log(`✅ Collection oluşturuldu/bulundu: ${animeName}`)
          console.log(`📦 Collection ID: ${result.collectionId}`)
          
          if (result.created !== false) {
            console.log(`🆕 Yeni collection oluşturuldu`)
          } else {
            console.log(`♻️ Mevcut collection kullanıldı`)
          }
        } else {
          console.error(`❌ Collection oluşturulamadı: ${result.error}`)
          setError(`Collection oluşturulamadı: ${result.error}`)
          setAddingAnime(false)
          return
        }
      }
      
      // Anime listesini yeniden yükle (Bunny.net'ten)
      if (bunnyConfigured) {
        console.log('🔄 Anime listesi yenileniyor...')
        await loadAnimeList()
      } else {
        // Bunny.net yoksa sadece local listeye ekle
        setAnimeList([...animeList, animeName])
      }
      
      // Yeni eklenen anime'yi seç
      setSelectedAnime(animeName)
      setNewAnimeName('')
      setShowAddAnimeModal(false)
      
      console.log(`✅ Anime başarıyla eklendi: ${animeName}`)
      
    } catch (err) {
      console.error('❌ Anime ekleme hatası:', err)
      setError(`Anime eklenemedi: ${err.message}`)
    } finally {
      setAddingAnime(false)
    }
  }

  // Helper: Collection ID al
  const getCollectionId = async (animeName) => {
    if (!animeName) return ''
    const { getOrCreateCollection } = await import('../utils/bunnyUpload')
    const result = await getOrCreateCollection(animeName)
    return result.success ? result.collectionId : ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedAnime) {
      setError('Lütfen bir anime seçin veya ekleyin')
      return
    }
    
    setUploading(true)
    setError('')
    setUploadProgress(0)

    try {
      let bunnyVideoId = null
      let bunnyEmbedUrl = null

      // Video başlığı
      const videoTitle = `${selectedAnime} - Bölüm ${formData.episodeNumber}: ${formData.episodeTitle}`

      // Bunny.net yapılandırıldıysa gerçek upload yap
      if (bunnyConfigured) {
        if (uploadMethod === 'file' && formData.videoFile) {
          // Dosyadan yükle
          console.log('📤 Dosya yükleniyor...')
          const result = await uploadVideoFile(
            formData.videoFile,
            videoTitle,
            selectedAnime, // Anime adı (collection)
            '', // collectionId (otomatik bulunacak)
            (progress) => setUploadProgress(progress)
          )

          if (!result.success) {
            throw new Error(result.error || 'Video yüklenemedi')
          }

          bunnyVideoId = result.videoId
          bunnyEmbedUrl = result.embedUrl
          
          console.log(`✅ Video yüklendi: ${bunnyVideoId}`)
          console.log(`📁 Collection: ${result.collectionId || 'Ana dizin'}`)

        } else if (uploadMethod === 'url' && formData.videoUrl) {
          // URL'den aktar
          console.log('🔗 URL\'den aktarılıyor...')
          
          // Sibnet için backend'den çözümlenmiş URL al
          let videoUrl = formData.videoUrl
          if (videoUrl.includes('sibnet.ru')) {
            console.log('  🔍 Sibnet URL\'si, backend\'den çözümleniyor...')
            const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000'
            
            try {
              const resolveResponse = await fetch(`${BACKEND_API_URL}/api/resolve-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_url: videoUrl })
              })
              
              if (resolveResponse.ok) {
                const resolveData = await resolveResponse.json()
                if (resolveData.success && resolveData.resolved_url) {
                  videoUrl = resolveData.resolved_url
                  console.log('  ✅ URL çözümlendi:', videoUrl.substring(0, 80) + '...')
                }
              }
            } catch (err) {
              console.warn('  ⚠️ Backend\'e erişilemedi, orijinal URL kullanılacak')
            }
          }
          
          console.log('📤 Bunny.net\'e gönderiliyor...')
          console.log('   Video URL:', videoUrl.substring(0, 80))
          console.log('   Title:', videoTitle)
          console.log('   Anime:', selectedAnime)
          
          const result = await uploadFromURL(
            videoUrl,
            videoTitle,
            selectedAnime // Anime adı (collection)
          )

          if (!result.success) {
            console.error('❌ Upload başarısız:', result.error)
            throw new Error(result.error || 'Video aktarılamadı')
          }

          bunnyVideoId = result.videoId
          bunnyEmbedUrl = result.embedUrl
          
          console.log(`✅ Video aktarıldı: ${bunnyVideoId}`)
          console.log(`📁 Collection: ${result.collectionId || 'Ana dizin'}`)
          console.log(`🔗 Embed URL: ${bunnyEmbedUrl}`)
          
        } else if (uploadMethod === 'download' && formData.videoUrl) {
          // İndir ve yükle (Node.js backend)
          console.log('📥 İndiriliyor ve yükleniyor...')
          
          const DOWNLOAD_API_URL = import.meta.env.VITE_DOWNLOAD_API_URL || 'http://localhost:5001'
          
          const response = await fetch(`${DOWNLOAD_API_URL}/api/download-upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              video_url: formData.videoUrl,
              title: videoTitle,
              collection_id: await getCollectionId(selectedAnime)
            })
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Video indirilemedi/yüklenemedi')
          }
          
          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.error || 'Video indirilemedi/yüklenemedi')
          }
          
          bunnyVideoId = result.videoId
          bunnyEmbedUrl = result.embedUrl
          
          console.log(`✅ Video indirildi ve yüklendi: ${bunnyVideoId}`)
          console.log(`📁 Collection: ${result.collectionId || 'Ana dizin'}`)
        }
      }

      // localStorage'a kaydet
      const existingAnime = JSON.parse(localStorage.getItem('uploadedAnime') || '[]')
      
      const newAnime = {
        id: Date.now(),
        title: selectedAnime,
        episode: formData.episodeNumber,
        episodeTitle: formData.episodeTitle,
        fansub: formData.fansub || user.username,
        uploadedBy: user.username,
        uploadedAt: new Date().toISOString(),
        bunnyVideoId: bunnyVideoId,
        bunnyEmbedUrl: bunnyEmbedUrl
      }
      
      existingAnime.push(newAnime)
      localStorage.setItem('uploadedAnime', JSON.stringify(existingAnime))

      setSuccess(true)
      
      // Form'u temizle
      setFormData({
        episodeNumber: formData.episodeNumber + 1, // Sonraki bölüm
        episodeTitle: '',
        videoUrl: '',
        videoFile: null,
        fansub: formData.fansub // Fansub'ı koru
      })

      // 3 saniye sonra success mesajını gizle
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Yükleme sırasında bir hata oluştu')
    } finally {
      setUploading(false)
    }
  }

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
            <h1 className="text-4xl font-bold text-white mb-2">🎬 Video Yükle</h1>
            <p className="text-white/60">
              Kullanıcı: <span className="text-primary font-semibold">{user.username}</span> 
              {' '}({user.role})
            </p>
            {!bunnyConfigured && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-500 text-sm">
                  ⚠️ Bunny.net yapılandırılmamış. Videolar sadece localStorage'a kaydedilecek.
                </p>
              </div>
            )}
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6"
              >
                <p className="text-green-500 font-semibold">
                  ✓ Video başarıyla yüklendi!
                  {bunnyConfigured && ' Bunny.net\'e aktarıldı.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

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
            {/* Anime Selection */}
            <div>
              <label className="block text-white font-medium mb-2">Anime Seç *</label>
              <div className="flex gap-2">
                <select
                  value={selectedAnime}
                  onChange={(e) => setSelectedAnime(e.target.value)}
                  className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                  disabled={loadingAnime}
                >
                  <option value="">
                    {loadingAnime 
                      ? '📋 Yükleniyor...' 
                      : animeList.length === 0 
                        ? '⚠️ Collection bulunamadı - Yeni ekleyin'
                        : `📺 Anime seçin (${animeList.length} anime)`
                    }
                  </option>
                  {animeList.map((anime, index) => (
                    <option key={index} value={anime}>{anime}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddAnimeModal(true)}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/80 transition-all shadow-neon-cyan whitespace-nowrap"
                  title="Yeni anime ekle"
                >
                  + Anime Ekle
                </button>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-white/60 text-sm">
                  {animeList.length > 0 ? (
                    <>✅ {animeList.length} anime yüklendi (Bunny.net collection'ları)</>
                  ) : (
                    <>⚠️ Henüz collection yok. "+ Anime Ekle" ile yeni anime ekleyin.</>
                  )}
                </p>
                {animeList.length > 0 && (
                  <p className="text-white/40 text-xs">
                    Mevcut anime'ler: {animeList.slice(0, 3).join(', ')}
                    {animeList.length > 3 && ` ve ${animeList.length - 3} daha...`}
                  </p>
                )}
              </div>
            </div>

            {/* Upload Method Selection */}
            <div>
              <label className="block text-white font-medium mb-3">Yükleme Yöntemi</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setUploadMethod('url')}
                  className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                    uploadMethod === 'url' 
                      ? 'bg-primary text-white shadow-neon-cyan' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <div className="text-2xl mb-1">🔗</div>
                  <div className="text-sm">URL Aktar</div>
                  <div className="text-xs opacity-60 mt-1">Hızlı</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('download')}
                  className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                    uploadMethod === 'download' 
                      ? 'bg-primary text-white shadow-neon-cyan' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <div className="text-2xl mb-1">📥</div>
                  <div className="text-sm">İndir & Yükle</div>
                  <div className="text-xs opacity-60 mt-1">Önerilen</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                    uploadMethod === 'file' 
                      ? 'bg-primary text-white shadow-neon-cyan' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <div className="text-2xl mb-1">📁</div>
                  <div className="text-sm">Dosya Yükle</div>
                  <div className="text-xs opacity-60 mt-1">Lokal</div>
                </button>
              </div>
            </div>

            {/* Video URL Input (URL and download methods) */}
            {(uploadMethod === 'url' || uploadMethod === 'download') && (
              <div>
                <label className="block text-white font-medium mb-2">Video URL *</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="https://my.mail.ru/mail/user/video/_myvideo/123.html"
                  required={uploadMethod === 'url'}
                />
                <div className="mt-2 space-y-1">
                  <p className="text-white/60 text-sm font-semibold">Desteklenen Platformlar:</p>
                  <p className="text-white/40 text-xs">
                    • Mail.ru: https://my.mail.ru/mail/user/video/_myvideo/123.html
                  </p>
                  <p className="text-white/40 text-xs">
                    • Sibnet: https://video.sibnet.ru/video4916331-...
                  </p>
                  <p className="text-white/40 text-xs">
                    • Google Drive, Yandex Disk, Pixeldrain, HDVID ve daha fazlası...
                  </p>
                </div>
              </div>
            )}

            {/* Video File Input (File method only) */}
            {uploadMethod === 'file' && (
              <div>
                <label className="block text-white font-medium mb-2">Video Dosyası *</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setFormData({ ...formData, videoFile: e.target.files[0] })}
                    className="hidden"
                    id="video-file"
                    required={uploadMethod === 'file'}
                  />
                  <label htmlFor="video-file" className="cursor-pointer">
                    <div className="text-white/60 mb-2">
                      {formData.videoFile ? (
                        <span className="text-primary font-semibold">
                          ✓ {formData.videoFile.name}
                        </span>
                      ) : (
                        <>
                          <span className="text-4xl block mb-2">📁</span>
                          <span>Video dosyası seçmek için tıklayın</span>
                        </>
                      )}
                    </div>
                    <p className="text-white/40 text-xs">
                      MP4, MKV, AVI, MOV, WEBM (Max 5GB)
                    </p>
                  </label>
                </div>
              </div>
            )}

            {/* Episode Number & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Bölüm Numarası *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.episodeNumber}
                  onChange={(e) => setFormData({ ...formData, episodeNumber: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Bölüm İsmi *</label>
                <input
                  type="text"
                  value={formData.episodeTitle}
                  onChange={(e) => setFormData({ ...formData, episodeTitle: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Örn: Uzumaki Naruto"
                  required
                />
              </div>
            </div>

            {/* Fansub (Optional) */}
            <div>
              <label className="block text-white font-medium mb-2">Fansub (Opsiyonel)</label>
              <input
                type="text"
                value={formData.fansub}
                onChange={(e) => setFormData({ ...formData, fansub: e.target.value })}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Örn: Benihime Fansub"
              />
              <p className="text-white/40 text-xs mt-1">
                Boş bırakılırsa kullanıcı adınız kullanılır
              </p>
            </div>

            {/* Upload Progress */}
            {uploading && uploadMethod === 'file' && (
              <div>
                <div className="flex justify-between text-white/60 text-sm mb-2">
                  <span>Yükleniyor...</span>
                  <span>{uploadProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !bunnyConfigured}
              className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg hover:shadow-neon-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                uploadMethod === 'file' ? 'Yükleniyor...' : 'Aktarılıyor...'
              ) : (
                '🚀 Yükle'
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Add Anime Modal */}
      <AnimatePresence>
        {showAddAnimeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddAnimeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glassmorphic rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {addingAnime ? '📁 Anime Ekleniyor...' : '🎬 Yeni Anime Ekle'}
              </h2>
              
              <input
                type="text"
                value={newAnimeName}
                onChange={(e) => setNewAnimeName(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all mb-4"
                placeholder="Anime adı (Örn: Naruto)"
                onKeyPress={(e) => e.key === 'Enter' && !addingAnime && handleAddAnime()}
                disabled={addingAnime}
              />
              
              {addingAnime && (
                <div className="mb-4 text-white/60 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    <span>Bunny.net'te collection oluşturuluyor...</span>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleAddAnime}
                  disabled={addingAnime || !newAnimeName.trim()}
                  className="flex-1 px-4 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingAnime ? 'Ekleniyor...' : 'Ekle'}
                </button>
                <button
                  onClick={() => setShowAddAnimeModal(false)}
                  disabled={addingAnime}
                  className="flex-1 px-4 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}

export default UploadVideoNew
