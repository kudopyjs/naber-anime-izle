/**
 * Download & Upload API Server
 * Node.js backend for downloading and uploading videos
 */

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.DOWNLOAD_API_PORT || 5001

// Bunny.net config
const BUNNY_API_KEY = process.env.VITE_BUNNY_STREAM_API_KEY
const LIBRARY_ID = process.env.VITE_BUNNY_LIBRARY_ID

// Temp directory
const TEMP_DIR = path.join(__dirname, 'temp_downloads')
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

/**
 * Download video
 */
async function downloadVideo(url, outputPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath)
    let downloadedBytes = 0
    let totalBytes = 0
    
    const protocol = url.startsWith('https') ? https : http
    
    // Platform'a göre headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
    
    if (url.includes('sibnet.ru')) {
      headers['Referer'] = 'https://video.sibnet.ru/'
    } else if (url.includes('mail.ru')) {
      headers['Referer'] = 'https://my.mail.ru/'
    }
    
    const request = protocol.get(url, { headers }, (response) => {
      // Redirect
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        fs.unlinkSync(outputPath)
        return downloadVideo(response.headers.location, outputPath, onProgress)
          .then(resolve)
          .catch(reject)
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }
      
      totalBytes = parseInt(response.headers['content-length'], 10)
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length
        if (onProgress && totalBytes > 0) {
          const progress = (downloadedBytes / totalBytes) * 100
          onProgress({
            phase: 'download',
            progress: progress,
            downloadedBytes: downloadedBytes,
            totalBytes: totalBytes
          })
        }
      })
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        resolve(outputPath)
      })
    })
    
    request.on('error', (err) => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath)
      }
      reject(err)
    })
    
    file.on('error', (err) => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath)
      }
      reject(err)
    })
  })
}

/**
 * Upload to Bunny.net
 */
async function uploadToBunny(filePath, title, collectionId, onProgress) {
  try {
    // 1. Create video
    console.log('  📝 Bunny.net\'te video oluşturuluyor...')
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title,
          collectionId: collectionId || undefined
        })
      }
    )
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      throw new Error(`Video oluşturulamadı (${createResponse.status}): ${errorText}`)
    }
    
    const videoData = await createResponse.json()
    const videoId = videoData.guid
    console.log(`  ✅ Video ID oluşturuldu: ${videoId}`)
    
    // 2. Upload file
    console.log('  📤 Dosya yükleniyor...')
    const fileBuffer = fs.readFileSync(filePath)
    const fileSize = fileBuffer.length
    console.log(`  📦 Yüklenecek boyut: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)
    
    const uploadResponse = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      }
    )
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('  ❌ Bunny.net yükleme hatası:', errorText)
      throw new Error(`Yükleme başarısız (${uploadResponse.status}): ${errorText}`)
    }
    
    console.log('  ✅ Dosya Bunny.net\'e yüklendi')
    
    if (onProgress) {
      onProgress({
        phase: 'upload',
        progress: 100,
        uploadedBytes: fileSize,
        totalBytes: fileSize
      })
    }
    
    return {
      success: true,
      videoId: videoId,
      embedUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`
    }
    
  } catch (error) {
    throw error
  }
}

/**
 * Parse Sibnet video URL (Advanced JavaScript parser)
 */
