import { createContext, useContext, useState, useEffect } from 'react'

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
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Get stored users from localStorage
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]')
        
        // Find user with matching email and password
        const foundUser = storedUsers.find(
          u => u.email === email && u.password === password
        )

        if (foundUser) {
          const userData = {
            id: foundUser.id,
            email: foundUser.email,
            username: foundUser.username,
            picture: foundUser.picture || null,
            role: foundUser.role || 'user',
            loginMethod: 'email'
          }
          setUser(userData)
          resolve(userData)
        } else {
          reject(new Error('Invalid email or password'))
        }
      }, 500) // Simulate network delay
    })
  }

  const signup = async (username, email, password, role = 'user') => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Get stored users from localStorage
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]')
        
        // Check if email already exists
        const existingUser = storedUsers.find(u => u.email === email)
        if (existingUser) {
          reject(new Error('Email already registered'))
          return
        }

        // Create new user with role
        const newUser = {
          id: Date.now().toString(),
          username,
          email,
          password, // In production, this should be hashed on the backend!
          role: role, // 'user', 'fansub', or 'admin'
          createdAt: new Date().toISOString()
        }

        // Save to localStorage
        storedUsers.push(newUser)
        localStorage.setItem('users', JSON.stringify(storedUsers))

        // Set as current user
        const userData = {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          picture: null,
          role: newUser.role,
          loginMethod: 'email'
        }
        setUser(userData)
        resolve(userData)
      }, 500) // Simulate network delay
    })
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
