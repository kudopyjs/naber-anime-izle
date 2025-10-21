// List Service - Anime list management
const API_BASE = import.meta.env.VITE_DOWNLOAD_API_URL || 'http://localhost:5001'

class ListService {
  /**
   * Get user ID from localStorage or use guest
   */
  getUserId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.id || 'guest'
  }

  /**
   * Get all lists for current user
   */
  async getLists() {
    try {
      const userId = this.getUserId()
      const response = await fetch(`${API_BASE}/api/lists?userId=${userId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching lists:', error)
      throw error
    }
  }

  /**
   * Get default lists (Watching, Completed, Plan to Watch, Dropped)
   */
  async getDefaultLists() {
    try {
      const userId = this.getUserId()
      const response = await fetch(`${API_BASE}/api/lists/default?userId=${userId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching default lists:', error)
      throw error
    }
  }

  /**
   * Get list by ID with items
   */
  async getList(listId) {
    try {
      const response = await fetch(`${API_BASE}/api/lists/${listId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching list:', error)
      throw error
    }
  }

  /**
   * Create new list
   */
  async createList(name, description = '', isPublic = false) {
    try {
      const userId = this.getUserId()
      const response = await fetch(`${API_BASE}/api/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          name,
          description,
          isPublic
        })
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error creating list:', error)
      throw error
    }
  }

  /**
   * Add anime to list
   */
  async addToList(listId, anime, status = 'plan_to_watch', rating = null, notes = '') {
    try {
      const response = await fetch(`${API_BASE}/api/lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          animeId: anime.id,
          animeName: anime.name,
          animePoster: anime.poster,
          status,
          rating,
          notes
        })
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error adding to list:', error)
      throw error
    }
  }

  /**
   * Remove anime from list
   */
  async removeFromList(listId, animeId) {
    try {
      const response = await fetch(`${API_BASE}/api/lists/${listId}/items/${animeId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error removing from list:', error)
      throw error
    }
  }

  /**
   * Check which lists contain this anime
   */
  async checkAnimeInLists(animeId) {
    try {
      const userId = this.getUserId()
      const response = await fetch(`${API_BASE}/api/lists/check/${animeId}?userId=${userId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error checking anime in lists:', error)
      throw error
    }
  }

  /**
   * Delete list
   */
  async deleteList(listId) {
    try {
      const response = await fetch(`${API_BASE}/api/lists/${listId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error deleting list:', error)
      throw error
    }
  }

  /**
   * Quick add to default lists
   */
  async addToWatching(anime) {
    const lists = await this.getDefaultLists()
    return this.addToList(lists.watching.id, anime, 'watching')
  }

  async addToCompleted(anime) {
    const lists = await this.getDefaultLists()
    return this.addToList(lists.completed.id, anime, 'completed')
  }

  async addToPlanToWatch(anime) {
    const lists = await this.getDefaultLists()
    return this.addToList(lists.planToWatch.id, anime, 'plan_to_watch')
  }

  async addToDropped(anime) {
    const lists = await this.getDefaultLists()
    return this.addToList(lists.dropped.id, anime, 'dropped')
  }
}

export default new ListService()
