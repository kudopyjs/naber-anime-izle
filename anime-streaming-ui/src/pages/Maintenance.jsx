import { motion } from 'framer-motion'
import { Link, Navigate } from 'react-router-dom'
import { useMaintenanceMode } from '../context/MaintenanceContext'
import { useAuth } from '../context/AuthContext'

function Maintenance() {
  const { isMaintenanceMode } = useMaintenanceMode()
  const { user } = useAuth()
  
  // If maintenance mode is off, redirect to home
  // Unless user is admin (they might be testing)
  const isAdmin = user?.role === 'admin'
  
  if (!isMaintenanceMode && !isAdmin) {
    console.log('🟢 Maintenance mode is off, redirecting to home')
    return <Navigate to="/" replace />
  }
  
  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight"
        >
          Bakım Modu
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-white/70 mb-8 leading-relaxed"
        >
          Sitemiz şu anda bakım çalışması yapıyor. Daha iyi bir deneyim için sistemimizi güncelliyoruz.
        </motion.p>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="text-primary text-3xl mb-2">⚡</div>
            <h3 className="text-white font-semibold mb-1">Performans</h3>
            <p className="text-white/60 text-sm">Daha hızlı yükleme</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="text-primary text-3xl mb-2">🎨</div>
            <h3 className="text-white font-semibold mb-1">Tasarım</h3>
            <p className="text-white/60 text-sm">Yeni özellikler</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="text-primary text-3xl mb-2">🔒</div>
            <h3 className="text-white font-semibold mb-1">Güvenlik</h3>
            <p className="text-white/60 text-sm">Daha güvenli</p>
          </div>
        </motion.div>

        {/* Loading Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="flex justify-center gap-2">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              className="w-3 h-3 bg-primary rounded-full"
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              className="w-3 h-3 bg-primary rounded-full"
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              className="w-3 h-3 bg-primary rounded-full"
            />
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/50 text-sm"
        >
          <p className="mb-4">Acil durumlar için:</p>
          <div className="flex justify-center gap-6">
            <a href="mailto:support@keyani.me" className="hover:text-primary transition-colors">
              📧 E-posta
            </a>
            <a href="https://twitter.com/keyani" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              🐦 Twitter
            </a>
            <a href="https://discord.gg/keyani" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              💬 Discord
            </a>
          </div>
        </motion.div>

        {/* Admin Link (hidden) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8"
        >
          <Link
            to="/admin"
            className="text-white/30 hover:text-white/50 text-xs transition-colors"
          >
            Admin
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Maintenance