async function parseSibnetURL(url) {
  try {
    console.log('  🔍 Sibnet sayfası parse ediliyor (gelişmiş)...')
    
    // Sibnet sayfasını fetch et
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://video.sibnet.ru/'
      }
    })
    
    const html = await response.text()
    
    // Cheerio ile HTML parse et
    const cheerio = await import('cheerio')
    const $ = cheerio.load(html)
    
    // 1. Video player script'lerini kontrol et
    const scripts = $('script').toArray()
    for (const script of scripts) {
      const scriptContent = $(script).html() || ''
      
      // Video URL pattern'leri
      const patterns = [
        /player\.src\s*=\s*["']([^"']+)["']/,
        /src:\s*["']([^"']+\.mp4[^"']*)["']/,
        /"file":\s*"([^"]+)"/,
        /videoUrl\s*=\s*["']([^"']+)["']/,
        /https?:\/\/video\.sibnet\.ru\/v\/[^"'\s]+\.mp4/,
        /\/v\/[a-f0-9]+\/\d+\.mp4/
      ]
      
      for (const pattern of patterns) {
        const match = scriptContent.match(pattern)
        if (match) {
          let videoUrl = match[1] || match[0]
          
          // Relative URL'yi absolute'a çevir
          if (videoUrl.startsWith('/')) {
            videoUrl = `https://video.sibnet.ru${videoUrl}`
          }
          
          // URL'yi temizle
          videoUrl = videoUrl.replace(/\\/g, '')
          
          console.log(`  ✅ Video URL bulundu (script): ${videoUrl.substring(0, 80)}...`)
          return videoUrl
        }
      }
    }
    
    // 2. Video tag'lerini kontrol et
    const videoTags = $('video source, video').toArray()
    for (const tag of videoTags) {
      const src = $(tag).attr('src')
      if (src && src.includes('.mp4')) {
        let videoUrl = src
        if (videoUrl.startsWith('/')) {
          videoUrl = `https://video.sibnet.ru${videoUrl}`
        }
        console.log(`  ✅ Video URL bulundu (video tag): ${videoUrl.substring(0, 80)}...`)
        return videoUrl
      }
    }
    
    // 3. Alternatif: video ID'den URL oluştur
    const videoIdMatch = url.match(/video(\d+)/)
    if (videoIdMatch) {
      const videoId = videoIdMatch[1]
      
      // Sibnet API endpoint'ini dene
      try {
        const apiUrl = `https://video.sibnet.ru/shell.php?videoid=${videoId}`
        console.log(`  🔄 API URL deneniyor: ${apiUrl}`)
        
        const apiResponse = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': url
          }
        })
        
        if (apiResponse.ok) {
          const apiHtml = await apiResponse.text()
          const apiMatch = apiHtml.match(/https?:\/\/video\.sibnet\.ru\/v\/[^"'\s]+\.mp4/)
          if (apiMatch) {
            console.log(`  ✅ Video URL bulundu (API): ${apiMatch[0].substring(0, 80)}...`)
            return apiMatch[0]
          }
        }
      } catch (apiError) {
        console.warn(`  ⚠️ API hatası: ${apiError.message}`)
      }
      
      // Fallback: Shell URL'yi döndür
      const shellUrl = `https://video.sibnet.ru/shell.php?videoid=${videoId}`
      console.log(`  ℹ️ Shell URL kullanılacak: ${shellUrl}`)
      return shellUrl
    }
    
    console.warn('  ⚠️ Video URL bulunamadı, orijinal URL kullanılacak')
    return url
    
  } catch (error) {
    console.error('  ❌ Sibnet parse hatası:', error.message)
    return url
  }
}

/**
 * Parse Mail.ru video URL (youtube-dl yöntemi)
 */
