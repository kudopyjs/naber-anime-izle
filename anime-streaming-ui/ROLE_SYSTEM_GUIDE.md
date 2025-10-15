# 🔐 Role-Based Access Control (RBAC) System

## Overview

The anime streaming platform now has a **fully functional role-based access control system** with three user roles:

1. **User** - Basic access (watch anime)
2. **Fansub** - Can upload videos
3. **Admin** - Full server management

## User Roles

### 👤 User Role
**Permissions:**
- ✅ Watch anime
- ✅ Create account
- ✅ Login/Logout
- ✅ View profile
- ❌ Upload videos
- ❌ Access admin panel

**Access:**
- Home page
- Watch pages
- Profile settings

### 📤 Fansub Role
**Permissions:**
- ✅ All User permissions
- ✅ **Upload anime videos**
- ✅ Manage own uploads
- ❌ Access admin panel
- ❌ Manage other users

**Access:**
- All User pages
- **Upload Video page** (`/upload`)
- Upload menu in navbar

**Features:**
- Upload anime episodes
- Add thumbnails
- Set metadata (title, genre, season, episode)
- Track upload history

### ⚙️ Admin Role
**Permissions:**
- ✅ All Fansub permissions
- ✅ **Full server management**
- ✅ **Create/Delete categories**
- ✅ **Delete any anime**
- ✅ **Manage all users**
- ✅ Change user roles
- ✅ View statistics

**Access:**
- All pages
- **Admin Panel** (`/admin`)
- Upload Video page
- Admin menu in navbar

**Features:**
- Category management
- Anime moderation
- User management
- Server statistics
- Role assignment

## How It Works

### Role Hierarchy

```
Admin (Level 3)
  ↓
Fansub (Level 2)
  ↓
User (Level 1)
```

Higher roles inherit all permissions from lower roles.

### Permission Checks

The system uses these functions:

```javascript
// Check if user has specific role or higher
hasRole('fansub') // Returns true for fansub and admin

// Check if user can upload videos
canUploadVideo() // Returns true for fansub and admin

// Check if user can manage server
canManageServer() // Returns true only for admin
```

## Features by Role

### 1. Sign Up with Role Selection

**Location:** `/signup`

Users can choose their role during registration:
- **User** - Default, watch anime
- **Fansub** - Upload videos
- **Admin** - Full access

**How to test:**
1. Go to signup page
2. Fill in details
3. Select "Account Type" dropdown
4. Choose role
5. Create account

### 2. Upload Video (Fansub/Admin)

**Location:** `/upload`

**Features:**
- Upload anime title and description
- Select genre from dropdown
- Set season and episode numbers
- Upload thumbnail image
- Upload video file
- Track who uploaded what

**Access:**
- Navbar → User menu → "📤 Upload Video"
- Direct URL: `/upload`

**How to test:**
1. Create account with Fansub or Admin role
2. Login
3. Click avatar → "Upload Video"
4. Fill form and upload files
5. Submit

**Data Storage:**
```javascript
// Stored in localStorage as 'uploadedAnime'
{
  id: 1234567890,
  title: "Anime Title",
  description: "Description",
  genre: "Action",
  season: 1,
  episode: 1,
  uploadedBy: "username",
  uploaderId: "user_id",
  uploadedAt: "2025-10-14T...",
  thumbnailUrl: "blob:...",
  videoUrl: "blob:..."
}
```

### 3. Admin Panel (Admin Only)

**Location:** `/admin`

**Tabs:**

#### 📁 Categories Tab
- Create new categories
- Add emoji icons
- Delete categories
- View all categories

**Features:**
- Add category form
- Category grid display
- Delete with confirmation
- Persistent storage

#### 🎬 Manage Anime Tab
- View all uploaded anime
- See uploader info
- Delete any anime
- Filter by genre/season

**Features:**
- List all uploads
- Show metadata
- Delete with confirmation
- Track upload dates

#### 👥 Users Tab
- View all registered users
- Change user roles
- Delete users
- See join dates

