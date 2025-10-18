/**
 * TürkAnime API Backend
 * 
 * Bu API, Python'daki turkanime-indirici kütüphanesini kullanarak
 * TürkAnime'den anime verilerini çeker ve React frontend'e sunar.
 * 
 * Kullanım:
 * 1. Python'da turkanime-indirici kurulu olmalı: pip install turkanime-cli
 * 2. Bu API'yi başlat: node server/turkanime-api.js
 * 3. Frontend'den http://localhost:5002 üzerinden erişilebilir
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

// Uploads klasörünü static olarak servis et
const uploadsBaseDir = path.join(__dirname, 'uploads', 'covers');
if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper: Anime adından güvenli klasör adı oluştur
function sanitizeFolderName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Özel karakterleri kaldır
    .replace(/\s+/g, '-')         // Boşlukları tire ile değiştir
    .replace(/-+/g, '-')          // Çoklu tireleri tek tireye indir
    .trim();
}

// Multer configuration - geçici klasöre kaydet
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Geçici klasöre kaydet (req.body henüz parse edilmedi)
    const tempDir = path.join(uploadsBaseDir, 'temp');
    
    // Temp klasörünü oluştur
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Benzersiz dosya adı oluştur
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
  }
});

// Python script'lerinin bulunduğu dizin
const PYTHON_SCRIPTS_DIR = path.join(__dirname, '..', '..', 'bunny_scripts', 'turkanime-indirici-8.2.2');

/**
 * Python script'ini çalıştırır ve sonucu döndürür
 */
function runPythonScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    // Komutu konsola logla
    const command = `python ${scriptPath} ${args.join(' ')}`;
    console.log('\n🐍 Python Command:');
    console.log('─'.repeat(80));
    console.log(command);
    console.log('─'.repeat(80));
    
    // Python encoding environment variable
    const env = { ...process.env, PYTHONIOENCODING: 'utf-8' };
    
    const python = spawn('python3', [scriptPath, ...args], { env });
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      // Real-time output göster
      process.stdout.write(output);
    });
    
    python.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      // Real-time error göster
      process.stderr.write(output);
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python stderr:', stderr);
        console.error('Python stdout:', stdout);
        reject(new Error(`Python script failed (code ${code}): ${stderr || stdout}`));
      } else {
        try {
          // Son satırı al (JSON olmalı), önceki satırlar progress mesajları olabilir
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);
          resolve(result);
        } catch (error) {
          console.error('JSON parse error:', error);
          console.error('Raw output:', stdout);
          console.error('Last line:', stdout.trim().split('\n').pop());
          reject(new Error(`JSON parse failed: ${error.message}`));
        }
      }
    });
  });
}

/**
 * GET /api/turkanime/search
 * TürkAnime'de anime ara
 * Query params: q (arama terimi)
 */
app.get('/api/turkanime/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (!query) {
      return res.json({ results: [] });
    }
    
    // Python helper script'ini çağır
    const scriptPath = path.join(__dirname, 'turkanime-helpers', 'search_anime.py');
    const result = await runPythonScript(scriptPath, [query]);
    
    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/turkanime/anime/:slug
 * Anime detaylarını ve bölüm listesini getir
 */