async function parseMailruURL(url) {
  try {
    console.log('  🔍 Mail.ru sayfası parse ediliyor...')
    
    // 1. Sayfayı fetch et ve meta URL'yi bul
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://my.mail.ru/'
      }
    })
    
    const html = await response.text()
    const cheerio = await import('cheerio')
    const $ = cheerio.load(html)
    
    // 2. Page config'den metaUrl çıkar
    const scripts = $('script.sp-video__page-config').toArray()
    let metaUrl = null
    
    for (const script of scripts) {
      const scriptContent = $(script).html() || ''
      try {
        const pageConfig = JSON.parse(scriptContent)
        metaUrl = pageConfig.metaUrl || pageConfig.video?.metaUrl
        if (metaUrl) {
          console.log(`  ✅ Meta URL bulundu: ${metaUrl}`)
          break
        }
      } catch (e) {
        // JSON parse hatası, devam et
      }
    }
    
    // 3. Alternatif: URL'den meta URL oluştur
    if (!metaUrl) {
      const urlMatch = url.match(/mail\.ru\/mail\/([^\/]+)\/video\/([^\/]+)\/(\d+)/)
      if (urlMatch) {
        const username = urlMatch[1]
        const folder = urlMatch[2]
        const videoId = urlMatch[3]
        
        // youtube-dl formatı
        metaUrl = `https://my.mail.ru/+/video/meta/${username}/${folder}/${videoId}`
        console.log(`  ℹ️ Meta URL oluşturuldu: ${metaUrl}`)
      }
    }
    
    // 4. Meta URL'den video verilerini al
    if (metaUrl) {
      try {
        console.log(`  🔄 Video metadata alınıyor...`)
        
        const metaResponse = await fetch(metaUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': url
          }
        })
        
        if (metaResponse.ok) {
          const videoData = await metaResponse.json()
          
          // Video URL'lerini al
          if (videoData.videos && videoData.videos.length > 0) {
            // En yüksek kaliteyi seç (1080p, 720p, 480p, 360p)
            const qualities = ['1080', '720', '480', '360', '240']
            
            for (const quality of qualities) {
              const video = videoData.videos.find(v => 
                v.key === quality || 
                v.key === `${quality}p` ||
                v.key?.includes(quality)
              )
              
              if (video && video.url) {
                let videoUrl = video.url
                
                // Protocol-relative URL'yi düzelt (//cdn.mail.ru → https://cdn.mail.ru)
                if (videoUrl.startsWith('//')) {
                  videoUrl = 'https:' + videoUrl
                }
                
                console.log(`  ✅ Video URL bulundu (${quality}p): ${videoUrl.substring(0, 80)}...`)
                return videoUrl
              }
            }
            
            // Herhangi bir kalite
            const firstVideo = videoData.videos[0]
            if (firstVideo && firstVideo.url) {
              let videoUrl = firstVideo.url
              
              // Protocol-relative URL'yi düzelt
              if (videoUrl.startsWith('//')) {
                videoUrl = 'https:' + videoUrl
              }
              
              console.log(`  ✅ Video URL bulundu (${firstVideo.key || 'default'}): ${videoUrl.substring(0, 80)}...`)
              return videoUrl
            }
          }
        } else {
          console.warn(`  ⚠️ Metadata API hatası: ${metaResponse.status}`)
        }
      } catch (apiError) {
        console.warn(`  ⚠️ Metadata fetch hatası: ${apiError.message}`)
      }
    }
    
    // 5. Fallback: og:video meta tag
    const metaOgVideo = $('meta[property="og:video"]').attr('content') || $('meta[property="og:video:url"]').attr('content')
    if (metaOgVideo) {
      console.log(`  ✅ Video URL bulundu (og:video): ${metaOgVideo.substring(0, 80)}...`)
      return metaOgVideo
    }
    
    console.warn('  ⚠️ Video URL bulunamadı, orijinal URL kullanılacak')
    return url
    
  } catch (error) {
    console.error('  ❌ Mail.ru parse hatası:', error.message)
    return url
  }
}

/**
 * Generic video parser (OK.ru, VK, Dailymotion, vb.)
 */
async function parseGenericVideoURL(url) {
  try {
    console.log('  🔍 Video sayfası parse ediliyor...')
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    
    const html = await response.text()
    const cheerio = await import('cheerio')
    const $ = cheerio.load(html)
    
    // 1. Meta tags
    const metaTags = [
      'og:video',
      'og:video:url',
      'og:video:secure_url',
      'twitter:player:stream'
    ]
    
    for (const tag of metaTags) {
      const content = $(`meta[property="${tag}"]`).attr('content') || $(`meta[name="${tag}"]`).attr('content')
      if (content && (content.includes('.mp4') || content.includes('video'))) {
        console.log(`  ✅ Video URL bulundu (${tag}): ${content.substring(0, 80)}...`)
        return content
      }
    }
    
    // 2. Script içinde video URL ara
    const scripts = $('script').toArray()
    for (const script of scripts) {
      const scriptContent = $(script).html() || ''
      
      const patterns = [
        /"url":\s*"([^"]+\.mp4[^"]*)"/,
        /"video_url":\s*"([^"]+)"/,
        /"src":\s*"([^"]+\.mp4[^"]*)"/,
        /videoUrl:\s*["']([^"']+)["']/,
        /https?:\/\/[^"'\s]+\.mp4/
      ]
      
      for (const pattern of patterns) {
        const match = scriptContent.match(pattern)
        if (match) {
          let videoUrl = match[1] || match[0]
          videoUrl = videoUrl.replace(/\\/g, '')
          console.log(`  ✅ Video URL bulundu (script): ${videoUrl.substring(0, 80)}...`)
          return videoUrl
        }
      }
    }
    
    // 3. Video/source tags
    const videoTags = $('video source, video').toArray()
    for (const tag of videoTags) {
      const src = $(tag).attr('src')
      if (src && src.includes('.mp4')) {
        console.log(`  ✅ Video URL bulundu (video tag): ${src.substring(0, 80)}...`)
        return src
      }
    }
    
    console.warn('  ⚠️ Video URL bulunamadı, orijinal URL kullanılacak')
    return url
    
  } catch (error) {
    console.error('  ❌ Parse hatası:', error.message)
    return url
  }
}

/**
 * Resolve video URL with yt-dlp (Python)
 */
