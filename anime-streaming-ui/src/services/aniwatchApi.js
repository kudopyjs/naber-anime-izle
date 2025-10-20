// Aniwatch API Service
// Documentation: https://github.com/ghoshRitesh12/aniwatch-api

// Use empty string for development (Vite proxy) or environment variable for production
const ANIWATCH_API_BASE = import.meta.env.VITE_ANIWATCH_API_URL || ''

class AniwatchApiService {
  /**
   * GET Anime Home Page
   * @returns {Promise} Home page data with trending, popular, latest animes
   */
  async getHomePage() {
    try {
      const response = await fetch(`${ANIWATCH_API_BASE}/api/v2/hianime/home`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching home page:', error)
      throw error
    }
  }

  /**
   * GET Anime About Info
   * @param {string} animeId - Anime ID from hianime (e.g., "attack-on-titan-112")
   * @returns {Promise} Detailed anime information
   */
  async getAnimeInfo(animeId) {
    try {
      const response = await fetch(`${ANIWATCH_API_BASE}/api/v2/hianime/anime/${animeId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching anime info:', error)
      throw error
    }
  }

  /**
   * GET Search Results
   * @param {string} query - Search query
   * @param {number} page - Page number (default: 1)
   * @param {Object} filters - Optional filters (genres, type, status, etc.)
   * @returns {Promise} Search results
   */
  async searchAnime(query, page = 1, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        ...filters
      })
      
      const response = await fetch(`${ANIWATCH_API_BASE}/api/v2/hianime/search?${params}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error searching anime:', error)
      throw error
    }
  }

  /**
   * GET Search Suggestions
   * @param {string} query - Search query
   * @returns {Promise} Search suggestions
   */
  async getSearchSuggestions(query) {
    try {
      const response = await fetch(`${ANIWATCH_API_BASE}/api/v2/hianime/search/suggestion?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching search suggestions:', error)
      throw error
    }
  }

  /**
   * GET Anime Episodes
   * @param {string} animeId - Anime ID
   * @returns {Promise} List of episodes
   */
  async getAnimeEpisodes(animeId) {
    try {
      const response = await fetch(`${ANIWATCH_API_BASE}/api/v2/hianime/anime/${animeId}/episodes`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching episodes:', error)
      throw error
    }
  }

  /**
   * GET Anime Episode Servers
   * @param {string} animeEpisodeId - Episode ID (e.g., "steinsgate-0-92?ep=2055")
   * @returns {Promise} Available servers for the episode
   */
  async getEpisodeServers(animeEpisodeId) {
    try {
      const response = await fetch(`${ANIWATCH_API_BASE}/api/v2/hianime/episode/servers?animeEpisodeId=${encodeURIComponent(animeEpisodeId)}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching episode servers:', error)
      throw error
    }
  }

  /**
   * GET Anime Episode Streaming Links
   * @param {string} animeEpisodeId - Episode ID
   * @param {string} server - Server name (default: "hd-1")
   * @param {string} category - Category: "sub", "dub", or "raw" (default: "sub")
   * @returns {Promise} Streaming sources and subtitles
   */
  async getEpisodeStreamingLinks(animeEpisodeId, server = 'hd-1', category = 'sub') {
    try {
      const response = await fetch(
        `${ANIWATCH_API_BASE}/api/v2/hianime/episode/sources?animeEpisodeId=${encodeURIComponent(animeEpisodeId)}&server=${server}&category=${category}`
      )
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching streaming links:', error)
      throw error
    }
  }

  /**
   * GET Episode Streaming Links
   * @param {string} episodeId - Episode ID (e.g., "steinsgate-0-episode-1")
   * @param {string} server - Server name (e.g., "hd-1", "hd-2")
   * @param {string} category - Category (sub or dub)
   * @returns {Promise} Streaming links and sources
   */
  async getEpisodeStreamingLinks(episodeId, server = 'hd-1', category = 'sub') {
    try {
      const response = await fetch(
        `${ANIWATCH_API_BASE}/api/v2/hianime/episode/sources?animeEpisodeId=${episodeId}&server=${server}&category=${category}`
      )
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching streaming links:', error)
      throw error
    }
  }

  /**
   * GET GogoAnime Embed Link
   * @param {string} episodeId - Episode ID from HiAnime
   * @returns {Promise} GogoAnime embed URL
   */
  async getGogoAnimeEmbed(episodeId) {
    try {
      // Extract anime name and episode number from episodeId
      // Format: "anime-name-123?ep=456" -> "anime-name-episode-456"
      const parts = episodeId.split('?ep=')
      const animeSlug = parts[0]
      const episodeNumber = parts[1] || '1'
      
      // GogoAnime embed format: anime-name-episode-X
      const gogoEpisodeId = `${animeSlug}-episode-${episodeNumber}`
      
      // GogoAnime embed URL
      const embedUrl = `https://gogoanime.lu/embed/${gogoEpisodeId}`
      
      return {
        success: true,
        embedUrl: embedUrl,
        gogoEpisodeId: gogoEpisodeId
      }
    } catch (error) {
      console.error('Error generating GogoAnime embed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * GET Genre Animes
   * @param {string} genre - Genre name (e.g., "action", "shounen")
   * @param {number} page - Page number (default: 1)
   * @returns {Promise} Animes by genre
   */
  async getAnimesByGenre(genre, page = 1) {
    try {
      const response = await fetch(`${ANIWATCH_API_BASE}/api/v2/hianime/genre/${genre}?page=${page}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching animes by genre:', error)
      throw error
    }
  }

  /**
   * GET Category Animes
   * @param {string} category - Category name (e.g., "most-popular", "top-airing")
   * @param {number} page - Page number (default: 1)
   * @returns {Promise} Animes by category
   */
  async getAnimesByCategory(category, page = 1) {
    try {
      const response = await fetch(`${ANIWATCH_API_BASE}/api/v2/hianime/category/${category}?page=${page}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching animes by category:', error)
      throw error
    }
  }

  /**
   * GET Estimated Schedules
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} Scheduled animes
   */
  async getSchedule(date) {
    try {
      const response = await fetch(`${ANIWATCH_API_BASE}/api/v2/hianime/schedule?date=${date}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching schedule:', error)
      throw error
    }
  }

  /**
   * GET Episode Sources (Alias for getEpisodeStreamingLinks)
   * @param {string} episodeId - Episode ID
   * @param {string} server - Server name (default: "hd-1")
   * @param {string} category - Category (default: "sub")
   * @returns {Promise} Video sources
   */
  async getEpisodeSources(episodeId, server = 'hd-1', category = 'sub') {
    return this.getEpisodeStreamingLinks(episodeId, server, category)
  }

  /**
   * GET Episode Embed URL
   * Gets the embed URL directly from servers endpoint
   * @param {string} episodeId - Episode ID (e.g., "one-piece-100?ep=2142")
   * @returns {Promise<string>} Embed URL or null
   */
  async getEpisodeEmbedUrl(episodeId) {
    try {
      // First get servers
      const serversData = await this.getEpisodeServers(episodeId)
      
      if (!serversData || serversData.status !== 200) {
        return null
      }

      // Parse HTML to find server data-id
      const html = serversData.data?.html || ''
      
      // Look for megacloud or vidstreaming server
      const serverMatch = html.match(/data-id="(\d+)"[^>]*class="[^"]*(?:megacloud|vidstreaming)[^"]*"/i)
      
      if (!serverMatch) {
        // Fallback: get first server
        const firstServer = html.match(/data-id="(\d+)"/)
        if (!firstServer) return null
        
        const serverId = firstServer[1]
        
        // Get embed URL from sources endpoint
        const response = await fetch(
          `${ANIWATCH_API_BASE}/api/v2/hianime/episode/sources?animeEpisodeId=${encodeURIComponent(episodeId)}&server=hd-1&category=sub`
        )
        const data = await response.json()
        
        // Return embed URL if available
        return data.data?.sources?.[0]?.url || null
      }
      
      const serverId = serverMatch[1]
      
      // Get sources with this server ID
      const response = await fetch(
        `${ANIWATCH_API_BASE}/api/v2/hianime/episode/sources?animeEpisodeId=${encodeURIComponent(episodeId)}&serverId=${serverId}`
      )
      const data = await response.json()
      
      return data.data?.sources?.[0]?.url || null
      
    } catch (error) {
      console.error('Error getting embed URL:', error)
      return null
    }
  }
}

export default new AniwatchApiService()
