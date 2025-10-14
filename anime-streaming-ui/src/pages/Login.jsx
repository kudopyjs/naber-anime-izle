import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login:', formData)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWKBmJT6SvS4-YkoPJlBFc52Q8O9t6sRUh5gEDJwLa3VMiyk73l5dJn_ZphpNakw8DEdOlPHKWmjLXSWlEtg2SFiQdilplIFpYnva2l-94aF80319O15G3CtjvWXkgR_6Ck6aT0_5Im0LGvNhNJURb2PK1BAlxWZYJFMXZ759covjOniAtMxRDEfbv-b6enAhdZAZdqych2EqkeSSnpktACQO4Z1dL8B9E3HRyiM5r7Fs6ANHHb5jhbZ4iXIru4_JptUgVK7iqpqt3"
          alt="Background"
          className="w-full h-full object-cover blur-md"
        />
        <div className="absolute inset-0 bg-background-dark/70" />
      </div>

      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-4 left-4 z-20 flex items-center gap-2 text-primary hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glassmorphic rounded-xl p-8 shadow-2xl border border-primary/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white text-glow-cyan mb-2">
              ANIMEX
            </h1>
            <p className="text-white/80">Welcome Back, Otaku!</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.remember}
                  onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                  className="w-4 h-4 rounded border-primary/50 bg-black/30 text-primary focus:ring-primary"
                />
                <span className="text-white/80">Remember me</span>
              </label>
              <a href="#" className="text-primary hover:text-white transition-colors">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-magenta hover:from-primary/80 hover:to-primary-magenta/80 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-neon-cyan"
            >
              LOGIN
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background-dark/50 text-white/60">
                Or log in with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-2 px-4 bg-black/30 hover:bg-black/50 border border-white/20 hover:border-primary rounded-lg text-white transition-all group">
              <span className="text-lg">G</span>
              <span className="text-sm">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-2 px-4 bg-black/30 hover:bg-black/50 border border-white/20 hover:border-primary-magenta rounded-lg text-white transition-all group">
              <span className="text-lg">D</span>
              <span className="text-sm">Discord</span>
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white/60">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-primary-magenta hover:text-white transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
