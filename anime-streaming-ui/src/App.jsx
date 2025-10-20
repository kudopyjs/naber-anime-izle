import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Watch from './pages/Watch'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Search from './pages/Search'
import UploadVideoNew from './pages/UploadVideoNew'
import AdminPanel from './pages/AdminPanel'
import AddAnime from './pages/AddAnime'
import EditAnime from './pages/EditAnime'
import AnimeDetail from './pages/AnimeDetail'
import BunnySync from './pages/BunnySync'
import UserProfile from './pages/UserProfile'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background-dark">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route 
              path="/watch/:animeSlug/:episodeId" 
              element={
                <ProtectedRoute>
                  <Watch />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <UploadVideoNew />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-anime" 
              element={
                <ProtectedRoute>
                  <AddAnime />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit-anime/:animeSlug" 
              element={
                <ProtectedRoute>
                  <EditAnime />
                </ProtectedRoute>
              } 
            />
            <Route path="/anime/:animeSlug" element={<AnimeDetail />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route 
              path="/bunny-sync" 
              element={
                <ProtectedRoute>
                  <BunnySync />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
