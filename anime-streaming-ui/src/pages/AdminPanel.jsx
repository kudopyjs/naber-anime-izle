import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BulkAnimeImport from './BulkAnimeImport'
import API_BASE_URL from '../config/api'

function AdminPanel() {
  const navigate = useNavigate()
  const { user, canManageServer } = useAuth()
  const [activeTab, setActiveTab] = useState('categories')
  const [categories, setCategories] = useState([])
  const [animes, setAnimes] = useState([])
  const [bunnyCollections, setBunnyCollections] = useState([])
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [loadingAnimes, setLoadingAnimes] = useState(false)
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
    const loadedUsers = JSON.parse(localStorage.getItem('users') || '[]')
    
    setCategories(loadedCategories)
    setUsers(loadedUsers)
    
    // Backend'den kullanıcıları da yükle
    if (activeTab === 'users') {
      loadBackendUsers()
    }
  }, [activeTab])

  // Load data when anime tab is active
  useEffect(() => {
    if (activeTab === 'anime') {
      loadAnimes()
      loadBunnyCollections()
    }
  }, [activeTab])

  const loadAnimes = async () => {
    setLoadingAnimes(true)
    try {
      const response = await fetch(`${API_BASE_URL}/anime/list`)
      const data = await response.json()
      
      if (data.success) {
        setAnimes(data.animes || [])
      } else {
        console.error('Failed to load animes:', data.error)
      }
    } catch (error) {
      console.error('Error loading animes:', error)
    } finally {
      setLoadingAnimes(false)
    }
  }

  const loadBunnyCollections = async () => {
    setLoadingCollections(true)
    try {
      const response = await fetch(`${API_BASE_URL}/bunny/collections`)
      const data = await response.json()
      
      if (data.success) {
        setBunnyCollections(data.collections || [])
      } else {
        console.error('Failed to load collections:', data.error)
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    } finally {
      setLoadingCollections(false)
    }
  }

  const loadBackendUsers = async () => {
    // Backend'den tüm kullanıcıları yükle (şimdilik users.json'dan)
    // Not: Backend'de tüm kullanıcıları listeleyen endpoint yok, 
    // bu yüzden localStorage'daki kullanıcıları kullanıyoruz
  }

  const handleCreateUserInBackend = async (userId) => {
    const localUsers = JSON.parse(localStorage.getItem('users') || '[]')
    const user = localUsers.find(u => u.id === userId)
    
    if (!user) {
      alert('Kullanıcı bulunamadı!')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          email: user.email
        })
      })

      const data = await response.json()
      if (data.success) {
        alert(`${user.username} için backend kaydı oluşturuldu ve "Daha Sonra İzle" listesi eklendi!`)
      } else {
        alert('Hata: ' + (data.error || 'Bilinmeyen hata'))
      }
    } catch (err) {
      console.error('Error creating user in backend:', err)
      alert('Backend kaydı oluşturulamadı!')
    }
  }

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
  const handleDeleteAnime = async (id) => {
    if (confirm('Bu anime\'yi silmek istediğinizden emin misiniz?')) {
      try {
        // TODO: Backend'e delete isteği gönder
        console.log('Anime silme işlemi:', id)
        // Silme işleminden sonra listeyi yenile
        loadAnimes()
      } catch (error) {
        console.error('Anime silme hatası:', error)
      }
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
          <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('anime')}
              className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'anime'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Manage Anime
            </button>
            <button
              onClick={() => setActiveTab('bulk-import')}
              className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'bulk-import'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              📥 Toplu Anime Ekle
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'users'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
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

          {/* Bulk Anime Import */}
          {activeTab === 'bulk-import' && (
            <BulkAnimeImport />
          )}

          {/* Anime Management */}
          {activeTab === 'anime' && (
            <div className="glassmorphic rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Anime Management</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/bunny-sync')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    🔄 Bunny Sync
                  </button>
                  <button
                    onClick={() => navigate('/add-anime')}
                    className="px-4 py-2 bg-primary hover:bg-primary/80 text-background-dark font-semibold rounded-lg transition-colors"
                  >
                    ➕ Yeni Anime Ekle
                  </button>
                  <button
                    onClick={() => {
                      loadAnimes()
                      loadBunnyCollections()
                    }}
                    disabled={loadingAnimes || loadingCollections}
                    className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {(loadingAnimes || loadingCollections) ? '🔄 Yükleniyor...' : '🔄 Yenile'}
                  </button>
                </div>
              </div>
              
              {/* Kayıtlı Animeler */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4">📚 Kayıtlı Animeler</h3>
                {loadingAnimes ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                    <p className="text-white/60 mt-2">Animeler yükleniyor...</p>
                  </div>
                ) : animes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {animes.map((anime) => {
                      const collection = bunnyCollections.find(c => c.id === anime.collectionId)
                      return (
                        <div
                          key={anime.id}
                          className="bg-black/30 border border-white/10 rounded-lg p-4 hover:border-primary/50 transition-all"
                        >
                          {/* Cover Image */}
                          {anime.coverImage && (
                            <div className="mb-3 rounded-lg overflow-hidden">
                              <img
                                src={anime.coverImage}
                                alt={anime.name}
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold text-lg line-clamp-1">{anime.name}</h4>
                              <p className="text-white/60 text-sm">
                                📁 {collection ? `${collection.videoCount} bölüm` : 'Collection bulunamadı'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 text-xs text-white/40">
                              {anime.genres && anime.genres.length > 0 && (
                                <span className="px-2 py-1 bg-white/10 rounded">{anime.genres[0]}</span>
                              )}
                              <span>📅 {anime.year}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const slug = anime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                  navigate(`/edit-anime/${slug}`)
                                }}
                                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-semibold rounded transition-colors"
                              >
                                ✏️ Düzenle
                              </button>
                              <button
                                onClick={() => {
                                  const slug = anime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                  navigate(`/anime/${slug}`)
                                }}
                                className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-sm font-semibold rounded transition-colors"
                              >
                                👁️ Görüntüle
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-8">
                    Henüz anime kaydedilmemiş. "Yeni Anime Ekle" butonuna tıklayın.
                  </p>
                )}
              </div>
              
              {/* Bunny Collections */}
              <div className="pt-8 border-t border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">📦 Bunny Collections</h3>
                {loadingCollections ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  <p className="text-white/60 mt-4">Bunny.net'ten collection'lar yükleniyor...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bunnyCollections.map((collection) => (
                    <div
                      key={collection.id}
                      className="bg-black/30 border border-white/10 rounded-lg p-4 hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold text-lg">📁 {collection.name}</h3>
                          <p className="text-white/60 text-sm">
                            {collection.videoCount} video{collection.videoCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`https://panel.bunny.net/stream/${import.meta.env.VITE_BUNNY_LIBRARY_ID}/collections/${collection.id}`, '_blank')}
                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-semibold rounded transition-colors"
                          >
                            Bunny'de Aç
                          </button>
                        </div>
                      </div>
                      
                      {/* Örnek videolar */}
                      {collection.videos && collection.videos.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-white/40 text-xs mb-2">Son videolar:</p>
                          <div className="space-y-1">
                            {collection.videos.slice(0, 3).map((video) => (
                              <div key={video.guid} className="text-white/60 text-sm flex items-center gap-2">
                                <span className="text-primary">▶</span>
                                {video.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {bunnyCollections.length === 0 && (
                    <p className="text-white/60 text-center py-8">
                      Bunny.net'te henüz collection bulunamadı.
                    </p>
                  )}
                </div>
              )}
              </div>
              
              {/* Eski veriler kaldırıldı - Sadece API'den veri gösteriliyor */}
              {false && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4">📦 Eski Veriler</h3>
                  <div className="space-y-2">
                    {[].map((anime) => (
                      <div
                        key={anime.id}
                        className="bg-black/20 border border-white/5 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{anime.title}</h4>
                          <p className="text-white/40 text-xs">
                            S{anime.season}E{anime.episode} • {anime.uploadedBy}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAnime(anime.id)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Management */}
          {activeTab === 'users' && (
            <div className="glassmorphic rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
              
              <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm">
                  💡 <strong>Backend ID Verme:</strong> Mevcut kullanıcılara backend kaydı oluşturmak için "Backend ID Ver" butonuna tıklayın. 
                  Bu işlem kullanıcı için otomatik olarak "Daha Sonra İzle" listesi oluşturur.
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white font-semibold p-3">Username</th>
                      <th className="text-left text-white font-semibold p-3">Email</th>
                      <th className="text-left text-white font-semibold p-3">Role</th>
                      <th className="text-left text-white font-semibold p-3">Joined</th>
                      <th className="text-left text-white font-semibold p-3">Backend</th>
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
                            onClick={() => handleCreateUserInBackend(u.id)}
                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-semibold rounded transition-colors border border-green-500/30"
                          >
                            Backend ID Ver
                          </button>
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
                <p className="text-3xl font-bold text-white">{animes.length}</p>
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
