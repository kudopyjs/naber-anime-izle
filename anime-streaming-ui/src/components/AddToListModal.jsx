import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import listService from '../services/listService'

function AddToListModal({ isOpen, onClose, anime }) {
  const [defaultLists, setDefaultLists] = useState(null)
  const [customLists, setCustomLists] = useState([])
  const [animeInLists, setAnimeInLists] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateList, setShowCreateList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen && anime) {
      loadLists()
    }
  }, [isOpen, anime])

  const loadLists = async () => {
    setLoading(true)
    try {
      const [defaultListsData, customListsData, animeListsData] = await Promise.all([
        listService.getDefaultLists(),
        listService.getLists(),
        listService.checkAnimeInLists(anime.id)
      ])

      setDefaultLists(defaultListsData)
      setCustomLists(customListsData.lists || [])
      setAnimeInLists(animeListsData.lists || [])
    } catch (err) {
      console.error('Error loading lists:', err)
    } finally {
      setLoading(false)
    }
  }

  const isInList = (listId) => {
    return animeInLists.some(item => item.id === listId)
  }

  const handleToggleList = async (listId) => {
    try {
      if (isInList(listId)) {
        await listService.removeFromList(listId, anime.id)
      } else {
        await listService.addToList(listId, anime)
      }
      await loadLists()
    } catch (err) {
      console.error('Error toggling list:', err)
      alert('Hata oluştu!')
    }
  }

  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListName.trim()) return

    setCreating(true)
    try {
      await listService.createList(newListName, newListDescription)
      setNewListName('')
      setNewListDescription('')
      setShowCreateList(false)
      await loadLists()
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
              {/* Loading */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  {/* Default Lists */}
                  {defaultLists && (
                    <div className="space-y-2">
                      <h3 className="text-white/60 text-sm font-semibold mb-2">Varsayılan Listeler</h3>
                      {[
                        { key: 'watching', list: defaultLists.watching, icon: '▶️', label: 'İzliyorum' },
                        { key: 'completed', list: defaultLists.completed, icon: '✅', label: 'Tamamladım' },
                        { key: 'planToWatch', list: defaultLists.planToWatch, icon: '📝', label: 'İzleme Listesi' },
                        { key: 'dropped', list: defaultLists.dropped, icon: '❌', label: 'Bıraktım' }
                      ].map(({ key, list, icon, label }) => {
                        if (!list) return null
                        const inList = isInList(list.id)
                        
                        return (
                          <button
                            key={key}
                            onClick={() => handleToggleList(list.id)}
                            className={`w-full px-4 py-3 rounded-lg transition-all text-left ${
                              inList
                                ? 'bg-primary/20 border-2 border-primary'
                                : 'bg-white/5 hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{icon}</span>
                                <div>
                                  <p className="text-white font-semibold">{label}</p>
                                  <p className="text-white/60 text-sm">
                                    {list.item_count || 0} anime
                                  </p>
                                </div>
                              </div>
                              {inList && (
                                <span className="text-primary text-xl">✓</span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Custom Lists */}
                  {customLists.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-white/60 text-sm font-semibold mb-2">Özel Listeler</h3>
                      {customLists.map(list => {
                        const inList = isInList(list.id)
                        
                        return (
                          <button
                            key={list.id}
                            onClick={() => handleToggleList(list.id)}
                            className={`w-full px-4 py-3 rounded-lg transition-all text-left ${
                              inList
                                ? 'bg-primary/20 border-2 border-primary'
                                : 'bg-white/5 hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-semibold">{list.name}</p>
                                {list.description && (
                                  <p className="text-white/60 text-sm">{list.description}</p>
                                )}
                              </div>
                              {inList && (
                                <span className="text-primary text-xl">✓</span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
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
