# 🔐 Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the anime streaming platform.

## 📋 Prerequisites
- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## 🚀 Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: `Anime Streaming Platform` (or your preferred name)
5. Click "Create"

### 2. Enable Google Identity Services

1. In your project, go to **APIs & Services** > **Library**
2. Search for "Google Identity Services"
3. Click on it and press "Enable"

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - **App name**: Anime Streaming Platform
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click "Save and Continue"
6. Skip the "Scopes" section (click "Save and Continue")
7. Add test users if needed (optional for development)
8. Click "Save and Continue"

### 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Select **Application type**: Web application
4. **Name**: Anime Streaming Web Client
5. **Authorized JavaScript origins**:
   - Click "ADD URI"
   - Add: `http://localhost:5173` (for development)
   - **IMPORTANT**: Make sure to press Enter or click outside the field
   - You can also add: `https://yourdomain.com` (for production, when ready)
6. **Authorized redirect URIs**: (Leave empty for now, not needed for Google Identity Services)
7. Click "Create"
8. **Copy the Client ID** - you'll need this!

**⚠️ CRITICAL**: After adding the origin, you must:
- Click "SAVE" button at the bottom
- Wait 5-10 minutes for Google to propagate the changes
- During this time, you may see "origin not allowed" errors - this is normal

### 5. Configure Your Application

1. In your project root, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Google Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   ```

3. Save the file

### 6. Restart Development Server

```bash
npm run dev
```

## ✅ Testing

1. Navigate to `http://localhost:5173/login`
2. Click the "Google" button
3. You should see the Google Sign-In popup
4. Sign in with your Google account
5. After successful authentication, you'll be redirected to the home page

## 🔒 Security Notes

- **Never commit your `.env` file** to version control (it's already in `.gitignore`)
- The `.env.example` file is safe to commit (it contains no secrets)
- For production, add your production domain to "Authorized JavaScript origins"
- Keep your Client ID secure (though it's not as sensitive as a Client Secret)

## 🐛 Troubleshooting

### "Google OAuth is not configured" error
- Make sure you've created the `.env` file
- Verify the Client ID is correctly copied
- Restart the dev server after adding the `.env` file

### Google Sign-In popup doesn't appear
- Check browser console for errors
- Ensure your Client ID is valid
- Verify the domain is added to "Authorized JavaScript origins"

### "Access blocked" error
- Make sure you've configured the OAuth consent screen
- Add your email as a test user if the app is not published

## 📚 Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Overview](https://developers.google.com/identity/protocols/oauth2)

## 🔄 Next Steps

After setting up Google OAuth, you can:
1. Implement backend authentication to verify the JWT token
2. Store user sessions
3. Add Discord OAuth (similar process)
4. Implement user profile management