async function resolveWithYtDlp(url) {
  try {
    console.log('  🐍 yt-dlp ile URL çözümleniyor...')
    
    const { execSync } = await import('child_process')
    
    // yt-dlp ile direkt video URL al
    // Windows'ta PATH sorunu varsa python -m yt_dlp kullan
    let command = `yt-dlp --get-url --no-warnings "${url}"`
    
    try {
      // Önce direkt yt-dlp dene
      const output = execSync(command, { 
        encoding: 'utf-8',
        timeout: 30000
      }).trim()
      
      if (output && output.startsWith('http')) {
        const videoUrl = output.split('\n')[0]
        console.log(`  ✅ yt-dlp ile URL bulundu: ${videoUrl.substring(0, 80)}...`)
        return videoUrl
      }
    } catch (directError) {
      // yt-dlp bulunamadıysa python -m yt_dlp dene
      console.log('  🔄 python -m yt_dlp deneniyor...')
      command = `python -m yt_dlp --get-url --no-warnings "${url}"`
    }
    
    const output = execSync(command, { 
      encoding: 'utf-8',
      timeout: 30000 // 30 saniye timeout
    }).trim()
    
    // Çoklu URL varsa ilkini al (en yüksek kalite)
    const videoUrl = output.split('\n')[0]
    
    if (videoUrl && videoUrl.startsWith('http')) {
      console.log(`  ✅ yt-dlp ile URL bulundu: ${videoUrl.substring(0, 80)}...`)
      return videoUrl
    }
    
    console.warn('  ⚠️ yt-dlp geçerli URL döndürmedi')
    return url
    
  } catch (error) {
    console.warn(`  ⚠️ yt-dlp hatası: ${error.message}`)
    
    // yt-dlp kurulu değilse bilgi ver
    if (error.message.includes('yt-dlp') || error.message.includes('not found')) {
      console.warn('  💡 yt-dlp kurmak için: pip install yt-dlp')
    }
    
    return url
  }
}

/**
 * Resolve video URL (Hybrid: JavaScript + yt-dlp)
 */
async function resolveVideoURL(url) {
  // Zaten çözümlenmiş URL'yi tekrar çözümleme
  if (url.includes('.mp4') && (url.includes('/v/') || url.includes('video.') || url.includes('cdn'))) {
    console.log('  ℹ️ URL zaten çözümlenmiş, direkt kullanılacak')
    return url
  }
  
  // Önce yt-dlp dene (tüm platformlar için)
  const ytDlpUrl = await resolveWithYtDlp(url)
  if (ytDlpUrl !== url) {
    return ytDlpUrl
  }
  
  // yt-dlp başarısızsa JavaScript parser'ları dene
  console.log('  🔄 JavaScript parser deneniyor...')
  
  // Sibnet için özel parser
  if (url.includes('sibnet.ru')) {
    return await parseSibnetURL(url)
  }
  
  // Mail.ru için özel parser
  if (url.includes('mail.ru')) {
    return await parseMailruURL(url)
  }
  
  // OK.ru, VK, Dailymotion, vb. için generic parser
  if (url.includes('ok.ru') || url.includes('vk.com') || url.includes('dailymotion.com') || 
      url.includes('rutube.ru') || url.includes('vimeo.com')) {
    return await parseGenericVideoURL(url)
  }
  
  return url
}

/**
 * API Endpoint: Download and Upload
 */
