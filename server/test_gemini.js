require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.GEMINI_API_KEY;
const apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

const testPrompt = `Sen profesyonel bir anime altyazı çevirmenisin. İngilizce altyazıları Türkçe'ye çevir.

ÖNEMLİ KURALLAR:
1. Özel isimleri (karakter adları, yer adları) ASLA çevirme, olduğu gibi bırak
2. Anime terimleri (jutsu, sensei, senpai, kun, chan, sama) gibi kelimeleri çevirme
3. Doğal ve akıcı Türkçe kullan
4. Cümle yapısını koru
5. Sadece çeviriyi döndür, açıklama yapma

Çevrilecek metin:
[0] Under Jujutsu regulations, Itadori Yuuji,
[1] I will exorcise you as a curse!
[2] Wait, really, I'm just fine!

Türkçe çeviri:`;

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini API...');
    console.log('🔑 API Key:', apiKey ? apiKey.substring(0, 20) + '...' : 'NOT FOUND');
    console.log('🌐 API URL:', apiUrl);
    console.log('');

    const response = await axios.post(
      `${apiUrl}?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ API Response received!');
    console.log('');
    console.log('📝 Translated text:');
    console.log(response.data.candidates[0].content.parts[0].text);
    console.log('');
    console.log('✅ Test successful! Gemini API is working.');

  } catch (error) {
    console.error('❌ Test failed!');
    console.error('');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('');
    console.error('💡 Possible issues:');
    console.error('1. Invalid API key');
    console.error('2. API key not activated');
    console.error('3. Network/firewall blocking request');
    console.error('4. Daily quota exceeded');
  }
}

testGemini();
