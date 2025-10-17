// Bunny Stream API Integration
const BUNNY_API_KEY = import.meta.env.VITE_BUNNY_STREAM_API_KEY
const LIBRARY_ID = import.meta.env.VITE_BUNNY_LIBRARY_ID
const CDN_HOSTNAME = import.meta.env.VITE_BUNNY_CDN_HOSTNAME

/**
 * Video URL'sini çözümle (backend API ile - yt-dlp)
 */
export async function resolveVideoURL(url) {
  try {
    console.log('🔍 Video URL çözümleniyor (backend API)...')
    
    // Backend API'sine istek gönder
    const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000'
    
    const response = await fetch(`${API_URL}/api/resolve-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ video_url: url })
    })
    
    if (!response.ok) {
      // Backend yoksa veya hata varsa, basit çözümleme yap
      console.warn('⚠️ Backend API kullanılamıyor, basit çözümleme yapılıyor...')
      return simpleResolveURL(url)
    }
    
    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ URL çözümlendi (${data.platform}): ${data.resolved_url.substring(0, 60)}...`)
      return {
        success: true,
        url: data.resolved_url,
        platform: data.platform,
        title: data.title,
        duration: data.duration
      }
    } else {
      console.error('❌ URL çözümlenemedi:', data.error)
      // Fallback: basit çözümleme
      return simpleResolveURL(url)
    }
    
  } catch (error) {
    console.error('❌ URL çözümleme hatası:', error)
    // Fallback: basit çözümleme
    return simpleResolveURL(url)
  }
}

/**
 * Basit URL çözümleme (fallback)
 */
function simpleResolveURL(url) {
  console.log('🔄 Basit URL çözümleme yapılıyor...')
  
  // Mail.ru için
  if (url.includes('mail.ru')) {
    console.log('📧 Mail.ru URL tespit edildi')
    if (!url.includes('/video/embed/')) {
      const match = url.match(/\/video\/.*?\/(\d+)/)
      if (match) {
        const videoId = match[1]
        url = `https://my.mail.ru/video/embed/${videoId}`
        console.log(`✅ Mail.ru embed URL'sine çevrildi: ${url}`)
      }
    }
    return { success: true, url: url, platform: 'mail.ru' }
  }
  
  // Sibnet için - Cloudflare Worker proxy kullan
  if (url.includes('sibnet.ru')) {
    console.log('🔍 Sibnet URL tespit edildi')
    
    // Cloudflare Worker URL'si (.env'den al)
    const PROXY_URL = import.meta.env.VITE_VIDEO_PROXY_URL
    
    if (PROXY_URL) {
      console.log('✅ Cloudflare Worker proxy kullanılacak')
      return {
        success: true,
        url: url,
        platform: 'sibnet',
        useProxy: true,
        proxyUrl: PROXY_URL
      }
    } else {
      console.warn('⚠️ Sibnet için backend API veya Cloudflare Worker gerekli!')
      console.warn('⚠️ Seçenekler:')
      console.warn('   1. Backend: python upload_api.py')
      console.warn('   2. Cloudflare Worker: wrangler deploy')
      return {
        success: false,
        error: 'Sibnet için backend API veya Cloudflare Worker gerekli',
        url: url
      }
    }
  }
  
  // Diğer platformlar
  return { success: true, url: url, platform: 'other' }
}

/**
 * Collection listele
 */
