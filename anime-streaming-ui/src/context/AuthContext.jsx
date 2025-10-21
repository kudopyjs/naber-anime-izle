import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_DOWNLOAD_API_URL || 'http://localhost:5001'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.success && data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'user',
          createdAt: data.user.createdAt,
          loginMethod: 'email'
        }
        setUser(userData)
        return userData
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      throw error
    }
  }

  const signup = async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      if (data.success && data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'user',
          createdAt: data.user.createdAt,
          loginMethod: 'email'
        }
        setUser(userData)
        return userData
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      throw error
    }
  }

  const loginWithGoogle = (googleUserInfo) => {
    // Google user info contains: email, name, picture, sub (Google ID)
    const userData = {
      id: googleUserInfo.sub,
      email: googleUserInfo.email,
      username: googleUserInfo.name,
      picture: googleUserInfo.picture,
      role: 'user', // Default role for Google OAuth users
      loginMethod: 'google'
    }
    setUser(userData)
    return userData
  }

  const hasRole = (requiredRole) => {
    if (!user) return false
    
    const roleHierarchy = {
      'user': 1,
      'fansub': 2,
      'admin': 3
    }
    
    const userRoleLevel = roleHierarchy[user.role] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0
    
    return userRoleLevel >= requiredRoleLevel
  }

  const canUploadVideo = () => {
    return hasRole('fansub') // fansub and admin can upload
  }

  const canManageServer = () => {
    return user?.role === 'admin' // only admin
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const value = {
    user,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
    hasRole,
    canUploadVideo,
    canManageServer
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
