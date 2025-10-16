import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

function AddToListModal({ isOpen, onClose, anime }) {
  const { user } = useAuth()
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateList, setShowCreateList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [newListIsPublic, setNewListIsPublic] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      loadUserLists()
    }
  }, [isOpen, user])

  const loadUserLists = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5002/api/user/${user.id}/lists?viewerId=${user.id}`)
      const data = await response.json()
      if (data.success) {
        setLists(data.lists)
      }
    } catch (err) {
      console.error('Error loading lists:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToList = async (listId) => {
    try {
      const animeSlug = anime.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      const response = await fetch(`http://localhost:5002/api/list/${listId}/add-anime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeSlug: animeSlug,
          animeName: anime.name
        })
      })

      const data = await response.json()
      if (data.success) {
        // Liste güncellendi
        loadUserLists()
        alert('Anime listeye eklendi!')
      }
    } catch (err) {
      console.error('Error adding to list:', err)
      alert('Hata oluştu!')
    }
  }

  const handleCreateList = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('http://localhost:5002/api/list/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newListName,
          description: newListDescription,
          isPublic: newListIsPublic
        })
      })

      const data = await response.json()
      if (data.success) {
        setNewListName('')
        setNewListDescription('')
        setNewListIsPublic(false)
        setShowCreateList(false)
        loadUserLists()
      }
    } catch (err) {
      console.error('Error creating list:', err)
      alert('Liste oluşturulamadı!')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-background-dark border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Listeye Ekle</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl transition-colors"
            >
              ×
            </button>
          </div>

          {/* Anime Info */}
          <div className="mb-6 p-4 bg-white/5 rounded-lg">
            <p className="text-white font-semibold">{anime?.name}</p>
          </div>

          {!showCreateList ? (
            <>
              {/* Lists */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : lists.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {lists.map(list => {
                    const animeSlug = anime?.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    const isInList = list.animes.some(a => a.slug === animeSlug)
                    
                    return (
                      <button
                        key={list.id}
                        onClick={() => !isInList && handleAddToList(list.id)}
                        disabled={isInList}
                        className={`w-full p-4 rounded-lg text-left transition-all ${
                          isInList
                            ? 'bg-green-500/20 border border-green-500/30 cursor-not-allowed'
                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold">{list.name}</p>
                            <p className="text-white/60 text-sm">
                              {list.animes.length} anime • {list.isPublic ? '🌐 Public' : '🔒 Private'}
                            </p>
                          </div>
                          {isInList && (
                            <span className="text-green-400">✓</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">Henüz listeniz yok</p>
              )}

              {/* Create New List Button */}
              <button
                onClick={() => setShowCreateList(true)}
                className="w-full px-4 py-3 bg-primary hover:bg-primary/80 text-background-dark font-bold rounded-lg transition-colors"
              >
                + Yeni Liste Oluştur
              </button>
            </>
          ) : (
            /* Create List Form */
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Liste Adı *</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="Örn: İzlemeyi Planlıyorum"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Açıklama</label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none resize-none"
                  placeholder="Liste hakkında kısa açıklama..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newListIsPublic}
                  onChange={(e) => setNewListIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                />
                <label htmlFor="isPublic" className="text-white">
                  Public (Herkes görebilir)
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateList(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary/80 text-background-dark font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default AddToListModal
