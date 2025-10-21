import express from 'express'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const sqlite = sqlite3.verbose()

// SQLite database
const dbPath = path.join(__dirname, 'data', 'users.db')
const db = new sqlite.Database(dbPath)

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `)

  // Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Initialize maintenance mode setting
  db.run(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('maintenanceMode', 'false')
  `)

  console.log('✅ Users database initialized')
})

// POST /api/users/register - Register new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' })
  }

  try {
    // Check if user exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (row) {
        return res.status(400).json({ error: 'Email already registered' })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)
      const userId = Date.now().toString()

      // Insert user
      db.run(
        'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
        [userId, name, email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message })
          }

          res.json({
            success: true,
            user: {
              id: userId,
              name,
              email,
              role: 'user',
              createdAt: new Date().toISOString()
            }
          })
        }
      )
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/users/login - Login user
router.post('/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    try {
      // Compare password
      const validPassword = await bcrypt.compare(password, user.password)

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id])

      // Return user without password
      const { password: _, ...userWithoutPassword } = user

      res.json({
        success: true,
        user: {
          ...userWithoutPassword,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLogin: user.last_login
        }
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })
})

// GET /api/users - Get all users (admin only)
router.get('/', (req, res) => {
  const { role, search, limit = 50, offset = 0 } = req.query

  let query = 'SELECT id, name, email, role, created_at, updated_at, last_login FROM users WHERE 1=1'
  const params = []

  if (role) {
    query += ' AND role = ?'
    params.push(role)
  }

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), parseInt(offset))

  db.all(query, params, (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1'
    const countParams = []

    if (role) {
      countQuery += ' AND role = ?'
      countParams.push(role)
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ?)'
      countParams.push(`%${search}%`, `%${search}%`)
    }

    db.get(countQuery, countParams, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      res.json({
        users: users.map(user => ({
          ...user,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLogin: user.last_login
        })),
        total: result.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      })
    })
  })
})

// GET /api/users/:id - Get user by ID
router.get('/:id', (req, res) => {
  const { id } = req.params

  db.get(
    'SELECT id, name, email, avatar, role, created_at, updated_at, last_login FROM users WHERE id = ?',
    [id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json({
        ...user,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login
      })
    }
  )
})

// PUT /api/users/:id - Update user
router.put('/:id', (req, res) => {
  const { id } = req.params
  const { name, email, role, avatar } = req.body

  const updates = []
  const params = []

  if (name) {
    updates.push('name = ?')
    params.push(name)
  }

  if (email) {
    updates.push('email = ?')
    params.push(email)
  }

  if (role) {
    updates.push('role = ?')
    params.push(role)
  }

  if (avatar !== undefined) {
    updates.push('avatar = ?')
    params.push(avatar)
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' })
  }

  updates.push('updated_at = CURRENT_TIMESTAMP')
  params.push(id)

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json({ success: true, updated: this.changes })
    }
  )
})

// DELETE /api/users/:id - Delete user
router.delete('/:id', (req, res) => {
  const { id } = req.params

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true, deleted: this.changes })
  })
})

// GET /api/users/stats/overview - Get user statistics
router.get('/stats/overview', (req, res) => {
  const queries = {
    total: 'SELECT COUNT(*) as count FROM users',
    admins: 'SELECT COUNT(*) as count FROM users WHERE role = "admin"',
    users: 'SELECT COUNT(*) as count FROM users WHERE role = "user"',
    recent: 'SELECT COUNT(*) as count FROM users WHERE created_at >= datetime("now", "-7 days")'
  }

  const stats = {}
  let completed = 0

  Object.keys(queries).forEach(key => {
    db.get(queries[key], (err, result) => {
      if (!err) {
        stats[key] = result.count
      }
      completed++

      if (completed === Object.keys(queries).length) {
        res.json(stats)
      }
    })
  })
})

// GET /api/users/settings/:key - Get a setting
router.get('/settings/:key', (req, res) => {
  const { key } = req.params

  db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!row) {
      return res.status(404).json({ error: 'Setting not found' })
    }

    res.json({ key, value: row.value })
  })
})

// PUT /api/users/settings/:key - Update a setting
router.put('/settings/:key', (req, res) => {
  const { key } = req.params
  const { value } = req.body

  if (value === undefined) {
    return res.status(400).json({ error: 'Value is required' })
  }

  db.run(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    [key, value],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      res.json({ success: true, key, value })
    }
  )
})

export default router