app.post('/api/download-upload', async (req, res) => {
  const { video_url, title, collection_id } = req.body
  
  if (!video_url || !title) {
    return res.status(400).json({ error: 'video_url ve title gerekli' })
  }
  
  const tempFile = path.join(TEMP_DIR, `video_${Date.now()}.mp4`)
  
  try {
    console.log('📥 Video indiriliyor:', video_url)
    
    // URL'yi çözümle (Sibnet için)
    const resolvedUrl = await resolveVideoURL(video_url)
    console.log('🔗 Kullanılacak URL:', resolvedUrl.substring(0, 80) + '...')
    
    // Download (çözümlenmiş URL ile)
    await downloadVideo(resolvedUrl, tempFile, (progress) => {
      // Progress'i client'a gönderebiliriz (WebSocket ile)
      console.log(`  ⏳ İndirme: ${progress.progress.toFixed(1)}%`)
    })
    
    console.log('✅ Video indirildi')
    
    // Dosya doğrulama
    const stats = fs.statSync(tempFile)
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`📊 Dosya boyutu: ${fileSizeMB} MB`)
    
    // Video dosyası en az 1 MB olmalı
    if (stats.size < 1024 * 1024) { // 1 MB'den küçükse
      console.error(`❌ Dosya çok küçük! Muhtemelen HTML sayfası veya hata mesajı indirildi.`)
      console.error(`💡 yt-dlp kurulu mu? Kontrol edin: yt-dlp --version`)
      throw new Error(`Dosya çok küçük (${fileSizeMB} MB). Video indirilemedi, HTML sayfası indirilmiş olabilir. yt-dlp kurun: pip install yt-dlp`)
    }
    
    console.log(`✅ Dosya boyutu uygun (${fileSizeMB} MB)`)
    
    // Dosya uzantısını kontrol et
    const fileExtension = path.extname(tempFile).toLowerCase()
    const validExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv']
    if (!validExtensions.includes(fileExtension)) {
      console.warn(`⚠️ Dosya uzantısı: ${fileExtension} (standart değil)`)
    }
    
    console.log('📤 Bunny.net\'e yükleniyor...')
    
    // Upload
    const result = await uploadToBunny(tempFile, title, collection_id, (progress) => {
      console.log(`  ⏳ Yükleme: ${progress.progress.toFixed(1)}%`)
    })
    
    console.log('✅ Video yüklendi:', result.videoId)
    
    // Cleanup (Windows için güvenli silme)
    if (fs.existsSync(tempFile)) {
      try {
        // Kısa bir bekleme (dosya handle'ının serbest kalması için)
        await new Promise(resolve => setTimeout(resolve, 100))
        fs.unlinkSync(tempFile)
        console.log('🗑️ Geçici dosya silindi')
      } catch (cleanupError) {
        console.warn('⚠️ Geçici dosya silinemedi (dosya kullanımda), daha sonra silinecek')
        // Dosyayı arka planda silmeyi dene
        setTimeout(() => {
          try {
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile)
              console.log('🗑️ Geçici dosya gecikmeyle silindi')
            }
          } catch (err) {
            console.warn('⚠️ Geçici dosya hala silinemedi:', tempFile)
          }
        }, 5000)
      }
    }
    
    res.json(result)
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
    
    // Cleanup on error (Windows için güvenli)
    if (fs.existsSync(tempFile)) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        fs.unlinkSync(tempFile)
      } catch (cleanupError) {
        console.warn('⚠️ Hata sonrası geçici dosya silinemedi:', tempFile)
      }
    }
    
    res.status(500).json({ error: error.message })
  }
})

/**
 * Resolve URL endpoint (for frontend)
 */
app.post('/api/resolve-url', async (req, res) => {
  try {
    const { video_url } = req.body
    
    if (!video_url) {
      return res.status(400).json({ error: 'video_url gerekli' })
    }
    
    console.log('🔍 URL çözümleniyor:', video_url)
    
    const resolvedUrl = await resolveVideoURL(video_url)
    
    console.log('✅ URL çözümlendi:', resolvedUrl.substring(0, 80) + '...')
    
    res.json({
      success: true,
      original_url: video_url,
      resolved_url: resolvedUrl
    })
    
  } catch (error) {
    console.error('❌ URL çözümleme hatası:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * Check video status on Bunny.net
 */
app.get('/api/video-status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    
    console.log(`🔍 Video durumu kontrol ediliyor: ${videoId}`)
    
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          'AccessKey': BUNNY_API_KEY
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      
      console.log(`📊 Video durumu:`)
      console.log(`  Status: ${data.status}`)
      console.log(`  Encoding Progress: ${data.encodeProgress}%`)
      console.log(`  Available Resolutions: ${data.availableResolutions}`)
      
      res.json({
        success: true,
        videoId: videoId,
        status: data.status,
        encodeProgress: data.encodeProgress,
        availableResolutions: data.availableResolutions,
        title: data.title,
        length: data.length,
        storageSize: data.storageSize
      })
    } else {
      res.status(response.status).json({
        success: false,
        error: `Bunny.net error: ${response.status}`
      })
    }
  } catch (error) {
    console.error('❌ Video status hatası:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    bunny_configured: !!(BUNNY_API_KEY && LIBRARY_ID)
  })
})

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log('============================================================')
  console.log('🎬 Download & Upload API Server')
  console.log('============================================================')
  console.log(`📍 URL: http://localhost:${PORT}`)
  console.log(`🔑 Bunny.net: ${BUNNY_API_KEY && LIBRARY_ID ? '✅ Yapılandırıldı' : '❌ Yapılandırılmadı'}`)
  console.log('============================================================')
})
