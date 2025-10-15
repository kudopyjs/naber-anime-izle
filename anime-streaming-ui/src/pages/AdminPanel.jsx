import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function AdminPanel() {
  const navigate = useNavigate()
  const { user, canManageServer } = useAuth()
  const [activeTab, setActiveTab] = useState('categories')
  const [categories, setCategories] = useState([])
  const [uploadedAnime, setUploadedAnime] = useState([])
  const [users, setUsers] = useState([])
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' })

  // Redirect if not admin
  if (!canManageServer()) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60 mb-6">You need Admin role to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Load data
  useEffect(() => {
    const loadedCategories = JSON.parse(localStorage.getItem('categories') || '[]')
    const loadedAnime = JSON.parse(localStorage.getItem('uploadedAnime') || '[]')
    const loadedUsers = JSON.parse(localStorage.getItem('users') || '[]')
    
    setCategories(loadedCategories)
    setUploadedAnime(loadedAnime)
    setUsers(loadedUsers)
  }, [])

  // Category Management
  const handleAddCategory = (e) => {
    e.preventDefault()
    const newCat = {
      id: Date.now(),
      name: newCategory.name,
      icon: newCategory.icon || '🎬',
      createdAt: new Date().toISOString()
    }
    const updated = [...categories, newCat]
    setCategories(updated)
    localStorage.setItem('categories', JSON.stringify(updated))
    setNewCategory({ name: '', icon: '' })
  }

  const handleDeleteCategory = (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      const updated = categories.filter(c => c.id !== id)
      setCategories(updated)
      localStorage.setItem('categories', JSON.stringify(updated))
    }
  }

  // Anime Management
  const handleDeleteAnime = (id) => {
    if (confirm('Are you sure you want to delete this anime?')) {
      const updated = uploadedAnime.filter(a => a.id !== id)
      setUploadedAnime(updated)
      localStorage.setItem('uploadedAnime', JSON.stringify(updated))
    }
  }

  // User Management
  const handleChangeUserRole = (userId, newRole) => {
    const updated = users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    )
    setUsers(updated)
    localStorage.setItem('users', JSON.stringify(updated))
  }

  const handleDeleteUser = (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.id !== userId)
      setUsers(updated)
      localStorage.setItem('users', JSON.stringify(updated))
    }
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-white/60">
              Logged in as: <span className="text-primary font-semibold">{user.username}</span> (Admin)
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-white/10">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'categories'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('anime')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'anime'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Manage Anime
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'stats'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Statistics
            </button>
          </div>

          {/* Category Management */}
          {activeTab === 'categories' && (
            <div className="glassmorphic rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Category Management</h2>
              
              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Category name"
                    className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary"
                    required
                  />
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    placeholder="Icon (emoji)"
                    className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary hover:bg-primary/80 text-background-dark font-bold rounded-lg transition-colors"
                  >
                    Add Category
                  </button>
                </div>
              </form>

              {/* Categories List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-black/30 border border-white/10 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-white font-semibold">{category.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-white/60 col-span-full text-center py-8">
                    No categories yet. Add your first category above.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Anime Management */}
          {activeTab === 'anime' && (
            <div className="glassmorphic rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Anime Management</h2>
              
              <div className="space-y-4">
                {uploadedAnime.map((anime) => (
                  <div
                    key={anime.id}
                    className="bg-black/30 border border-white/10 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{anime.title}</h3>
                      <p className="text-white/60 text-sm">
                        Season {anime.season}, Episode {anime.episode} • {anime.genre}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        Uploaded by: {anime.uploadedBy} on {new Date(anime.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAnime(anime.id)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {uploadedAnime.length === 0 && (
                  <p className="text-white/60 text-center py-8">
                    No anime uploaded yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* User Management */}
          {activeTab === 'users' && (
            <div className="glassmorphic rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white font-semibold p-3">Username</th>
                      <th className="text-left text-white font-semibold p-3">Email</th>
                      <th className="text-left text-white font-semibold p-3">Role</th>
                      <th className="text-left text-white font-semibold p-3">Joined</th>
                      <th className="text-left text-white font-semibold p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/5">
                        <td className="text-white p-3">{u.username}</td>
                        <td className="text-white/60 p-3">{u.email}</td>
                        <td className="p-3">
                          <select
                            value={u.role || 'user'}
                            onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                            className="px-3 py-1 bg-black/30 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-primary"
                          >
                            <option value="user">User</option>
                            <option value="fansub">Fansub</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="text-white/60 p-3 text-sm">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user.id}
                            className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="text-white/60 text-center py-8">No users found.</p>
                )}
              </div>
            </div>
          )}

          {/* Statistics */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glassmorphic rounded-xl p-6">
                <div className="text-primary text-4xl mb-2">👥</div>
                <h3 className="text-white font-semibold text-lg mb-1">Total Users</h3>
                <p className="text-3xl font-bold text-white">{users.length}</p>
              </div>
              <div className="glassmorphic rounded-xl p-6">
                <div className="text-primary text-4xl mb-2">🎬</div>
                <h3 className="text-white font-semibold text-lg mb-1">Total Anime</h3>
                <p className="text-3xl font-bold text-white">{uploadedAnime.length}</p>
              </div>
              <div className="glassmorphic rounded-xl p-6">
                <div className="text-primary text-4xl mb-2">📁</div>
                <h3 className="text-white font-semibold text-lg mb-1">Categories</h3>
                <p className="text-3xl font-bold text-white">{categories.length}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

export default AdminPanel
