# 🔧 Google OAuth Troubleshooting Guide

## Common Issues and Solutions

### 1. Google Button Does Nothing When Clicked

**Symptoms:**
- Button appears but nothing happens when clicked
- No popup or error message

**Solutions:**

#### A. Check if dev server was restarted after adding .env
```bash
# Stop the dev server (Ctrl+C)
# Then restart it
npm run dev
```
**Important:** Vite requires a restart to load new environment variables!

#### B. Verify Client ID is configured
1. Open `.env` file
2. Make sure it looks like this:
   ```env
   VITE_GOOGLE_CLIENT_ID=510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com
   ```
3. Make sure there are NO quotes around the value
4. Make sure there are NO spaces before or after the `=`

#### C. Check browser console for errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click the Google button
4. Look for error messages

**Common console errors:**

- **"Google Client ID is not configured"**
  - Solution: Add your Client ID to `.env` and restart dev server

- **"Google Identity Services not loaded"**
  - Solution: Wait a few seconds after page load, then try again
  - Or refresh the page

- **"idpiframe_initialization_failed"**
  - Solution: Check that `http://localhost:5173` is added to "Authorized JavaScript origins" in Google Cloud Console

### 2. "Access Blocked" Error from Google

**Symptoms:**
- Google popup shows "Access blocked: This app's request is invalid"

**Solutions:**

#### A. Verify OAuth Consent Screen is configured
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **OAuth consent screen**
3. Make sure all required fields are filled
4. Status should be "Testing" or "Published"

#### B. Check Authorized JavaScript Origins
1. Go to **APIs & Services** > **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized JavaScript origins", make sure you have:
   - `http://localhost:5173`
4. Click "Save"
5. Wait 5 minutes for changes to propagate

### 3. Environment Variable Not Loading

**Symptoms:**
- Console shows: "Client ID: undefined" or "Client ID: your_google_client_id_here.apps.googleusercontent.com"

**Solutions:**

#### A. Verify .env file location
- File must be in the project root: `anime-streaming-ui/.env`
- NOT in `src/` folder

#### B. Verify .env file format
```env
# ✅ CORRECT
VITE_GOOGLE_CLIENT_ID=510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com

# ❌ WRONG - Has quotes
VITE_GOOGLE_CLIENT_ID="510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com"

# ❌ WRONG - Has spaces
VITE_GOOGLE_CLIENT_ID = 510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com

# ❌ WRONG - Missing VITE_ prefix
GOOGLE_CLIENT_ID=510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com
```

#### C. Restart dev server
```bash
# Stop the server (Ctrl+C in terminal)
npm run dev
```

### 4. Testing the Setup

#### Quick Test Checklist:

1. **Open browser console** (F12)
2. **Navigate to** `http://localhost:5173/login`
3. **Look for these console messages:**
   ```
   Google OAuth initialized
   Google Identity Services loaded successfully
   ```
4. **Click the Google button**
5. **Look for:**
   ```
   handleGoogleSignIn called
   Client ID: 510141895643-...
   Google object: loaded
   ```

If you see all these messages, the setup is correct!

### 5. Network/Firewall Issues

**Symptoms:**
- Script fails to load
- Console shows network errors

**Solutions:**

#### A. Check internet connection
- Make sure you can access `https://accounts.google.com`

#### B. Disable browser extensions
- Ad blockers or privacy extensions might block Google scripts
- Try in Incognito/Private mode

#### C. Check corporate firewall
- Some networks block Google OAuth
- Try on a different network

### 6. "Popup Blocked" Issue

**Symptoms:**
- Browser blocks the Google popup

**Solutions:**

#### A. Allow popups for localhost
1. Click the popup blocked icon in address bar
2. Select "Always allow popups from http://localhost:5173"

#### B. Use One Tap instead
- The current implementation uses One Tap (overlay)
- This shouldn't trigger popup blockers

## Debug Mode

To enable detailed logging, open browser console and run:

```javascript
// Check if Google is loaded
console.log('Google loaded:', typeof google !== 'undefined')

// Check Client ID
console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID)

// Check if script is in DOM
console.log('Script in DOM:', document.querySelector('script[src*="gsi/client"]'))
```

## Still Not Working?

### Create a minimal test:

1. Create a new file: `src/pages/TestOAuth.jsx`
```jsx
import { useEffect } from 'react'

function TestOAuth() {
  useEffect(() => {
    console.log('=== OAuth Test ===')
    console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID)
    console.log('Google loaded:', typeof google !== 'undefined')
    
    if (typeof google !== 'undefined') {
      console.log('Google accounts:', google.accounts)
    }
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl mb-4">OAuth Test Page</h1>
      <p className="text-white">Check the console for debug info</p>
    </div>
  )
}

export default TestOAuth
```

2. Add route in `App.jsx`:
```jsx
import TestOAuth from './pages/TestOAuth'

// In routes:
<Route path="/test-oauth" element={<TestOAuth />} />
```

3. Visit `http://localhost:5173/test-oauth`
4. Check console output

## Contact Support

If none of these solutions work, please provide:
1. Browser console output (screenshot or copy/paste)
2. Network tab showing the Google script request
3. Your `.env` file (with Client ID redacted if sharing publicly)
4. Browser and OS version
