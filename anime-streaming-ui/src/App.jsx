import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Watch from './pages/Watch'
import Login from './pages/Login'
import Signup from './pages/Signup'
import UploadVideoNew from './pages/UploadVideoNew'
import AdminPanel from './pages/AdminPanel'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background-dark">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/watch/:id" 
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
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
