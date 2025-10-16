// Backblaze B2 API Integration
// Bu dosya bunnyUpload.js'in B2 versiyonudur

const B2_KEY_ID = import.meta.env.VITE_B2_KEY_ID
const B2_APP_KEY = import.meta.env.VITE_B2_APPLICATION_KEY
const B2_BUCKET_NAME = import.meta.env.VITE_B2_BUCKET_NAME
const B2_BUCKET_ID = import.meta.env.VITE_B2_BUCKET_ID
const CDN_URL = import.meta.env.VITE_CDN_URL

/**
 * B2 Authorization Token Al
 */
let authCache = {
  token: null,
  apiUrl: null,
  downloadUrl: null,
  expiresAt: 0
}

async function getB2Authorization() {
  // Cache'den al (24 saat geçerli)
  if (authCache.token && Date.now() < authCache.expiresAt) {
    return authCache
  }

  try {
    const credentials = btoa(`${B2_KEY_ID}:${B2_APP_KEY}`)
    
    const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    })

    if (!response.ok) {
      throw new Error('B2 authorization failed')
    }

    const data = await response.json()
    
    authCache = {
      token: data.authorizationToken,
      apiUrl: data.apiUrl,
      downloadUrl: data.downloadUrl,
      expiresAt: Date.now() + (23 * 60 * 60 * 1000) // 23 saat
    }

    return authCache
  } catch (error) {
    console.error('B2 auth error:', error)
    throw error
  }
}

/**
 * Upload URL Al
 */
async function getUploadUrl() {
  try {
    const auth = await getB2Authorization()
    
    const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        'Authorization': auth.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: B2_BUCKET_ID
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get upload URL')
    }

    return await response.json()
  } catch (error) {
    console.error('Get upload URL error:', error)
    throw error
  }
}

/**
 * Dosya yükle (browser'dan)
 */