export async function listCollections() {
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/collections`,
      {
        headers: {
          'AccessKey': BUNNY_API_KEY
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Collection listelenemedi')
    }
    
    const data = await response.json()
    return {
      success: true,
      collections: data.items || []
    }
  } catch (error) {
    console.error('List collections error:', error)
    return {
      success: false,
      error: error.message,
      collections: []
    }
  }
}

/**
 * İsme göre collection bul (TAM EŞLEŞME)
 */
export async function findCollectionByName(name) {
  try {
    const result = await listCollections()
    if (!result.success) {
      return null
    }
    
    // Tam eşleşme kontrolü
    const collection = result.collections.find(c => c.name === name)
    return collection ? collection.guid : null
  } catch (error) {
    console.error('Find collection error:', error)
    return null
  }
}

/**
 * Collection bul veya oluştur
 */
export async function getOrCreateCollection(name) {
  try {
    // Önce var mı kontrol et
    const existingId = await findCollectionByName(name)
    if (existingId) {
      console.log(`✅ Mevcut collection bulundu: ${name}`)
      return {
        success: true,
        collectionId: existingId,
        created: false
      }
    }
    
    // Yoksa oluştur
    console.log(`📁 Yeni collection oluşturuluyor: ${name}`)
    return await createCollection(name)
  } catch (error) {
    console.error('Get or create collection error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Video'yu collection'a taşı
 */
export async function moveToCollection(videoId, collectionId) {
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collectionId: collectionId
        })
      }
    )
    
    if (!response.ok) {
      throw new Error('Video taşınamadı')
    }
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Move to collection error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Download & Upload fallback (fetch başarısız olursa)
 */
async function uploadViaDownload(videoUrl, title, collectionId = '') {
  try {
    console.log('📥 Backend ile indiriliyor ve yükleniyor...')
    
    const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000'
    
    const response = await fetch(`${BACKEND_API_URL}/api/download-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_url: videoUrl,
        title: title,
        collection_id: collectionId,
        library_id: LIBRARY_ID,
        api_key: BUNNY_API_KEY
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Download & upload başarısız')
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Download & upload başarısız')
    }
    
    console.log('✅ Backend ile yüklendi:', data.videoId)
    
    return {
      success: true,
      videoId: data.videoId,
      collectionId: collectionId,
      embedUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${data.videoId}`,
      data: data
    }
  } catch (error) {
    console.error('❌ Download & upload hatası:', error)
    throw error
  }
}

/**
 * Başka bir URL'den video aktar (geliştirilmiş + URL çözümleme)
 */
export async function uploadFromURL(videoUrl, title, animeName = null, collectionId = '') {
  try {
    // URL'yi çözümle (mail.ru, sibnet vb.)
    console.log('🔍 Video URL çözümleniyor...')
    const resolveResult = await resolveVideoURL(videoUrl)
    if (!resolveResult.success) {
      throw new Error('URL çözümlenemedi: ' + resolveResult.error)
    }
    
    const resolvedUrl = resolveResult.url
    console.log(`✅ URL çözümlendi (${resolveResult.platform}): ${resolvedUrl.substring(0, 60)}...`)
    
    // Anime adı verilmişse, collection bul veya oluştur
    if (animeName && !collectionId) {
      const collResult = await getOrCreateCollection(animeName)
      if (collResult.success) {
        collectionId = collResult.collectionId
      }
    }
    
    console.log('📤 Bunny.net\'e fetch isteği gönderiliyor...')
    console.log('  URL:', resolvedUrl.substring(0, 100) + '...')
    console.log('  Title:', title)
    console.log('  Collection ID:', collectionId || 'Yok (ana dizin)')
    
    // Sibnet için özel headers ekle
    const fetchHeaders = {}
    if (resolvedUrl.includes('sibnet.ru')) {
      console.log('  🔧 Sibnet için özel headers ekleniyor...')
      fetchHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      fetchHeaders['Referer'] = 'https://video.sibnet.ru/'
    }
    
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/fetch`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: resolvedUrl, // Çözümlenmiş URL kullan
          title: title,
          collectionId: collectionId,
          headers: fetchHeaders // Özel headers
        })
      }
    )
    
    console.log('📥 Bunny.net response:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Bunny.net fetch başarısız:', errorText)
      console.error('❌ Request details:')
      console.error('   URL:', resolvedUrl.substring(0, 100))
      console.error('   Title:', title)
      console.error('   Collection ID:', collectionId || 'Yok')
      
      // 403/400 hatası alırsak, download & upload metodunu dene
      if (response.status === 403 || response.status === 400) {
        console.log('⚠️ Fetch başarısız, download & upload deneniyor...')
        return await uploadViaDownload(resolvedUrl, title, collectionId)
      }
      
      throw new Error(`Bunny.net upload failed (${response.status}): ${errorText}`)
    }
    
    const data = await response.json()
    console.log('📦 Bunny.net response data:', JSON.stringify(data, null, 2))
    
    // Bunny fetch API farklı field'lar döndürebilir
    const videoId = data.guid || data.id || data.videoId || data.videoLibraryId
    console.log('🎬 Video ID:', videoId || 'YOK!')
    
    if (!videoId) {
      console.error('❌ Video ID alınamadı!')
      console.error('Response keys:', Object.keys(data))
      console.error('Full response:', data)
      
      // Eğer success:true dönmüşse ama ID yoksa, bekle ve listeden bul
      if (data.success === true || response.status === 200) {
        console.log('⏳ Video ID bulunamadı, 5 saniye bekleniyor...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // Son yüklenen videoyu bul
        console.log('🔍 Son yüklenen video aranıyor...')
        const videos = await listVideos(1, 10)
        if (videos && videos.items && videos.items.length > 0) {
          const latestVideo = videos.items[0]
          console.log('✅ Son video bulundu:', latestVideo.guid)
          return {
            success: true,
            videoId: latestVideo.guid,
            collectionId: collectionId,
            embedUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${latestVideo.guid}`,
            data: latestVideo
          }
        }
      }
      
      throw new Error('Video ID alınamadı ve video listesinde bulunamadı')
    }
    
    // Collection'a eklenmemişse manuel olarak taşı
    if (collectionId && videoId) {
      console.log('📦 Video collection\'a taşınıyor...')
      await moveToCollection(videoId, collectionId)
    }
    
    return {
      success: true,
      videoId: videoId,
      collectionId: collectionId,
      embedUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`,
      data: data
    }
  } catch (error) {
    console.error('Bunny upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Lokal dosyadan video yükle (geliştirilmiş)
 */
export async function uploadVideoFile(file, title, animeName = null, collectionId = '', onProgress = null) {
  try {
    // Anime adı verilmişse, collection bul veya oluştur
    if (animeName && !collectionId) {
      const collResult = await getOrCreateCollection(animeName)
      if (collResult.success) {
        collectionId = collResult.collectionId
      }
    }
    
    // 1. Video oluştur
    const createPayload = { title }
    if (collectionId) {
      createPayload.collectionId = collectionId
    }
    
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPayload)
      }
    )
    
    if (!createResponse.ok) {
      throw new Error('Video oluşturulamadı')
    }
    
    const video = await createResponse.json()
    const videoId = video.guid
    
    // Collection'a eklenmemişse manuel olarak taşı
    if (collectionId && !video.collectionId) {
      console.log('📦 Video collection\'a taşınıyor...')
      await moveToCollection(videoId, collectionId)
    }
    
    // 2. Dosyayı yükle (progress tracking ile)
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100
          onProgress(percentComplete)
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve({
            success: true,
            videoId: videoId,
            embedUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`,
            thumbnailUrl: `https://vz-${CDN_HOSTNAME}/thumbnail/${videoId}.jpg`
          })
        } else {
          reject(new Error('Upload failed'))
        }
      })
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error'))
      })
      
      xhr.open('PUT', `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`)
      xhr.setRequestHeader('AccessKey', BUNNY_API_KEY)
      xhr.setRequestHeader('Content-Type', 'application/octet-stream')
      xhr.send(file)
    })
  } catch (error) {
    console.error('Bunny upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Video bilgilerini al
 */
export async function getVideoInfo(videoId) {
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          'AccessKey': BUNNY_API_KEY
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Video bulunamadı')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Get video info error:', error)
    return null
  }
}

/**
 * Video sil
 */
export async function deleteVideo(videoId) {
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
      {
        method: 'DELETE',
        headers: {
          'AccessKey': BUNNY_API_KEY
        }
      }
    )
    
    return {
      success: response.ok
    }
  } catch (error) {
    console.error('Delete video error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Collection (klasör) oluştur
 */
export async function createCollection(name) {
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/collections`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      }
    )
    
    if (!response.ok) {
      throw new Error('Collection oluşturulamadı')
    }
    
    const data = await response.json()
    return {
      success: true,
      collectionId: data.guid,
      created: true
    }
  } catch (error) {
    console.error('Create collection error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Tüm videoları listele
 */
export async function listVideos(page = 1, itemsPerPage = 100) {
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos?page=${page}&itemsPerPage=${itemsPerPage}`,
      {
        headers: {
          'AccessKey': BUNNY_API_KEY
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Videolar listelenemedi')
    }
    
    return await response.json()
  } catch (error) {
    console.error('List videos error:', error)
    return null
  }
}
