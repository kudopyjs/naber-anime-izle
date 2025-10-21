import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { MaintenanceProvider, useMaintenanceMode } from './context/MaintenanceContext'
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
import Maintenance from './pages/Maintenance'

// Maintenance Guard Component
function MaintenanceGuard({ children }) {
  const { isMaintenanceMode } = useMaintenanceMode()
  const { user } = useAuth()
  
  // Allow admins to bypass maintenance mode
  const isAdmin = user?.role === 'admin'
  
  // Debug logs
  console.log('🔧 Maintenance Guard:', {
    isMaintenanceMode,
    user: user?.email || 'not logged in',
    role: user?.role || 'none',
    isAdmin,
    willRedirect: isMaintenanceMode && !isAdmin
  })
  
  if (isMaintenanceMode && !isAdmin) {
    console.log('🚫 Redirecting to maintenance page')
    return <Navigate to="/maintenance" replace />
  }
  
  return children
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <MaintenanceProvider>
          <div className="min-h-screen bg-background-dark">
            <Routes>
              {/* Maintenance page - always accessible */}
              <Route path="/maintenance" element={<Maintenance />} />
              
              {/* Protected routes with maintenance check */}
              <Route path="/" element={
                <MaintenanceGuard><Home /></MaintenanceGuard>
              } />
              
              <Route path="/search" element={
                <MaintenanceGuard><Search /></MaintenanceGuard>
              } />
              
              <Route path="/watch/:animeSlug" element={
                <MaintenanceGuard>
                  <ProtectedRoute><Watch /></ProtectedRoute>
                </MaintenanceGuard>
              } />
              
              <Route path="/login" element={
                <MaintenanceGuard><Login /></MaintenanceGuard>
              } />
              
              <Route path="/signup" element={
                <MaintenanceGuard><Signup /></MaintenanceGuard>
              } />
              
              <Route path="/upload" element={
                <MaintenanceGuard>
                  <ProtectedRoute><UploadVideoNew /></ProtectedRoute>
                </MaintenanceGuard>
              } />
              
              {/* Admin routes - bypass maintenance */}
              <Route path="/admin" element={
                <ProtectedRoute><AdminPanel /></ProtectedRoute>
              } />
              
              <Route path="/add-anime" element={
                <MaintenanceGuard>
                  <ProtectedRoute><AddAnime /></ProtectedRoute>
                </MaintenanceGuard>
              } />
              
              <Route path="/edit-anime/:animeSlug" element={
                <MaintenanceGuard>
                  <ProtectedRoute><EditAnime /></ProtectedRoute>
                </MaintenanceGuard>
              } />
              
              <Route path="/anime/:animeSlug" element={
                <MaintenanceGuard><AnimeDetail /></MaintenanceGuard>
              } />
              
              <Route path="/user/:userId" element={
                <MaintenanceGuard><UserProfile /></MaintenanceGuard>
              } />
              
              <Route path="/bunny-sync" element={
                <MaintenanceGuard>
                  <ProtectedRoute><BunnySync /></ProtectedRoute>
                </MaintenanceGuard>
              } />
            </Routes>
          </div>
        </MaintenanceProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