export async function uploadFile(file, fileName, folder = '', onProgress = null) {
  try {
    console.log('📤 B2\'ye dosya yükleniyor...')
    console.log('  Dosya:', fileName)
    console.log('  Boyut:', (file.size / (1024 * 1024)).toFixed(2), 'MB')

    // Upload URL al
    const uploadData = await getUploadUrl()
    
    // Dosya yolu oluştur (folder varsa)
    const filePath = folder ? `${folder}/${fileName}` : fileName
    
    // SHA1 hash hesapla (B2 requirement)
    const sha1Hash = await calculateSHA1(file)
    
    console.log('  SHA1:', sha1Hash)
    console.log('  Path:', filePath)

    // Upload
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            onProgress(percentComplete)
          }
        })
      }

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          console.log('✅ Upload başarılı!')
          
          resolve({
            success: true,
            fileId: response.fileId,
            fileName: response.fileName,
            url: `${CDN_URL}/${filePath}`,
            b2Url: `${uploadData.downloadUrl}/file/${B2_BUCKET_NAME}/${filePath}`
          })
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'))
      })

      xhr.open('POST', uploadData.uploadUrl)
      xhr.setRequestHeader('Authorization', uploadData.authorizationToken)
      xhr.setRequestHeader('X-Bz-File-Name', encodeURIComponent(filePath))
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.setRequestHeader('X-Bz-Content-Sha1', sha1Hash)
      xhr.send(file)
    })
  } catch (error) {
    console.error('B2 upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * SHA1 hash hesapla (B2 requirement)
 */
async function calculateSHA1(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Dosya listele
 */
export async function listFiles(folder = '', maxFiles = 100) {
  try {
    const auth = await getB2Authorization()
    
    const payload = {
      bucketId: B2_BUCKET_ID,
      maxFileCount: maxFiles
    }

    if (folder) {
      payload.prefix = folder + '/'
    }

    const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: {
        'Authorization': auth.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Failed to list files')
    }

    const data = await response.json()
    
    return {
      success: true,
      files: data.files.map(f => ({
        fileId: f.fileId,
        fileName: f.fileName,
        size: f.contentLength,
        uploadTimestamp: f.uploadTimestamp,
        url: `${CDN_URL}/${f.fileName}`
      }))
    }
  } catch (error) {
    console.error('List files error:', error)
    return {
      success: false,
      error: error.message,
      files: []
    }
  }
}

/**
 * Dosya sil
 */
export async function deleteFile(fileName, fileId) {
  try {
    const auth = await getB2Authorization()
    
    const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_delete_file_version`, {
      method: 'POST',
      headers: {
        'Authorization': auth.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: fileName,
        fileId: fileId
      })
    })

    return {
      success: response.ok
    }
  } catch (error) {
    console.error('Delete file error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Dosya bilgisi al
 */
export async function getFileInfo(fileId) {
  try {
    const auth = await getB2Authorization()
    
    const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_file_info`, {
      method: 'POST',
      headers: {
        'Authorization': auth.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId: fileId
      })
    })

    if (!response.ok) {
      throw new Error('File not found')
    }

    return await response.json()
  } catch (error) {
    console.error('Get file info error:', error)
    return null
  }
}

/**
 * Video metadata oluştur (HLS için)
 * Bu fonksiyon backend'de çalışmalı (FFmpeg gerekli)
 */
export async function createVideoMetadata(videoPath, animeName, episodeNumber) {
  try {
    // Backend API'sine istek gönder
    const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000'
    
    const response = await fetch(`${API_URL}/api/encode-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoPath: videoPath,
        animeName: animeName,
        episodeNumber: episodeNumber
      })
    })

    if (!response.ok) {
      throw new Error('Video encoding failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Video metadata error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Collection (folder) oluştur
 * B2'de folder yoktur, sadece prefix kullanılır
 */
export async function createCollection(name) {
  // B2'de folder otomatik oluşur, sadece metadata döndür
  return {
    success: true,
    collectionId: name, // Folder name = collection ID
    created: true
  }
}

/**
 * Collection bul
 */
export async function findCollectionByName(name) {
  // B2'de folder'lar otomatik, sadece name döndür
  return name
}

/**
 * Collection bul veya oluştur
 */
export async function getOrCreateCollection(name) {
  return {
    success: true,
    collectionId: name,
    created: false
  }
}

/**
 * Video URL'sinden B2'ye yükle (backend gerekli)
 * Bu fonksiyon backend'de çalışmalı çünkü:
 * 1. Video'yu indirmek gerekir
 * 2. FFmpeg ile encode etmek gerekir
 * 3. HLS segmentleri oluşturmak gerekir
 * 4. B2'ye yüklemek gerekir
 */
export async function uploadFromURL(videoUrl, title, animeName = null, collectionId = '') {
  try {
    console.log('📥 Video URL\'den B2\'ye aktarılıyor...')
    console.log('  URL:', videoUrl)
    console.log('  Title:', title)
    console.log('  Collection:', collectionId || animeName || 'Ana dizin')

    // Backend API'sine istek gönder
    const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000'
    
    const response = await fetch(`${API_URL}/api/upload-to-b2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoUrl: videoUrl,
        title: title,
        animeName: animeName,
        collectionId: collectionId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${errorText}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      videoId: data.videoId,
      playlistUrl: data.playlistUrl,
      thumbnailUrl: data.thumbnailUrl,
      collectionId: collectionId || animeName
    }
  } catch (error) {
    console.error('B2 upload from URL error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * HLS playlist URL oluştur
 */
export function getPlaylistUrl(videoId, collectionId = '') {
  const folder = collectionId ? `${collectionId}/${videoId}` : videoId
  return `${CDN_URL}/${folder}/playlist.m3u8`
}

/**
 * Thumbnail URL oluştur
 */
export function getThumbnailUrl(videoId, collectionId = '') {
  const folder = collectionId ? `${collectionId}/${videoId}` : videoId
  return `${CDN_URL}/${folder}/thumbnail.jpg`
}

/**
 * Video bilgilerini al (metadata)
 */
export async function getVideoInfo(videoId, collectionId = '') {
  try {
    const folder = collectionId ? `${collectionId}/${videoId}` : videoId
    const metadataPath = `${folder}/metadata.json`
    
    // Metadata dosyasını indir
    const response = await fetch(`${CDN_URL}/${metadataPath}`)
    
    if (!response.ok) {
      throw new Error('Metadata not found')
    }

    return await response.json()
  } catch (error) {
    console.error('Get video info error:', error)
    return null
  }
}

/**
 * Test bağlantısı
 */
export async function testConnection() {
  try {
    const auth = await getB2Authorization()
    return {
      success: true,
      message: 'B2 bağlantısı başarılı!',
      apiUrl: auth.apiUrl
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
