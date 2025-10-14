# 🔐 Authentication System Guide

## Overview

The anime streaming platform now has a **fully functional authentication system** with:
- ✅ Email/Password signup and login
- ✅ Google OAuth integration
- ✅ Session persistence (localStorage)
- ✅ Protected routes
- ✅ User profile display
- ✅ Logout functionality

## How It Works

### 1. **Signup Flow**

#### Email/Password Signup:
1. User goes to `/signup`
2. Fills in username, email, password, and confirms password
3. Form validates:
   - Passwords match
   - Password is at least 6 characters
   - Email is not already registered
4. User data is stored in `localStorage` under `users` key
5. User is automatically logged in
6. Redirected to home page

#### Google Signup:
1. User clicks "Google" button
2. Google OAuth popup appears
3. User signs in with Google account
4. User info (email, name, picture) is extracted from JWT token
5. User is logged in
6. Redirected to home page

### 2. **Login Flow**

#### Email/Password Login:
1. User goes to `/login`
2. Enters email and password
3. System checks against stored users in `localStorage`
4. If match found, user is logged in
5. Redirected to home page
6. If no match, error message displayed

#### Google Login:
1. User clicks "Google" button
2. Google OAuth popup appears
3. User signs in with Google account
4. User is logged in
5. Redirected to home page

### 3. **Session Management**

- User session is stored in `localStorage` under `user` key
- Session persists across page refreshes
- Session includes:
  ```json
  {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "picture": "https://...", // Only for Google users
    "loginMethod": "email" // or "google"
  }
  ```

### 4. **Protected Routes**

- `/watch/:id` route is protected
- Unauthenticated users are redirected to `/login`
- After login, users can access watch pages

### 5. **Logout**

- Click on user avatar in navbar
- Select "Logout" from dropdown
- Session is cleared from `localStorage`
- User is logged out

## Features

### ✅ Implemented

1. **User Registration**
   - Email/password signup
   - Google OAuth signup
   - Email uniqueness validation
   - Password strength validation

2. **User Login**
   - Email/password login
   - Google OAuth login
   - Error handling for invalid credentials

3. **Session Persistence**
   - Auto-login on page refresh
   - Secure session storage

4. **User Interface**
   - User avatar in navbar
   - Username display
   - Dropdown menu with options
   - Logout button

5. **Protected Routes**
   - Watch page requires authentication
   - Automatic redirect to login

6. **Error Handling**
   - Invalid credentials
   - Duplicate email
   - Weak passwords
   - Network errors

## Testing the System

### Test Scenario 1: Email Signup & Login

1. **Sign Up:**
   ```
   Go to: http://localhost:5173/signup
   Username: testuser
   Email: test@example.com
   Password: password123
   Confirm Password: password123
   Click: SIGN UP
   ```

2. **Verify:**
   - You should be redirected to home page
   - Your username appears in navbar
   - Click avatar to see dropdown menu

3. **Logout:**
   - Click on avatar
   - Click "Logout"
   - You should be logged out

4. **Login Again:**
   ```
   Go to: http://localhost:5173/login
   Email: test@example.com
   Password: password123
   Click: LOGIN
   ```

5. **Verify:**
   - You should be logged in
   - Session persists on page refresh

### Test Scenario 2: Google OAuth

1. **Prerequisites:**
   - Add `http://localhost:5173` to Google Cloud Console
   - Wait 5-10 minutes for propagation

2. **Sign Up with Google:**
   ```
   Go to: http://localhost:5173/signup
   Click: Google button
   Sign in with your Google account
   ```

3. **Verify:**
   - You should be logged in
   - Your Google profile picture appears in navbar
   - Your Google name is displayed

### Test Scenario 3: Protected Routes

1. **Logout** (if logged in)

2. **Try to access watch page:**
   ```
   Go to: http://localhost:5173/watch/1
   ```

3. **Verify:**
   - You should be redirected to `/login`

4. **Login and try again:**
   - Login with any method
   - Go to: `http://localhost:5173/watch/1`
   - You should now see the watch page

## Data Storage

### localStorage Structure

```javascript
// Users database (all registered users)
localStorage.getItem('users')
// Returns: [
//   {
//     "id": "1234567890",
//     "username": "testuser",
//     "email": "test@example.com",
//     "password": "password123", // In production, this should be hashed!
//     "createdAt": "2025-10-14T19:45:00.000Z"
//   }
// ]

// Current user session
localStorage.getItem('user')
// Returns: {
//   "id": "1234567890",
//   "email": "test@example.com",
//   "username": "testuser",
//   "picture": null,
//   "loginMethod": "email"
// }
```

### Viewing Stored Data

Open browser console (F12) and run:

```javascript
// View all users
console.log(JSON.parse(localStorage.getItem('users')))

// View current user
console.log(JSON.parse(localStorage.getItem('user')))

// Clear all data (reset)
localStorage.clear()
```

## Security Notes

### ⚠️ Current Implementation (Development Only)

This is a **frontend-only** authentication system for development/demo purposes:

- Passwords are stored in **plain text** in localStorage
- No server-side validation
- No password hashing
- No secure token generation
- Anyone with browser access can view/modify data

### 🔒 Production Requirements

For a production application, you MUST:

1. **Backend API:**
   - Implement server-side authentication
   - Use bcrypt or similar for password hashing
   - Generate secure JWT tokens
   - Validate all inputs server-side

2. **Secure Storage:**
   - Store tokens in httpOnly cookies (not localStorage)
   - Implement CSRF protection
   - Use HTTPS only

3. **Password Security:**
   - Enforce strong password requirements
   - Implement rate limiting
   - Add password reset functionality
   - Use 2FA for sensitive operations

4. **OAuth Security:**
   - Verify JWT tokens server-side
   - Store OAuth tokens securely
   - Implement token refresh logic

## API Integration (Future)

To connect to a real backend:

### 1. Update AuthContext.jsx

```javascript
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (!response.ok) {
    throw new Error('Invalid credentials')
  }
  
  const data = await response.json()
  setUser(data.user)
  return data.user
}
```

### 2. Update Google OAuth

```javascript
const loginWithGoogle = async (googleUserInfo) => {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: googleUserInfo.sub,
      email: googleUserInfo.email,
      name: googleUserInfo.name,
      picture: googleUserInfo.picture
    })
  })
  
  const data = await response.json()
  setUser(data.user)
  return data.user
}
```

## Troubleshooting

### Issue: "Invalid email or password"
- **Solution:** Make sure you signed up first, or check your credentials

### Issue: "Email already registered"
- **Solution:** Use a different email or login instead

### Issue: User not persisting after refresh
- **Solution:** Check browser console for errors, ensure localStorage is enabled

### Issue: Can't access watch page
- **Solution:** Make sure you're logged in first

### Issue: Google OAuth not working
- **Solution:** See `FIX_ORIGIN_ERROR.md` for detailed troubleshooting

## Next Steps

1. **Implement Backend API** - Replace localStorage with real database
2. **Add Password Reset** - Email-based password recovery
3. **Add Profile Page** - Let users edit their profile
4. **Add Watch History** - Track what users have watched
5. **Add Favorites** - Let users save favorite anime
6. **Add Social Features** - Comments, ratings, reviews
