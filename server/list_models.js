require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    console.log('📋 Listing available Gemini models...\n');
    
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    console.log('✅ Available models:\n');
    response.data.models.forEach(model => {
      console.log(`📌 ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

listModels();
