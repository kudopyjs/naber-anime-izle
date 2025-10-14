# 🎌 Anime Streaming Platform – Frontend Roadmap (WIP)

## 🧭 Overview
Goal: Build a modern, futuristic anime streaming website with smooth UI, category-based browsing, and custom video player experience.  
Design style: **Dark + Neon + Cinematic**, inspired by **Netflix / Crunchyroll** aesthetics.  
Tech stack: **HTML + TailwindCSS + Framer Motion (or React)**.

---

## 🏁 Phase 1 – Project Setup ✅
- [x] Create a new project folder: `/anime-streaming-ui`
- [x] Initialize with Vite or React (optional)
- [x] Setup TailwindCSS
- [x] Install Framer Motion (for animations)
- [x] Setup folder structure:
  - /src
  - /assets
  - /components
  - /pages
  - /styles

---

## 🎨 Phase 2 – Global Design System ✅
- [x] Configure dark theme colors (background #0d0d0f, accent cyan/magenta)
- [x] Define typography (Poppins / Inter)
- [x] Create reusable components:
- [x] `Navbar`
- [x] `Footer`
- [x] `Card` (for anime thumbnails)
- [x] `CategoryRow` (carousel layout)
- [x] Add hover and neon glow transitions using Tailwind + Framer Motion
- [x] Ensure responsive layout (desktop, tablet, mobile)

---

## 🏠 Phase 3 – Home Page (index) ✅
Prompt reference: *"Modern anime streaming website homepage"*
- [x] Create hero banner section
- [x] Background artwork or video
- [x] Title + "Watch Now" button
- [x] Autoplay fade transitions between featured anime
- [x] Add category carousels:
- [x] Popular Now
- [x] Action
- [x] Horror
- [x] Romance
- [x] Comedy
- [x] Implement horizontal scroll or arrows for each carousel
- [x] Include a search bar in navbar
- [x] Add lazy loading for thumbnails
- [x] Add smooth scroll transitions between sections

---

## 🎬 Phase 4 – Watch Page (Video Player) ✅
Prompt reference: *"Futuristic anime watch page UI"*
- [x] Create `/watch` page
- [x] Add full-width video player (Video.js or custom HTML5 player)
- [x] Add glowing border and smooth hover animations
- [x] Display anime info:
- [x] Title, Rating, Episode, Description
- [x] Add "Next Episode" + "Recommended" sidebar
- [x] Include "Like", "Add to List", "Share" buttons
- [x] Add mini-player on scroll (floating)
- [x] Implement "Skip Intro" and "Autoplay Next" UI (non-functional placeholder)
- [x] Responsive design (player resizes smoothly)

---

## 👤 Phase 5 – Auth Pages (Login / Sign Up) ✅
Prompt reference: *"Modern login and signup page for anime platform"*
- [x] Create `/login` and `/signup` pages
- [x] Glassmorphism-style auth card centered on dark neon background
- [x] Logo and tagline at top
- [x] Fields:
- [x] Username
- [x] Email
- [x] Password (+ confirm for sign up)
- [x] Add "Switch to Login / Sign Up" link with smooth transition
- [x] Add social login buttons (Google / Discord placeholder)
- [x] Add form validation feedback (visual only)
- [x] Include glowing "Submit" button
- [x] Responsive + keyboard-friendly design

---

## 🧱 Phase 6 – Global Components Integration ✅
- [x] Make navbar consistent across all pages
- [x] Add footer with year and links
- [x] Add route navigation (React Router or static links)
- [x] Maintain consistent background and glow effects

---

## ⚡ Phase 7 – Animations & Microinteractions ✅
- [x] Add subtle particle or glow animations behind hero and auth screens
- [x] Add smooth fade-in transitions on page load
- [x] Animate hover states for cards and buttons
- [x] Add carousel slide animations (Framer Motion or Swiper.js)
- [x] Ensure 60fps performance on scroll and transitions

---

## 🧩 Phase 8 – Optional Enhancements
- [ ] Add “Continue Watching” row below hero section
- [ ] Add search suggestions dropdown
- [ ] Add watch progress indicators
- [ ] Add genre filter menu
- [ ] Add parallax or blur effect in hero banner
- [ ] Prepare placeholders for future API integration

---

## 🚀 Phase 9 – Optimization & Deployment
- [ ] Test responsiveness (mobile, tablet, desktop)
- [ ] Test all animations and hover effects
- [ ] Optimize images and assets
- [ ] Configure Vite build or React build
- [ ] Deploy to Vercel / Netlify
- [ ] Verify Lighthouse performance and accessibility

---

## ✅ Final Goal
A responsive, visually stunning anime streaming frontend with:
- Modern dark-neon theme  
- Category-based browsing  
- Immersive video experience  
- Clean authentication flow  
Ready for backend and video integration in the next phase.