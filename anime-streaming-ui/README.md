# 🎌 Anime Streaming Platform

A modern, futuristic anime streaming website with smooth UI, category-based browsing, and custom video player experience.

## 🎨 Design Style
- **Dark + Neon + Cinematic** aesthetic
- Inspired by Netflix / Crunchyroll
- Cyan (#06f9f9) and Magenta (#FF00FF) accent colors

## 🛠️ Tech Stack
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation

## 📁 Project Structure
```
anime-streaming-ui/
├── src/
│   ├── assets/          # Images, icons, etc.
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── tailwind.config.js   # Tailwind configuration
```

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Configuration
1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Add your Google OAuth Client ID to `.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
   ```

   See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed setup instructions.

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📋 Development Phases
- [x] Phase 1: Project Setup
- [ ] Phase 2: Global Design System
- [ ] Phase 3: Home Page
- [ ] Phase 4: Watch Page
- [ ] Phase 5: Auth Pages
- [ ] Phase 6: Global Components Integration
- [ ] Phase 7: Animations & Microinteractions
- [ ] Phase 8: Optional Enhancements

## 🎯 Features
- ✅ Modern dark-neon theme
- ✅ Category-based browsing with carousels
- ✅ Immersive video player experience
- ✅ Google OAuth authentication
- ✅ Clean authentication flow (Login/Signup)
- ✅ Smooth animations and transitions (Framer Motion)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Glassmorphic UI elements
- ✅ Neon glow effects

## 📝 License
Private project
