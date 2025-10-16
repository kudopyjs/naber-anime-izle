/**
 * Video İndirme ve Yükleme Script'i (Node.js)
 * Python olmadan Sibnet videolarını indir ve Bunny.net'e yükle
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'
import FormData from 'form-data'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Bunny.net config (.env'den al)
const BUNNY_API_KEY = process.env.VITE_BUNNY_STREAM_API_KEY
const LIBRARY_ID = process.env.VITE_BUNNY_LIBRARY_ID

/**
 * Video indir
 */
async function downloadVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log('📥 Video indiriliyor...')
    console.log('  URL:', url.substring(0, 80) + '...')
    
    const file = fs.createWriteStream(outputPath)
    let downloadedBytes = 0
    let totalBytes = 0
    
    const protocol = url.startsWith('https') ? https : http
    
    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://video.sibnet.ru/',
      }
    }, (response) => {
      // Redirect takip et
      if (response.statusCode === 301 || response.statusCode === 302) {
        console.log('  🔄 Redirect takip ediliyor...')
        file.close()
        fs.unlinkSync(outputPath)
        return downloadVideo(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject)
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }
      
      totalBytes = parseInt(response.headers['content-length'], 10)
      console.log(`  📦 Dosya boyutu: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length
        const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1)
        process.stdout.write(`\r  ⏳ İndiriliyor: ${progress}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalBytes / 1024 / 1024).toFixed(2)} MB)`)
      })
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        console.log('\n  ✅ Video indirildi:', outputPath)
        resolve(outputPath)
      })
    })
    
    request.on('error', (err) => {
      fs.unlinkSync(outputPath)
      reject(err)
    })
    
    file.on('error', (err) => {
      fs.unlinkSync(outputPath)
      reject(err)
    })
  })
}

/**
 * Bunny.net'e video yükle
 */
async function uploadToBunny(filePath, title, collectionId = '') {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('\n📤 Bunny.net\'e yükleniyor...')
      console.log('  Title:', title)
      console.log('  Collection ID:', collectionId || 'Ana dizin')
      
      // 1. Video oluştur
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
            collectionId: collectionId
          })
        }
      )
      
      if (!createResponse.ok) {
        throw new Error(`Video oluşturulamadı: ${createResponse.statusText}`)
      }
      
      const videoData = await createResponse.json()
      const videoId = videoData.guid
      
      console.log('  ✅ Video oluşturuldu:', videoId)
      console.log('  📤 Dosya yükleniyor...')
      
      // 2. Dosyayı yükle
      const fileStream = fs.createReadStream(filePath)
      const fileSize = fs.statSync(filePath).size
      let uploadedBytes = 0
      
      fileStream.on('data', (chunk) => {
        uploadedBytes += chunk.length
        const progress = ((uploadedBytes / fileSize) * 100).toFixed(1)
        process.stdout.write(`\r  ⏳ Yükleniyor: ${progress}% (${(uploadedBytes / 1024 / 1024).toFixed(2)} MB / ${(fileSize / 1024 / 1024).toFixed(2)} MB)`)
      })
      
      const uploadResponse = await fetch(
        `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
        {
          method: 'PUT',
          headers: {
            'AccessKey': BUNNY_API_KEY,
            'Content-Type': 'application/octet-stream'
          },
          body: fileStream,
          duplex: 'half'
        }
      )
      
      if (!uploadResponse.ok) {
        throw new Error(`Yükleme başarısız: ${uploadResponse.statusText}`)
      }
      
      console.log('\n  ✅ Video yüklendi!')
      console.log('  🎬 Video ID:', videoId)
      console.log('  🔗 Embed URL:', `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`)
      
      resolve({
        success: true,
        videoId: videoId,
        embedUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`
      })
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Ana fonksiyon
 */
async function main() {
  try {
    // Komut satırı argümanları
    const args = process.argv.slice(2)
    
    if (args.length < 2) {
      console.log('❌ Kullanım: node download-and-upload.js <video_url> <title> [collection_id]')
      console.log('\nÖrnek:')
      console.log('  node download-and-upload.js "https://video.sibnet.ru/..." "Bleach - Bölüm 1" "abc-123"')
      process.exit(1)
    }
    
    const videoUrl = args[0]
    const title = args[1]
    const collectionId = args[2] || ''
    
    console.log('🎬 Video İndirme ve Yükleme')
    console.log('=' .repeat(60))
    console.log('URL:', videoUrl.substring(0, 80) + '...')
    console.log('Title:', title)
    console.log('Collection:', collectionId || 'Ana dizin')
    console.log('=' .repeat(60))
    
    // Geçici klasör oluştur
    const tempDir = path.join(__dirname, 'temp_downloads')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    // Dosya adı
    const timestamp = Date.now()
    const tempFile = path.join(tempDir, `video_${timestamp}.mp4`)
    
    // 1. İndir
    await downloadVideo(videoUrl, tempFile)
    
    // 2. Yükle
    const result = await uploadToBunny(tempFile, title, collectionId)
    
    // 3. Geçici dosyayı sil
    console.log('\n🗑️ Geçici dosya siliniyor...')
    fs.unlinkSync(tempFile)
    console.log('  ✅ Geçici dosya silindi')
    
    console.log('\n✅ İşlem tamamlandı!')
    console.log('🎬 Video ID:', result.videoId)
    console.log('🔗 Embed URL:', result.embedUrl)
    
  } catch (error) {
    console.error('\n❌ Hata:', error.message)
    process.exit(1)
  }
}

// Script çalıştır
main()
