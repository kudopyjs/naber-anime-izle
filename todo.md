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

## 🎨 Phase 2 – Global Design System
- [ ] Configure dark theme colors (background #0d0d0f, accent cyan/magenta)
- [ ] Define typography (Poppins / Inter)
- [ ] Create reusable components:
- [ ] `Navbar`
- [ ] `Footer`
- [ ] `Card` (for anime thumbnails)
- [ ] `CategoryRow` (carousel layout)
- [ ] Add hover and neon glow transitions using Tailwind + Framer Motion
- [ ] Ensure responsive layout (desktop, tablet, mobile)

---

## 🏠 Phase 3 – Home Page (index)
Prompt reference: *“Modern anime streaming website homepage”*
- [ ] Create hero banner section
- [ ] Background artwork or video
- [ ] Title + “Watch Now” button
- [ ] Autoplay fade transitions between featured anime
- [ ] Add category carousels:
- [ ] Popular Now
- [ ] Action
- [ ] Horror
- [ ] Romance
- [ ] Comedy
- [ ] Implement horizontal scroll or arrows for each carousel
- [ ] Include a search bar in navbar
- [ ] Add lazy loading for thumbnails
- [ ] Add smooth scroll transitions between sections

---

## 🎬 Phase 4 – Watch Page (Video Player)
Prompt reference: *“Futuristic anime watch page UI”*
- [ ] Create `/watch` page
- [ ] Add full-width video player (Video.js or custom HTML5 player)
- [ ] Add glowing border and smooth hover animations
- [ ] Display anime info:
- [ ] Title, Rating, Episode, Description
- [ ] Add “Next Episode” + “Recommended” sidebar
- [ ] Include “Like”, “Add to List”, “Share” buttons
- [ ] Add mini-player on scroll (floating)
- [ ] Implement “Skip Intro” and “Autoplay Next” UI (non-functional placeholder)
- [ ] Responsive design (player resizes smoothly)

---

## 👤 Phase 5 – Auth Pages (Login / Sign Up)
Prompt reference: *“Modern login and signup page for anime platform”*
- [ ] Create `/login` and `/signup` pages
- [ ] Glassmorphism-style auth card centered on dark neon background
- [ ] Logo and tagline at top
- [ ] Fields:
- [ ] Username
- [ ] Email
- [ ] Password (+ confirm for sign up)
- [ ] Add “Switch to Login / Sign Up” link with smooth transition
- [ ] Add social login buttons (Google / Discord placeholder)
- [ ] Add form validation feedback (visual only)
- [ ] Include glowing “Submit” button
- [ ] Responsive + keyboard-friendly design

---

## 🧱 Phase 6 – Global Components Integration
- [ ] Make navbar consistent across all pages
- [ ] Add footer with © year and links
- [ ] Add route navigation (React Router or static links)
- [ ] Maintain consistent background and glow effects

---

## ⚡ Phase 7 – Animations & Microinteractions
- [ ] Add subtle particle or glow animations behind hero and auth screens
- [ ] Add smooth fade-in transitions on page load
- [ ] Animate hover states for cards and buttons
- [ ] Add carousel slide animations (Framer Motion or Swiper.js)
- [ ] Ensure 60fps performance on scroll and transitions

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