app.get('/api/turkanime/anime/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Python helper script'ini çağır
    const scriptPath = path.join(__dirname, 'turkanime-helpers', 'get_anime_details.py');
    const result = await runPythonScript(scriptPath, [slug]);
    
    res.json(result);
  } catch (error) {
    console.error('Anime details error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/turkanime/import-episode
 * Bir bölümü TürkAnime'den çekip Bunny CDN'e yükle
 * Body: { animeSlug, episodeSlug, uploadedBy }
 */
app.post('/api/turkanime/import-episode', async (req, res) => {
  try {
    const { animeSlug, episodeSlug, uploadedBy, fansub } = req.body;
    
    if (!animeSlug || !episodeSlug) {
      return res.status(400).json({ error: 'animeSlug and episodeSlug are required' });
    }
    
    console.log('\n📥 Episode Import Request:');
    console.log('  Anime:', animeSlug);
    console.log('  Episode:', episodeSlug);
    console.log('  Uploaded By:', uploadedBy || 'admin');
    console.log('  Fansub:', fansub || uploadedBy || 'admin');
    
    // Hemen yanıt ver (async olarak çalışacak)
    res.json({
      success: true,
      message: 'Import başlatıldı, arka planda çalışıyor...',
      status: 'processing'
    });
    
    // Python script'ini arka planda çalıştır
    const scriptPath = path.join(__dirname, 'turkanime-helpers', 'import_episode.py');
    const scriptArgs = [animeSlug, episodeSlug, uploadedBy || 'admin'];
    
    // Fansub parametresi varsa ekle
    if (fansub) {
      scriptArgs.push(fansub);
    }
    
    runPythonScript(scriptPath, scriptArgs)
      .then(result => {
        console.log('✅ Import completed:', result.success ? 'SUCCESS' : 'FAILED');
        if (result.videoId) {
          console.log('  Video ID:', result.videoId);
        }
        if (!result.success && result.error) {
          console.log('  ❌ Error:', result.error);
          if (result.detail) {
            console.log('  📋 Detail:', result.detail);
          }
        }
      })
      .catch(error => {
        console.error('❌ Import failed:', error.message);
      });
    
  } catch (error) {
    console.error('Import episode error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message, 
      success: false,
      detail: error.stack 
    });
  }
});

/**
 * GET /api/turkanime/list-all
 * Tüm anime listesini getir
 */
app.get('/api/turkanime/list-all', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, 'turkanime-helpers', 'list_all_anime.py');
    const result = await runPythonScript(scriptPath);
    
    res.json(result);
  } catch (error) {
    console.error('List all anime error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bunny/collections
 * Bunny.net'ten tüm collection'ları getir
 */
app.get('/api/bunny/collections', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, 'turkanime-helpers', 'list_bunny_collections.py');
    const result = await runPythonScript(scriptPath);
    
    res.json(result);
  } catch (error) {
    console.error('List collections error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bunny/collection/:id/videos
 * Belirli bir collection'ın videolarını getir
 */
app.get('/api/bunny/collection/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const scriptPath = path.join(__dirname, 'turkanime-helpers', 'get_collection_videos.py');
    const result = await runPythonScript(scriptPath, [id]);
    
    res.json(result);
  } catch (error) {
    console.error('Get collection videos error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bunny/sync
 * Bunny.net'ten anime detaylarını senkronize et
 */
app.post('/api/bunny/sync', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, 'turkanime-helpers', 'sync_anime_from_bunny.py');
    const result = await runPythonScript(scriptPath);
    
    res.json(result);
  } catch (error) {
    console.error('Sync anime error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bunny/video/:id
 * Belirli bir video'nun bilgilerini getir
 */
app.get('/api/bunny/video/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const scriptPath = path.join(__dirname, 'turkanime-helpers', 'get_video_info.py');
    const result = await runPythonScript(scriptPath, [id]);
    
    res.json(result);
  } catch (error) {
    console.error('Get video info error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bunny/sync-data
 * Bunny sync JSON dosyasını döndür
 */
app.get('/api/bunny/sync-data', (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data', 'bunny_anime_sync.json');
    
    // Dosya yoksa boş data döndür
    if (!fs.existsSync(dataPath)) {
      return res.json({
        success: true,
        animes: [],
        total: 0,
        message: 'Henüz senkronizasyon yapılmamış'
      });
    }
    
    const data = fs.readFileSync(dataPath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Get sync data error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * PUT /api/anime/update
 * Anime bilgilerini güncelle
 */
app.put('/api/anime/update', (req, res) => {
  try {
    const { oldName, name, description, genres, status, year, rating, coverImage } = req.body;
    const dataPath = path.join(__dirname, 'data', 'animes.json');
    
    // Anime.json dosyasını oku
    let animes = [];
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      animes = JSON.parse(data);
    }
    
    // Anime'yi bul
    const animeIndex = animes.findIndex(a => a.name === oldName);
    
    if (animeIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Anime bulunamadı'
      });
    }
    
    // Anime'yi güncelle
    animes[animeIndex] = {
      ...animes[animeIndex],
      name: name || animes[animeIndex].name,
      description: description || animes[animeIndex].description,
      genres: genres || animes[animeIndex].genres,
      status: status || animes[animeIndex].status,
      year: year || animes[animeIndex].year,
      rating: rating || animes[animeIndex].rating,
      coverImage: coverImage || animes[animeIndex].coverImage,
      updatedAt: new Date().toISOString()
    };
    
    // Dosyaya kaydet
    fs.writeFileSync(dataPath, JSON.stringify(animes, null, 2));
    
    res.json({
      success: true,
      message: 'Anime başarıyla güncellendi',
      anime: animes[animeIndex]
    });
  } catch (error) {
    console.error('Update anime error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/anime/upload-cover
 * Anime cover görseli yükle
 * Body: animeName (form-data)
 */
app.post('/api/anime/upload-cover', upload.single('cover'), (req, res) => {
  try {
    console.log('📥 Received upload request');
    console.log('📦 req.body:', req.body);
    console.log('📁 req.file:', req.file ? req.file.filename : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Görsel dosyası gerekli' 
      });
    }
    
    const animeName = req.body.animeName || 'unknown';
    console.log('🎬 Anime name:', animeName);
    
    const folderName = sanitizeFolderName(animeName);
    console.log('📂 Folder name:', folderName);
    
    // Dosyayı temp'ten anime klasörüne taşı
    const animeDir = path.join(uploadsBaseDir, folderName);
    const oldPath = req.file.path;
    const ext = path.extname(req.file.filename);
    const newFilename = `cover${ext}`;
    const newPath = path.join(animeDir, newFilename);
    
    console.log('📦 Moving file from temp to anime folder');
    console.log('  From:', oldPath);
    console.log('  To:', newPath);
    
    // Anime klasörünü oluştur
    if (!fs.existsSync(animeDir)) {
      fs.mkdirSync(animeDir, { recursive: true });
    }
    
    // Dosyayı taşı
    fs.renameSync(oldPath, newPath);
    
    // req.file bilgilerini güncelle
    req.file.destination = animeDir;
    req.file.path = newPath;
    req.file.filename = newFilename;
    
    const coverUrl = `/uploads/covers/${folderName}/${newFilename}`;
    
    res.json({
      success: true,
      coverUrl: coverUrl,
      filename: req.file.filename,
      folderName: folderName,
      message: 'Görsel başarıyla yüklendi'
    });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/anime/create
 * Yeni anime metadata'sı oluştur (collection oluşturmaz, sadece kaydeder)
 */
app.post('/api/anime/create', async (req, res) => {
  try {
    const { name, collectionId, description, genres, year, status, createdBy, coverImage } = req.body;
    
    if (!name || !collectionId) {
      return res.status(400).json({ error: 'Name and collectionId are required' });
    }
    
    // LocalStorage benzeri bir JSON dosyasına kaydet
    const animesPath = path.join(__dirname, 'data', 'animes.json');
    
    // Data klasörünü oluştur
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Mevcut animeleri oku
    let animes = [];
    if (fs.existsSync(animesPath)) {
      const data = fs.readFileSync(animesPath, 'utf8');
      animes = JSON.parse(data);
    }
    
    // Aynı isimde anime var mı kontrol et
    const exists = animes.some(a => a.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        error: `"${name}" isimli anime zaten kayıtlı` 
      });
    }
    
    // Yeni anime ekle
    const newAnime = {
      id: Date.now().toString(),
      name,
      collectionId,
      description: description || '',
      genres: genres || [],
      year: year || new Date().getFullYear(),
      status: status || 'ongoing',
      coverImage: coverImage || '',
      createdBy: createdBy || 'admin',
      createdAt: new Date().toISOString()
    };
    
    animes.push(newAnime);
    
    // Dosyaya kaydet
    fs.writeFileSync(animesPath, JSON.stringify(animes, null, 2), 'utf8');
    
    res.json({
      success: true,
      anime: newAnime,
      message: `"${name}" anime'si başarıyla oluşturuldu`
    });
  } catch (error) {
    console.error('Create anime error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/anime/list
 * Tüm animeleri listele
 */
app.get('/api/anime/list', async (req, res) => {
  try {
    const animesPath = path.join(__dirname, 'data', 'animes.json');
    
    if (!fs.existsSync(animesPath)) {
      return res.json({ success: true, animes: [] });
    }
    
    const data = fs.readFileSync(animesPath, 'utf8');
    const animes = JSON.parse(data);
    
    res.json({ success: true, animes });
  } catch (error) {
    console.error('List animes error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ==========================================
 * USER & LIST MANAGEMENT API
 * ==========================================
 */

/**
 * POST /api/user/create
 * Yeni kullanıcı oluştur (signup sırasında otomatik)
 */
app.post('/api/user/create', (req, res) => {
  try {
    const { userId, username, email } = req.body;
    const usersPath = path.join(__dirname, 'data', 'users.json');
    const listsPath = path.join(__dirname, 'data', 'lists.json');
    
    // Users dosyasını oku
    let users = [];
    if (fs.existsSync(usersPath)) {
      const data = fs.readFileSync(usersPath, 'utf-8');
      users = JSON.parse(data);
    }
    
    // Kullanıcı zaten var mı kontrol et
    if (users.find(u => u.id === userId)) {
      return res.json({ success: true, message: 'User already exists' });
    }
    
    // Yeni kullanıcı oluştur
    const newUser = {
      id: userId,
      username,
      email,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    
    // Otomatik "Daha Sonra İzle" listesi oluştur
    let lists = [];
    if (fs.existsSync(listsPath)) {
      const data = fs.readFileSync(listsPath, 'utf-8');
      lists = JSON.parse(data);
    }
    
    const defaultList = {
      id: `${userId}-watch-later-${Date.now()}`,
      userId: userId,
      name: 'Daha Sonra İzle',
      description: 'İzlemek istediğim animeler',
      isPublic: false,
      animes: [],
      createdAt: new Date().toISOString()
    };
    
    lists.push(defaultList);
    fs.writeFileSync(listsPath, JSON.stringify(lists, null, 2));
    
    res.json({
      success: true,
      user: newUser,
      defaultList: defaultList
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/user/:userId
 * Kullanıcı bilgilerini getir
 */
app.get('/api/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const usersPath = path.join(__dirname, 'data', 'users.json');
    
    if (!fs.existsSync(usersPath)) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const data = fs.readFileSync(usersPath, 'utf-8');
    const users = JSON.parse(data);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/user/:userId/lists
 * Kullanıcının listelerini getir
 * Query: viewerId (eğer farklı kullanıcı bakıyorsa, sadece public listeleri göster)
 */
app.get('/api/user/:userId/lists', (req, res) => {
  try {
    const { userId } = req.params;
    const { viewerId } = req.query;
    const listsPath = path.join(__dirname, 'data', 'lists.json');
    
    if (!fs.existsSync(listsPath)) {
      return res.json({ success: true, lists: [] });
    }
    
    const data = fs.readFileSync(listsPath, 'utf-8');
    let lists = JSON.parse(data);
    
    // Kullanıcının listelerini filtrele
    lists = lists.filter(l => l.userId === userId);
    
    // Eğer başka biri bakıyorsa, sadece public listeleri göster
    if (viewerId !== userId) {
      lists = lists.filter(l => l.isPublic);
    }
    
    res.json({ success: true, lists });
  } catch (error) {
    console.error('Get user lists error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/list/create
 * Yeni liste oluştur
 */
app.post('/api/list/create', (req, res) => {
  try {
    const { userId, name, description, isPublic } = req.body;
    const listsPath = path.join(__dirname, 'data', 'lists.json');
    
    let lists = [];
    if (fs.existsSync(listsPath)) {
      const data = fs.readFileSync(listsPath, 'utf-8');
      lists = JSON.parse(data);
    }
    
    const newList = {
      id: `${userId}-${Date.now()}`,
      userId,
      name,
      description: description || '',
      isPublic: isPublic || false,
      animes: [],
      createdAt: new Date().toISOString()
    };
    
    lists.push(newList);
    fs.writeFileSync(listsPath, JSON.stringify(lists, null, 2));
    
    res.json({ success: true, list: newList });
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/list/:listId/add-anime
 * Listeye anime ekle
 */
app.post('/api/list/:listId/add-anime', (req, res) => {
  try {
    const { listId } = req.params;
    const { animeSlug, animeName } = req.body;
    const listsPath = path.join(__dirname, 'data', 'lists.json');
    
    const data = fs.readFileSync(listsPath, 'utf-8');
    const lists = JSON.parse(data);
    
    const list = lists.find(l => l.id === listId);
    if (!list) {
      return res.status(404).json({ success: false, error: 'List not found' });
    }
    
    // Anime zaten listede mi kontrol et
    if (list.animes.find(a => a.slug === animeSlug)) {
      return res.json({ success: true, message: 'Anime already in list' });
    }
    
    // Anime'yi ekle
    list.animes.push({
      slug: animeSlug,
      name: animeName,
      addedAt: new Date().toISOString()
    });
    
    fs.writeFileSync(listsPath, JSON.stringify(lists, null, 2));
    
    res.json({ success: true, list });
  } catch (error) {
    console.error('Add anime to list error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/list/:listId/remove-anime/:animeSlug
 * Listeden anime çıkar
 */
app.delete('/api/list/:listId/remove-anime/:animeSlug', (req, res) => {
  try {
    const { listId, animeSlug } = req.params;
    const listsPath = path.join(__dirname, 'data', 'lists.json');
    
    const data = fs.readFileSync(listsPath, 'utf-8');
    const lists = JSON.parse(data);
    
    const list = lists.find(l => l.id === listId);
    if (!list) {
      return res.status(404).json({ success: false, error: 'List not found' });
    }
    
    list.animes = list.animes.filter(a => a.slug !== animeSlug);
    
    fs.writeFileSync(listsPath, JSON.stringify(lists, null, 2));
    
    res.json({ success: true, list });
  } catch (error) {
    console.error('Remove anime from list error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 TürkAnime API running on http://localhost:${PORT}`);
  console.log(`📁 Python scripts directory: ${PYTHON_SCRIPTS_DIR}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  /api/turkanime/search?q=<query>`);
  console.log(`  GET  /api/turkanime/anime/:slug`);
  console.log(`  POST /api/turkanime/import-episode`);
  console.log(`  GET  /api/turkanime/list-all`);
  console.log(`  GET  /api/bunny/collections`);
  console.log(`  POST /api/anime/create`);
  console.log(`  GET  /api/anime/list`);
  console.log(`  POST /api/user/create`);
  console.log(`  GET  /api/user/:userId`);
  console.log(`  GET  /api/user/:userId/lists`);
  console.log(`  POST /api/list/create`);
  console.log(`  POST /api/list/:listId/add-anime`);
  console.log(`  DELETE /api/list/:listId/remove-anime/:slug`);
  console.log(`  GET  /api/b2/folders`);
  console.log(`  GET  /api/b2/anime/:animeSlug/season/:seasonNumber`);
});

/**
 * GET /api/b2/folders
 * B2'deki anime klasörlerini listele
 */
app.get('/api/b2/folders', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // B2 CLI ile klasörleri listele
    const { stdout } = await execPromise('b2 ls kudopy');
    
    // Klasörleri parse et
    const folders = stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return parts[parts.length - 1]; // Son kısım klasör adı
      })
      .filter(name => name && !name.includes('.'));
    
    res.json({ success: true, folders });
  } catch (error) {
    console.error('B2 folders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/b2/anime/:animeSlug/season/:seasonNumber
 * B2'den belirli bir anime sezonunun bölümlerini getir
 */
app.get('/api/b2/anime/:animeSlug/season/:seasonNumber', async (req, res) => {
  try {
    const { animeSlug, seasonNumber } = req.params;
    
    // Anime adını slug'dan oluştur
    const animeName = animeSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // B2'de klasör yapısı: "Anime Name Season X/Episode Y/"
    const seasonFolder = `${animeName} Season ${seasonNumber}`;
    
    // B2 CLI ile bölümleri listele
    const { stdout } = await execPromise(`b2 ls kudopy "${seasonFolder}/"`);
    
    // Bölümleri parse et
    const episodes = [];
    const lines = stdout.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const folderName = parts[parts.length - 1];
      
      if (folderName && folderName.startsWith('Episode ')) {
        const episodeNum = parseInt(folderName.replace('Episode ', '').replace('/', ''));
        episodes.push({
          number: episodeNum,
          title: `Episode ${episodeNum}`,
          path: `${seasonFolder}/Episode ${episodeNum}`,
        });
      }
    }
    
    // Episode numarasına göre sırala
    episodes.sort((a, b) => a.number - b.number);
    
    res.json({
      success: true,
      anime: { name: animeName, slug: animeSlug },
      season: parseInt(seasonNumber),
      episodes,
    });
  } catch (error) {
    console.error('B2 anime season error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
