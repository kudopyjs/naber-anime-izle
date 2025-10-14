// Google OAuth Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Initialize Google OAuth
export const initGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    // Check if Google script is already loaded
    if (typeof google !== 'undefined' && google.accounts) {
      console.log('Google Identity Services already loaded')
      resolve()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')))
      return
    }

    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log('Google Identity Services loaded successfully')
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

// Handle Google Sign In
export const handleGoogleSignIn = (callback) => {
  console.log('handleGoogleSignIn called')
  console.log('Client ID:', GOOGLE_CLIENT_ID)
  console.log('Google object:', typeof google !== 'undefined' ? 'loaded' : 'not loaded')

  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here.apps.googleusercontent.com') {
    console.error('Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file')
    alert('Google OAuth is not configured. Please add your Client ID to the .env file and restart the dev server.')
    return
  }

  if (typeof google === 'undefined' || !google.accounts) {
    console.error('Google Identity Services not loaded')
    alert('Google Sign-In is still loading. Please wait a moment and try again.')
    return
  }

  try {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        console.log('Google Sign-In response received')
        // Decode JWT token to get user info
        const userInfo = parseJwt(response.credential)
        if (userInfo) {
          callback(userInfo)
        } else {
          console.error('Failed to parse user info from token')
          alert('Failed to process Google Sign-In. Please try again.')
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true
    })

    google.accounts.id.prompt((notification) => {
      console.log('Prompt notification:', notification)
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('One Tap was not displayed, showing popup instead')
        // If One Tap doesn't show, we don't have a fallback button implementation
        // The user needs to click the button again or we need to implement a popup
      }
    })
  } catch (error) {
    console.error('Error initializing Google Sign-In:', error)
    alert('An error occurred with Google Sign-In. Please try again.')
  }
}

// Render Google Sign In Button
export const renderGoogleButton = (elementId, callback) => {
  if (!GOOGLE_CLIENT_ID) {
    console.error('Google Client ID is not configured')
    return
  }

  if (typeof google === 'undefined') {
    console.error('Google Identity Services not loaded')
    return
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      const userInfo = parseJwt(response.credential)
      callback(userInfo)
    }
  })

  google.accounts.id.renderButton(
    document.getElementById(elementId),
    {
      theme: 'filled_black',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 250
    }
  )
}

// Parse JWT token
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error parsing JWT:', error)
    return null
  }
}

// Sign out from Google
export const signOutGoogle = () => {
  if (typeof google !== 'undefined') {
    google.accounts.id.disableAutoSelect()
  }
}