**Features:**
- User table with sorting
- Role dropdown (instant update)
- Delete protection (can't delete self)
- Email and username display

#### 📊 Statistics Tab
- Total users count
- Total anime count
- Total categories count
- Visual cards with icons

**Access:**
- Navbar → User menu → "⚙️ Admin Panel"
- Direct URL: `/admin`

**How to test:**
1. Create account with Admin role
2. Login
3. Click avatar → "Admin Panel"
4. Explore all tabs

## Testing the System

### Test Scenario 1: User Role

```
1. Sign up as User
2. Login
3. Try to access /upload
   → Should show "Access Denied"
4. Try to access /admin
   → Should show "Access Denied"
5. Can watch anime ✓
```

### Test Scenario 2: Fansub Role

```
1. Sign up as Fansub
2. Login
3. Click avatar → See "Upload Video" option ✓
4. Go to /upload
   → Should see upload form ✓
5. Upload a video
   → Success message ✓
6. Try to access /admin
   → Should show "Access Denied"
```

### Test Scenario 3: Admin Role

```
1. Sign up as Admin
2. Login
3. Click avatar → See both "Upload Video" and "Admin Panel" ✓
4. Go to /upload
   → Can upload videos ✓
5. Go to /admin
   → Full access to all tabs ✓
6. Create category
   → Success ✓
7. Change user role
   → Updates immediately ✓
8. Delete anime
   → Removes from list ✓
```

### Test Scenario 4: Role Changes

```
1. Login as Admin
2. Go to Admin Panel → Users tab
3. Find a user
4. Change their role from User to Fansub
5. That user logs in
   → Now sees "Upload Video" option ✓
```

## Data Structure

### User Object (with role)

```javascript
{
  id: "1234567890",
  username: "testuser",
  email: "test@example.com",
  password: "password123", // In production: hashed!
  role: "fansub", // 'user', 'fansub', or 'admin'
  createdAt: "2025-10-14T19:00:00.000Z",
  picture: null,
  loginMethod: "email"
}
```

### Category Object

```javascript
{
  id: 1234567890,
  name: "Action",
  icon: "⚔️",
  createdAt: "2025-10-14T19:00:00.000Z"
}
```

### Uploaded Anime Object

```javascript
{
  id: 1234567890,
  title: "Cybernetic Echoes",
  description: "A futuristic anime...",
  genre: "Sci-Fi",
  season: 1,
  episode: 7,
  uploadedBy: "fansub_user",
  uploaderId: "user_id_123",
  uploadedAt: "2025-10-14T19:00:00.000Z",
  thumbnailUrl: "blob:http://...",
  videoUrl: "blob:http://..."
}
```

## localStorage Keys

```javascript
// All registered users
localStorage.getItem('users')

// Current logged-in user
localStorage.getItem('user')

// All uploaded anime
localStorage.getItem('uploadedAnime')

// All categories
localStorage.getItem('categories')
```

## UI Indicators

### Navbar User Menu

**User role:**
```
┌─────────────────────┐
│ username            │
│ email@example.com   │
│ USER                │ ← Role badge
├─────────────────────┤
│ My List             │
│ Settings            │
├─────────────────────┤
│ Logout              │
└─────────────────────┘
```

**Fansub role:**
```
┌─────────────────────┐
│ username            │
│ email@example.com   │
│ FANSUB              │ ← Role badge
├─────────────────────┤
│ My List             │
│ Settings            │
│ 📤 Upload Video     │ ← New option
├─────────────────────┤
│ Logout              │
└─────────────────────┘
```

**Admin role:**
```
┌─────────────────────┐
│ username            │
│ email@example.com   │
│ ADMIN               │ ← Role badge
├─────────────────────┤
│ My List             │
│ Settings            │
│ 📤 Upload Video     │ ← Upload option
│ ⚙️ Admin Panel      │ ← Admin option
├─────────────────────┤
│ Logout              │
└─────────────────────┘
```

## Security Notes

### ⚠️ Current Implementation (Development)

This is a **frontend-only** role system for development/demo:

- Roles stored in localStorage
- No server-side validation
- Anyone can change their role in localStorage
- Not suitable for production

### 🔒 Production Requirements

For production, you MUST:

1. **Backend Validation:**
   ```javascript
   // Server-side role check
   app.post('/api/upload', requireRole('fansub'), (req, res) => {
     // Upload logic
   })
   ```

2. **JWT Tokens:**
   ```javascript
   // Include role in JWT
   const token = jwt.sign({
     userId: user.id,
     role: user.role
   }, SECRET_KEY)
   ```

3. **Database:**
   - Store roles in database
   - Validate on every request
   - Audit role changes

4. **Permissions:**
   - Server-side permission checks
   - Role-based middleware
   - Action logging

## API Integration (Future)

### Upload Video Endpoint

```javascript
// POST /api/anime/upload
const formData = new FormData()
formData.append('title', title)
formData.append('description', description)
formData.append('genre', genre)
formData.append('season', season)
formData.append('episode', episode)
formData.append('thumbnail', thumbnailFile)
formData.append('video', videoFile)

const response = await fetch('/api/anime/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

### Admin Endpoints

```javascript
// GET /api/admin/users
// PUT /api/admin/users/:id/role
// DELETE /api/admin/users/:id
// POST /api/admin/categories
// DELETE /api/admin/categories/:id
// DELETE /api/admin/anime/:id
```

## Troubleshooting

### Issue: Can't see Upload Video option
**Solution:** Make sure you signed up with Fansub or Admin role

### Issue: Can't access Admin Panel
**Solution:** Only Admin role can access. Check your role in user menu

### Issue: Role not updating
**Solution:** Logout and login again to refresh session

### Issue: Upload button disabled
**Solution:** Fill all required fields (title, description, files)

### Issue: Can't delete own account as admin
**Solution:** This is intentional to prevent accidental lockout

## Next Steps

1. **Connect to Backend** - Replace localStorage with real API
2. **Add File Upload** - Integrate with cloud storage (AWS S3, Cloudinary)
3. **Add Permissions** - Fine-grained permission system
4. **Add Audit Log** - Track all admin actions
5. **Add Notifications** - Alert admins of new uploads
6. **Add Moderation** - Approve/reject uploads before publishing

## Summary

The role system is **fully functional** with:
- ✅ 3 user roles (User, Fansub, Admin)
- ✅ Role selection during signup
- ✅ Upload video page (Fansub/Admin)
- ✅ Admin panel with 4 tabs
- ✅ Category management
- ✅ Anime management
- ✅ User management
- ✅ Statistics dashboard
- ✅ Role-based UI elements
- ✅ Permission checks throughout

All features are working and ready for testing!
