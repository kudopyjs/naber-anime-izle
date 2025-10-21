import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_DOWNLOAD_API_URL || 'http://localhost:5001'

const MaintenanceContext = createContext(null)

export const useMaintenanceMode = () => {
  const context = useContext(MaintenanceContext)
  if (!context) {
    throw new Error('useMaintenanceMode must be used within MaintenanceProvider')
  }
  return context
}

export const MaintenanceProvider = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load maintenance mode from backend
  useEffect(() => {
    loadMaintenanceMode()
  }, [])

  const loadMaintenanceMode = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/settings/maintenanceMode`)
      const data = await response.json()
      const isEnabled = data.value === 'true'
      console.log('🔧 Loaded maintenance mode from backend:', isEnabled)
      setIsMaintenanceMode(isEnabled)
    } catch (error) {
      console.error('Error loading maintenance mode:', error)
      setIsMaintenanceMode(false)
    } finally {
      setLoading(false)
    }
  }

  const enableMaintenanceMode = async () => {
    console.log('🔒 Enabling maintenance mode')
    try {
      const response = await fetch(`${API_BASE}/api/users/settings/maintenanceMode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 'true' })
      })
      const data = await response.json()
      if (data.success) {
        setIsMaintenanceMode(true)
        console.log('✓ Maintenance mode enabled in backend')
      }
    } catch (error) {
      console.error('Error enabling maintenance mode:', error)
    }
  }

  const disableMaintenanceMode = async () => {
    console.log('✅ Disabling maintenance mode')
    try {
      const response = await fetch(`${API_BASE}/api/users/settings/maintenanceMode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 'false' })
      })
      const data = await response.json()
      if (data.success) {
        setIsMaintenanceMode(false)
        console.log('✓ Maintenance mode disabled in backend')
      }
    } catch (error) {
      console.error('Error disabling maintenance mode:', error)
    }
  }

  const toggleMaintenanceMode = async () => {
    console.log('🔄 Toggling maintenance mode. Current:', isMaintenanceMode)
    if (isMaintenanceMode) {
      await disableMaintenanceMode()
    } else {
      await enableMaintenanceMode()
    }
  }

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenanceMode,
        enableMaintenanceMode,
        disableMaintenanceMode,
        toggleMaintenanceMode
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  )
}
