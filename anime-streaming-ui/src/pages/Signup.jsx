import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    console.log('Signup:', formData)
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

      {/* Signup Form */}
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
            <p className="text-white/80">Enter the Anime Realm</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Choose a username"
                required
              />
            </div>

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
                  placeholder="Create a password"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-magenta hover:from-primary/80 hover:to-primary-magenta/80 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-neon-cyan"
              >
                SIGN UP
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background-dark/50 text-white/60">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Social Signup */}
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

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white/60">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:text-white transition-colors">
              Switch to Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Signup
