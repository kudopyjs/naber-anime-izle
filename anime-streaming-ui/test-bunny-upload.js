/**
 * Bunny.net Upload Test Script
 * Bunny API'sinin çalışıp çalışmadığını test eder
 */

// .env dosyasından değerleri al (manuel olarak doldur)
const BUNNY_API_KEY = "26908cc0-97c0-4855-89075898cd7c-edf0-485a"
const LIBRARY_ID = "512139"

async function testBunnyAPI() {
  console.log("🧪 Bunny.net API Test Başlıyor...\n")
  
  // 1. Library bilgisini al
  console.log("1️⃣ Library bilgisi alınıyor...")
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}`,
      {
        headers: {
          'AccessKey': BUNNY_API_KEY
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log("✅ Library bulundu:", data.Name)
      console.log("   Storage Used:", (data.StorageUsed / 1024 / 1024 / 1024).toFixed(2), "GB")
      console.log("   Video Count:", data.VideoCount)
    } else {
      console.error("❌ Library bulunamadı:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("   Error:", errorText)
      return
    }
  } catch (error) {
    console.error("❌ Hata:", error.message)
    return
  }
  
  console.log()
  
  // 2. Collection'ları listele
  console.log("2️⃣ Collection'lar listeleniyor...")
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/collections`,
      {
        headers: {
          'AccessKey': BUNNY_API_KEY
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ ${data.items.length} collection bulundu:`)
      data.items.slice(0, 5).forEach(c => {
        console.log(`   - ${c.name} (${c.videoCount} video)`)
      })
    } else {
      console.error("❌ Collection'lar listelenemedi:", response.status)
    }
  } catch (error) {
    console.error("❌ Hata:", error.message)
  }
  
  console.log()
  
  // 3. Test video oluştur
  console.log("3️⃣ Test video oluşturuluyor...")
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: "Test Video - " + new Date().toISOString()
        })
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log("✅ Test video oluşturuldu:", data.guid)
      
      // Hemen sil
      console.log("   🗑️ Test video siliniyor...")
      const deleteResponse = await fetch(
        `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${data.guid}`,
        {
          method: 'DELETE',
          headers: {
            'AccessKey': BUNNY_API_KEY
          }
        }
      )
      
      if (deleteResponse.ok) {
        console.log("   ✅ Test video silindi")
      }
    } else {
      console.error("❌ Video oluşturulamadı:", response.status)
      const errorText = await response.text()
      console.error("   Error:", errorText)
    }
  } catch (error) {
    console.error("❌ Hata:", error.message)
  }
  
  console.log()
  
  // 4. Fetch API test (basit bir URL ile)
  console.log("4️⃣ Fetch API test ediliyor...")
  const testUrl = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4"
  
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/fetch`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: testUrl,
          title: "Fetch Test - " + new Date().toISOString()
        })
      }
    )
    
    console.log("   Response:", response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log("✅ Fetch API çalışıyor!")
      console.log("   Video ID:", data.guid || data.id)
      
      // Hemen sil
      if (data.guid || data.id) {
        const videoId = data.guid || data.id
        console.log("   🗑️ Test video siliniyor...")
        const deleteResponse = await fetch(
          `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
          {
            method: 'DELETE',
            headers: {
              'AccessKey': BUNNY_API_KEY
            }
          }
        )
        
        if (deleteResponse.ok) {
          console.log("   ✅ Test video silindi")
        }
      }
    } else {
      const errorText = await response.text()
      console.error("❌ Fetch API başarısız:", errorText)
    }
  } catch (error) {
    console.error("❌ Hata:", error.message)
  }
  
  console.log()
  console.log("=" * 60)
  console.log("🎉 Test tamamlandı!")
}

// Run test
testBunnyAPI().catch(console.error)
