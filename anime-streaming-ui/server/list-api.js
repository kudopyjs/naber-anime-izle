import express from 'express'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const sqlite = sqlite3.verbose()

// SQLite database
const dbPath = path.join(__dirname, 'data', 'lists.db')
const db = new sqlite.Database(dbPath)

// Initialize database tables
db.serialize(() => {
  // Lists table
  db.run(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_public INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // List items table
  db.run(`
    CREATE TABLE IF NOT EXISTS list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      anime_id TEXT NOT NULL,
      anime_name TEXT NOT NULL,
      anime_poster TEXT,
      status TEXT DEFAULT 'plan_to_watch',
      rating INTEGER,
      notes TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      UNIQUE(list_id, anime_id)
    )
  `)

  // Create default lists for users
  db.run(`
    CREATE TABLE IF NOT EXISTS user_default_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      watching_list_id INTEGER,
      completed_list_id INTEGER,
      plan_to_watch_list_id INTEGER,
      dropped_list_id INTEGER,
      FOREIGN KEY (watching_list_id) REFERENCES lists(id),
      FOREIGN KEY (completed_list_id) REFERENCES lists(id),
      FOREIGN KEY (plan_to_watch_list_id) REFERENCES lists(id),
      FOREIGN KEY (dropped_list_id) REFERENCES lists(id)
    )
  `)

  console.log('✅ Lists database initialized')
})

// Get or create default lists for user
const getOrCreateDefaultLists = (userId, callback) => {
  db.get(
    'SELECT * FROM user_default_lists WHERE user_id = ?',
    [userId],
    (err, row) => {
      if (err) return callback(err)
      
      if (row) {
        return callback(null, row)
      }

      // Create default lists
      const defaultLists = [
        { name: 'İzliyorum', description: 'Şu anda izlediğim animeler' },
        { name: 'Tamamladım', description: 'İzlemeyi bitirdiğim animeler' },
        { name: 'İzleme Listesi', description: 'İzlemeyi planladığım animeler' },
        { name: 'Bıraktım', description: 'İzlemeyi bıraktığım animeler' }
      ]

      const listIds = []
      let completed = 0

      defaultLists.forEach((list, index) => {
        db.run(
          'INSERT INTO lists (user_id, name, description) VALUES (?, ?, ?)',
          [userId, list.name, list.description],
          function(err) {
            if (err) return callback(err)
            
            listIds[index] = this.lastID
            completed++

            if (completed === defaultLists.length) {
              db.run(
                `INSERT INTO user_default_lists 
                (user_id, watching_list_id, completed_list_id, plan_to_watch_list_id, dropped_list_id) 
                VALUES (?, ?, ?, ?, ?)`,
                [userId, listIds[0], listIds[1], listIds[2], listIds[3]],
                function(err) {
                  if (err) return callback(err)
                  
                  callback(null, {
                    user_id: userId,
                    watching_list_id: listIds[0],
                    completed_list_id: listIds[1],
                    plan_to_watch_list_id: listIds[2],
                    dropped_list_id: listIds[3]
                  })
                }
              )
            }
          }
        )
      })
    }
  )
}

// GET /api/lists - Get all lists for user
router.get('/', (req, res) => {
  const userId = req.query.userId || 'guest'

  db.all(
    'SELECT * FROM lists WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      res.json({ lists: rows })
    }
  )
})

// GET /api/lists/default - Get default lists for user
router.get('/default', (req, res) => {
  const userId = req.query.userId || 'guest'

  getOrCreateDefaultLists(userId, (err, defaultLists) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    // Get list details
    const listIds = [
      defaultLists.watching_list_id,
      defaultLists.completed_list_id,
      defaultLists.plan_to_watch_list_id,
      defaultLists.dropped_list_id
    ]

    db.all(
      `SELECT l.*, COUNT(li.id) as item_count 
       FROM lists l 
       LEFT JOIN list_items li ON l.id = li.list_id 
       WHERE l.id IN (?, ?, ?, ?) 
       GROUP BY l.id`,
      listIds,
      (err, lists) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }

        res.json({
          watching: lists.find(l => l.id === defaultLists.watching_list_id),
          completed: lists.find(l => l.id === defaultLists.completed_list_id),
          planToWatch: lists.find(l => l.id === defaultLists.plan_to_watch_list_id),
          dropped: lists.find(l => l.id === defaultLists.dropped_list_id)
        })
      }
    )
  })
})

// GET /api/lists/:id - Get list by ID with items
router.get('/:id', (req, res) => {
  const listId = req.params.id

  db.get('SELECT * FROM lists WHERE id = ?', [listId], (err, list) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    if (!list) {
      return res.status(404).json({ error: 'List not found' })
    }

    db.all(
      'SELECT * FROM list_items WHERE list_id = ? ORDER BY added_at DESC',
      [listId],
      (err, items) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }

        res.json({ ...list, items })
      }
    )
  })
})

// POST /api/lists - Create new list
router.post('/', (req, res) => {
  const { userId, name, description, isPublic } = req.body

  if (!userId || !name) {
    return res.status(400).json({ error: 'userId and name are required' })
  }

  db.run(
    'INSERT INTO lists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)',
    [userId, name, description || '', isPublic ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      res.json({
        id: this.lastID,
        user_id: userId,
        name,
        description,
        is_public: isPublic ? 1 : 0
      })
    }
  )
})

// POST /api/lists/:id/items - Add anime to list
router.post('/:id/items', (req, res) => {
  const listId = req.params.id
  const { animeId, animeName, animePoster, status, rating, notes } = req.body

  if (!animeId || !animeName) {
    return res.status(400).json({ error: 'animeId and animeName are required' })
  }

  db.run(
    `INSERT OR REPLACE INTO list_items 
    (list_id, anime_id, anime_name, anime_poster, status, rating, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [listId, animeId, animeName, animePoster, status || 'plan_to_watch', rating, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      // Update list updated_at
      db.run('UPDATE lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [listId])

      res.json({
        id: this.lastID,
        list_id: listId,
        anime_id: animeId,
        anime_name: animeName,
        anime_poster: animePoster,
        status,
        rating,
        notes
      })
    }
  )
})

// DELETE /api/lists/:id/items/:animeId - Remove anime from list
router.delete('/:id/items/:animeId', (req, res) => {
  const { id, animeId } = req.params

  db.run(
    'DELETE FROM list_items WHERE list_id = ? AND anime_id = ?',
    [id, animeId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      // Update list updated_at
      db.run('UPDATE lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id])

      res.json({ success: true, deleted: this.changes })
    }
  )
})

// GET /api/lists/check/:animeId - Check which lists contain this anime
router.get('/check/:animeId', (req, res) => {
  const { animeId } = req.params
  const userId = req.query.userId || 'guest'

  db.all(
    `SELECT l.*, li.status, li.rating, li.notes 
     FROM lists l 
     INNER JOIN list_items li ON l.id = li.list_id 
     WHERE l.user_id = ? AND li.anime_id = ?`,
    [userId, animeId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      res.json({ lists: rows })
    }
  )
})

// DELETE /api/lists/:id - Delete list
router.delete('/:id', (req, res) => {
  const listId = req.params.id

  db.run('DELETE FROM lists WHERE id = ?', [listId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    res.json({ success: true, deleted: this.changes })
  })
})

export default router
