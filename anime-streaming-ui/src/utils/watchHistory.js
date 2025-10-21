// Watch History Management
const WATCH_HISTORY_KEY = 'anime_watch_history'
const MAX_HISTORY_ITEMS = 20

/**
 * Get watch history from localStorage
 * @returns {Array} Array of watch history items
 */
export const getWatchHistory = () => {
  try {
    const history = localStorage.getItem(WATCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('Error reading watch history:', error)
    return []
  }
}

/**
 * Save watch progress
 * @param {Object} data - Watch data
 * @param {string} data.animeId - Anime ID
 * @param {string} data.animeName - Anime name
 * @param {string} data.poster - Anime poster URL
 * @param {string} data.episodeId - Episode ID
 * @param {number} data.episodeNumber - Episode number
 * @param {string} data.episodeTitle - Episode title
 * @param {number} data.currentTime - Current playback time in seconds
 * @param {number} data.duration - Total video duration in seconds
 * @param {number} data.progress - Progress percentage (0-100)
 */
export const saveWatchProgress = (data) => {
  try {
    const history = getWatchHistory()
    
    // Find existing entry for this anime
    const existingIndex = history.findIndex(item => item.animeId === data.animeId)
    
    const watchItem = {
      animeId: data.animeId,
      animeName: data.animeName,
      poster: data.poster,
      episodeId: data.episodeId,
      episodeNumber: data.episodeNumber,
      episodeTitle: data.episodeTitle,
      currentTime: data.currentTime,
      duration: data.duration,
      progress: data.progress,
      lastWatched: new Date().toISOString()
    }
    
    if (existingIndex !== -1) {
      // Update existing entry
      history[existingIndex] = watchItem
    } else {
      // Add new entry at the beginning
      history.unshift(watchItem)
    }
    
    // Keep only the most recent items
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS)
    
    // Sort by lastWatched (most recent first)
    trimmedHistory.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched))
    
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(trimmedHistory))
    
    return true
  } catch (error) {
    console.error('Error saving watch progress:', error)
    return false
  }
}

/**
 * Get watch progress for a specific anime
 * @param {string} animeId - Anime ID
 * @returns {Object|null} Watch progress data or null
 */
export const getAnimeProgress = (animeId) => {
  const history = getWatchHistory()
  return history.find(item => item.animeId === animeId) || null
}

/**
 * Remove anime from watch history
 * @param {string} animeId - Anime ID
 */
export const removeFromHistory = (animeId) => {
  try {
    const history = getWatchHistory()
    const filtered = history.filter(item => item.animeId !== animeId)
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error removing from history:', error)
    return false
  }
}

/**
 * Clear all watch history
 */
export const clearWatchHistory = () => {
  try {
    localStorage.removeItem(WATCH_HISTORY_KEY)
    return true
  } catch (error) {
    console.error('Error clearing watch history:', error)
    return false
  }
}

/**
 * Check if episode is completed (watched more than 90%)
 * @param {number} progress - Progress percentage
 * @returns {boolean}
 */
export const isEpisodeCompleted = (progress) => {
  return progress >= 90
}
