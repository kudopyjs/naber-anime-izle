/**
 * Subtitle Translator Service with Google Gemini
 * - Translates English subtitles to Turkish
 * - Caches translations to avoid re-translating
 * - Preserves proper nouns and timing
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SubtitleTranslator {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.cacheDir = path.join(__dirname, 'subtitle_cache');
    // Using Flash Lite for 3-5x faster translation
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent';
    
    // Translation queue and status tracking
    this.translationQueue = new Map(); // cacheKey -> { status, progress, promise, startTime }
    
    // Create cache directory if it doesn't exist
    this.initCache();
  }

  async initCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log('✅ Subtitle cache directory ready');
    } catch (error) {
      console.error('❌ Error creating cache directory:', error);
    }
  }

  /**
   * Generate cache key from subtitle content
   */
  getCacheKey(subtitleContent) {
    return crypto
      .createHash('md5')
      .update(subtitleContent)
      .digest('hex');
  }

  /**
   * Check if translation exists in cache
   */
  async getFromCache(cacheKey) {
    try {
      const cachePath = path.join(this.cacheDir, `${cacheKey}.vtt`);
      const cached = await fs.readFile(cachePath, 'utf-8');
      console.log('✅ Translation found in cache');
      console.log('📄 Cache preview:', cached.substring(0, 200));
      return cached;
    } catch (error) {
      console.log('❌ No cache found, will translate');
      return null;
    }
  }

  /**
   * Save translation to cache
   */
  async saveToCache(cacheKey, translatedContent) {
    try {
      const cachePath = path.join(this.cacheDir, `${cacheKey}.vtt`);
      console.log('💾 Saving to cache:', cachePath);
      console.log('📄 Content preview:', translatedContent.substring(0, 200));
      await fs.writeFile(cachePath, translatedContent, 'utf-8');
      console.log('✅ Translation saved to cache');
    } catch (error) {
      console.error('❌ Error saving to cache:', error);
    }
  }

  /**
   * Parse VTT subtitle file
   */
  parseVTT(vttContent) {
    const lines = vttContent.split('\n');
    const subtitles = [];
    let currentSubtitle = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip WEBVTT header and empty lines at start
      if (line.startsWith('WEBVTT') || line.startsWith('NOTE') || line === '') {
        continue;
      }

      // Timing line (00:00:00.000 --> 00:00:00.000)
      if (line.includes('-->')) {
        if (currentSubtitle) {
          subtitles.push(currentSubtitle);
        }
        currentSubtitle = {
          timing: line,
          text: []
        };
      }
      // Text line
      else if (currentSubtitle && line !== '') {
        currentSubtitle.text.push(line);
      }
    }

    // Add last subtitle
    if (currentSubtitle) {
      subtitles.push(currentSubtitle);
    }

    return subtitles;
  }

  /**
   * Translate text using Google Gemini
   */
  async translateWithGemini(text) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const prompt = `Sen profesyonel bir anime altyazı çevirmenisin. İngilizce altyazıları Türkçe'ye çevir.

ÖNEMLİ KURALLAR:
1. Özel isimleri (karakter adları, yer adları) ASLA çevirme, olduğu gibi bırak
2. Anime terimleri (jutsu, sensei, senpai, kun, chan, sama) gibi kelimeleri çevirme
3. Doğal ve akıcı Türkçe kullan
4. Cümle yapısını koru
5. ZAMAN DAMGALARINI AYNEN KORU (00:00:00.000 --> 00:00:00.000)
6. Format: [index] timing | çevrilmiş metin
7. Sadece çeviriyi döndür, açıklama yapma

Çevrilecek metin:
${text}

Türkçe çeviri:`;

    try {
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192, // Increased for large batches
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Debug: Log the response structure
      console.log('🔍 API Response structure:', JSON.stringify(response.data, null, 2).substring(0, 500));

      // Check if response has expected structure
      if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
        console.error('❌ Unexpected API response:', response.data);
        throw new Error('Invalid API response structure');
      }

      const candidate = response.data.candidates[0];
      
      // Check for MAX_TOKENS error
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.error('❌ Token limit exceeded! Response was cut off.');
        console.error('💡 Try reducing batch size or increasing maxOutputTokens');
        throw new Error('Translation incomplete: Token limit exceeded');
      }
      
      // Check if content.parts exists
      if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
        console.error('❌ No translation text in response');
        console.error('Finish reason:', candidate.finishReason);
        throw new Error('No translation text in API response');
      }

      const translatedText = candidate.content.parts[0].text.trim();
      return translatedText;
    } catch (error) {
      console.error('❌ Gemini API error:', error.response?.data || error.message);
      
      // More detailed error logging
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw new Error('Translation failed: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  /**
   * Translate subtitles in optimized batches
   * Uses ONE batch if possible, splits if too large
   */
  async translateBatch(subtitles) {
    const MAX_BATCH_SIZE = 100; // Optimized for Flash Lite (faster, less tokens)
    
    // If small enough, translate all at once
    if (subtitles.length <= MAX_BATCH_SIZE) {
      console.log(`🚀 Translating ALL ${subtitles.length} subtitles in ONE batch...`);
      return await this.translateSingleBatch(subtitles, 0);
    }
    
    // Split into multiple batches
    console.log(`📦 Splitting ${subtitles.length} subtitles into batches of ${MAX_BATCH_SIZE}...`);
    const numBatches = Math.ceil(subtitles.length / MAX_BATCH_SIZE);
    
    // Process batches in parallel (3 at a time to respect rate limits)
    const PARALLEL_BATCHES = 3;
    const allBatches = [];
    
    for (let i = 0; i < subtitles.length; i += MAX_BATCH_SIZE) {
      const batch = subtitles.slice(i, i + MAX_BATCH_SIZE);
      const batchNum = Math.floor(i / MAX_BATCH_SIZE) + 1;
      allBatches.push({ batch, batchNum, startIndex: i });
    }
    
    console.log(`⚡ Processing ${numBatches} batches in parallel (${PARALLEL_BATCHES} at a time)...`);
    const translatedSubtitles = new Array(subtitles.length);
    
    // Process in chunks of PARALLEL_BATCHES
    for (let i = 0; i < allBatches.length; i += PARALLEL_BATCHES) {
      const chunk = allBatches.slice(i, i + PARALLEL_BATCHES);
      
      const promises = chunk.map(async ({ batch, batchNum, startIndex }) => {
        console.log(`🔄 Translating batch ${batchNum}/${numBatches} (${batch.length} subtitles)...`);
        
        try {
          const translated = await this.translateSingleBatch(batch, startIndex);
          return { translated, startIndex };
        } catch (error) {
          console.error(`❌ Error in batch ${batchNum}:`, error.message);
          // Fallback to original
          const fallback = batch.map(sub => ({
            timing: sub.timing,
            text: sub.text.join(' ')
          }));
          return { translated: fallback, startIndex };
        }
      });
      
      const results = await Promise.all(promises);
      
      // Insert results in correct order
      results.forEach(({ translated, startIndex }) => {
        translated.forEach((sub, idx) => {
          translatedSubtitles[startIndex + idx] = sub;
        });
      });
      
      // Small delay between parallel chunks
      if (i + PARALLEL_BATCHES < allBatches.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return translatedSubtitles.filter(Boolean);
  }
  
  /**
   * Translate a single batch of subtitles
   */
  async translateSingleBatch(subtitles, startIndex = 0) {
    try {
      // Combine subtitles with timing preserved
      const fullText = subtitles.map((sub, idx) => {
        return `[${idx}] ${sub.timing} | ${sub.text.join(' ')}`
      }).join('\n');
      
      console.log(`📦 Batch size: ${subtitles.length} subtitles, ${fullText.length} characters`);
      
      // Translate
      const translatedBatch = await this.translateWithGemini(fullText);
      
      // Parse translated batch
      const translatedLines = translatedBatch.split('\n').filter(line => line.trim());
      const translatedSubtitles = [];
      
      for (let i = 0; i < subtitles.length; i++) {
        const originalSub = subtitles[i];
        
        // Find translated line for this index
        const translatedLine = translatedLines.find(line => line.startsWith(`[${i}]`));
        
        if (translatedLine) {
          // Extract text after timing (format: [0] 00:00:01.000 --> 00:00:03.000 | Translated text)
          const parts = translatedLine.split('|');
          let translatedText = parts.length > 1 ? parts[1].trim() : originalSub.text.join(' ');
          
          translatedSubtitles.push({
            timing: originalSub.timing,
            text: translatedText
          });
        } else {
          // Fallback to original if not found
          translatedSubtitles.push({
            timing: originalSub.timing,
            text: originalSub.text.join(' ')
          });
        }
      }
      
      console.log(`✅ Translated ${translatedSubtitles.length} subtitles successfully!`);
      return translatedSubtitles;
      
    } catch (error) {
      console.error(`❌ Error translating batch:`, error.message);
      throw error;
    }
  }

  /**
   * Build VTT file from translated subtitles
   */
  buildVTT(translatedSubtitles) {
    let vtt = 'WEBVTT\n\n';
    
    // Debug: Log first 3 subtitles
    console.log('🔍 Building VTT from translated subtitles...');
    console.log('📝 First 3 subtitles:');
    translatedSubtitles.slice(0, 3).forEach((sub, idx) => {
      console.log(`  [${idx}] ${sub.timing} | ${sub.text.substring(0, 50)}...`);
    });
    
    translatedSubtitles.forEach((sub, index) => {
      vtt += `${index + 1}\n`;
      vtt += `${sub.timing}\n`;
      vtt += `${sub.text}\n\n`;
    });
    
    console.log(`✅ Built VTT with ${translatedSubtitles.length} subtitles`);
    return vtt;
  }

  /**
   * Main translation function with queue support
   */
  async translateSubtitle(vttContent) {
    try {
      console.log('🌍 Starting subtitle translation...');
      
      // Check cache first
      const cacheKey = this.getCacheKey(vttContent);
      const cached = await this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      // Check if already translating
      if (this.translationQueue.has(cacheKey)) {
        const queueItem = this.translationQueue.get(cacheKey);
        console.log(`⏳ Translation already in progress (${queueItem.progress}%), waiting...`);
        
        // Wait for existing translation to complete
        return await queueItem.promise;
      }
      
      // Start new translation
      const translationPromise = this.performTranslation(vttContent, cacheKey);
      
      // Add to queue
      this.translationQueue.set(cacheKey, {
        status: 'translating',
        progress: 0,
        promise: translationPromise,
        startTime: Date.now()
      });
      
      try {
        const result = await translationPromise;
        this.translationQueue.delete(cacheKey);
        return result;
      } catch (error) {
        this.translationQueue.delete(cacheKey);
        throw error;
      }
      
    } catch (error) {
      console.error('❌ Translation error:', error);
      throw error;
    }
  }

  /**
   * Perform the actual translation (internal)
   */
  async performTranslation(vttContent, cacheKey) {
    console.log('📝 Parsing VTT file...');
    const subtitles = this.parseVTT(vttContent);
    console.log(`✅ Found ${subtitles.length} subtitle entries`);
    
    if (subtitles.length === 0) {
      throw new Error('No subtitles found in VTT file');
    }
    
    // Update progress
    this.updateProgress(cacheKey, 10);
    
    console.log('🤖 Translating with Google Gemini...');
    const translatedSubtitles = await this.translateBatchWithProgress(subtitles, cacheKey);
    
    // Update progress
    this.updateProgress(cacheKey, 90);
    
    console.log('📦 Building translated VTT file...');
    const translatedVTT = this.buildVTT(translatedSubtitles);
    
    // Update progress
    this.updateProgress(cacheKey, 95);
    
    // Save to cache
    await this.saveToCache(cacheKey, translatedVTT);
    
    // Update progress
    this.updateProgress(cacheKey, 100);
    
    console.log('✅ Translation completed successfully!');
    return translatedVTT;
  }
  
  /**
   * Update translation progress
   */
  updateProgress(cacheKey, progress) {
    if (this.translationQueue.has(cacheKey)) {
      const queueItem = this.translationQueue.get(cacheKey);
      queueItem.progress = progress;
      console.log(`📊 Progress: ${progress}%`);
    }
  }
  
  /**
   * Translate batch with progress updates
   */
  async translateBatchWithProgress(subtitles, cacheKey) {
    const MAX_BATCH_SIZE = 100;
    
    if (subtitles.length <= MAX_BATCH_SIZE) {
      this.updateProgress(cacheKey, 50);
      return await this.translateSingleBatch(subtitles, 0);
    }
    
    const numBatches = Math.ceil(subtitles.length / MAX_BATCH_SIZE);
    const PARALLEL_BATCHES = 3;
    const allBatches = [];
    
    for (let i = 0; i < subtitles.length; i += MAX_BATCH_SIZE) {
      const batch = subtitles.slice(i, i + MAX_BATCH_SIZE);
      const batchNum = Math.floor(i / MAX_BATCH_SIZE) + 1;
      allBatches.push({ batch, batchNum, startIndex: i });
    }
    
    const translatedSubtitles = new Array(subtitles.length);
    
    for (let i = 0; i < allBatches.length; i += PARALLEL_BATCHES) {
      const chunk = allBatches.slice(i, i + PARALLEL_BATCHES);
      
      const promises = chunk.map(async ({ batch, batchNum, startIndex }) => {
        const translated = await this.translateSingleBatch(batch, startIndex);
        
        // Update progress
        const completedBatches = Math.min(i + chunk.indexOf({ batch, batchNum, startIndex }) + 1, numBatches);
        const progress = 10 + Math.floor((completedBatches / numBatches) * 80);
        this.updateProgress(cacheKey, progress);
        
        return { translated, startIndex };
      });
      
      const results = await Promise.all(promises);
      
      results.forEach(({ translated, startIndex }) => {
        translated.forEach((sub, idx) => {
          translatedSubtitles[startIndex + idx] = sub;
        });
      });
      
      if (i + PARALLEL_BATCHES < allBatches.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return translatedSubtitles.filter(Boolean);
  }

  /**
   * Translate subtitle from URL
   */
  async translateSubtitleFromURL(subtitleUrl) {
    try {
      console.log('📥 Downloading subtitle from:', subtitleUrl);
      
      // Download original subtitle
      const response = await axios.get(subtitleUrl, {
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const vttContent = response.data;
      console.log('✅ Subtitle downloaded');
      
      // Translate it
      return await this.translateSubtitle(vttContent);
      
    } catch (error) {
      console.error('❌ Error downloading/translating subtitle:', error);
      throw error;
    }
  }
}

module.exports = SubtitleTranslator;
