import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function UserProfile() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedList, setSelectedList] = useState(null)

  const isOwnProfile = currentUser?.id === userId

  useEffect(() => {
    loadUserProfile()
  }, [userId, currentUser])

  const loadUserProfile = async () => {
    setLoading(true)
    setError('')

    try {
      // Kullanıcı bilgilerini yükle
      const userResponse = await fetch(`http://localhost:5002/api/user/${userId}`)
      const userData = await userResponse.json()

      if (!userData.success) {
        throw new Error('Kullanıcı bulunamadı')
      }

      setUser(userData.user)

      // Listeleri yükle
      const listsResponse = await fetch(
        `http://localhost:5002/api/user/${userId}/lists?viewerId=${currentUser?.id || ''}`
      )
      const listsData = await listsResponse.json()

      if (listsData.success) {
        setLists(listsData.lists)
        if (listsData.lists.length > 0) {
          setSelectedList(listsData.lists[0])
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError(err.message || 'Profil yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromList = async (listId, animeSlug) => {
    if (!confirm('Bu anime listeden kaldırılsın mı?')) return

    try {
      const response = await fetch(`http://localhost:5002/api/list/${listId}/remove-anime/${animeSlug}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        // Listeyi güncelle
        loadUserProfile()
        alert('Anime listeden kaldırıldı!')
      }
    } catch (err) {
      console.error('Error removing from list:', err)
      alert('Hata oluştu!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-white/60">Profil yükleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">😕 Kullanıcı Bulunamadı</h1>
            <p className="text-white/60 mb-6">{error || 'Bu kullanıcı mevcut değil'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/80 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphic rounded-xl p-8 mb-8"
        >
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{user.username}</h1>
              <p className="text-white/60">{user.email}</p>
              <p className="text-white/40 text-sm mt-2">
                Üyelik: {new Date(user.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>

            {isOwnProfile && (
              <div>
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors">
                  Profili Düzenle
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Lists Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            {isOwnProfile ? 'Listelerim' : `${user.username}'in Listeleri`}
          </h2>

          {lists.length === 0 ? (
            <div className="glassmorphic rounded-xl p-12 text-center">
              <p className="text-white/60 text-lg">
                {isOwnProfile ? 'Henüz liste oluşturmadınız' : 'Bu kullanıcının public listesi yok'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lists Sidebar */}
              <div className="space-y-2">
                {lists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedList(list)}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      selectedList?.id === list.id
                        ? 'bg-primary text-background-dark'
                        : 'bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{list.name}</p>
                      <span className="text-sm opacity-60">
                        {list.isPublic ? '🌐' : '🔒'}
                      </span>
                    </div>
                    <p className="text-sm opacity-60">{list.animes.length} anime</p>
                  </button>
                ))}
              </div>

              {/* Selected List Content */}
              <div className="lg:col-span-2">
                {selectedList && (
                  <div className="glassmorphic rounded-xl p-6">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{selectedList.name}</h3>
                      {selectedList.description && (
                        <p className="text-white/60">{selectedList.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-white/40">
                        <span>{selectedList.animes.length} anime</span>
                        <span>•</span>
                        <span>{selectedList.isPublic ? '🌐 Public' : '🔒 Private'}</span>
                        <span>•</span>
                        <span>{new Date(selectedList.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>

                    {/* Anime Grid */}
                    {selectedList.animes.length === 0 ? (
                      <p className="text-white/60 text-center py-12">Bu liste boş</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedList.animes.map(anime => (
                          <div key={anime.slug} className="relative group">
                            <Link
                              to={`/anime/${anime.slug}`}
                              className="block"
                            >
                              <div className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all border border-white/10 hover:border-primary/50">
                                <p className="text-white font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                  {anime.name}
                                </p>
                                <p className="text-white/40 text-xs mt-2">
                                  Eklendi: {new Date(anime.addedAt).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                            </Link>
                            
                            {/* Kaldır Butonu - Sadece kendi profilinde */}
                            {isOwnProfile && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleRemoveFromList(selectedList.id, anime.slug)
                                }}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                title="Listeden Kaldır"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

export default UserProfile
