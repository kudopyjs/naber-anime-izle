import { Link } from 'react-router-dom'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background-dark border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🎌</span>
              <span className="text-xl font-bold text-white">ANIMEX</span>
            </div>
            <p className="text-white/60 text-sm">
              Your ultimate destination for streaming the best anime content.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-white/60 hover:text-primary transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <a href="#genres" className="text-white/60 hover:text-primary transition-colors text-sm">
                  Browse Genres
                </a>
              </li>
              <li>
                <a href="#popular" className="text-white/60 hover:text-primary transition-colors text-sm">
                  Popular Anime
                </a>
              </li>
              <li>
                <a href="#new" className="text-white/60 hover:text-primary transition-colors text-sm">
                  New Releases
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#help" className="text-white/60 hover:text-primary transition-colors text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#faq" className="text-white/60 hover:text-primary transition-colors text-sm">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white/60 hover:text-primary transition-colors text-sm">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#terms" className="text-white/60 hover:text-primary transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-3">
              <a 
                href="#twitter" 
                className="w-10 h-10 rounded-full bg-card-dark hover:bg-primary/20 border border-white/10 hover:border-primary flex items-center justify-center transition-all"
              >
                <span className="text-white">𝕏</span>
              </a>
              <a 
                href="#discord" 
                className="w-10 h-10 rounded-full bg-card-dark hover:bg-primary/20 border border-white/10 hover:border-primary flex items-center justify-center transition-all"
              >
                <span className="text-white">D</span>
              </a>
              <a 
                href="#youtube" 
                className="w-10 h-10 rounded-full bg-card-dark hover:bg-primary/20 border border-white/10 hover:border-primary flex items-center justify-center transition-all"
              >
                <span className="text-white">▶</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-8 pt-8 text-center">
          <p className="text-white/40 text-sm">
            © {currentYear} ANIMEX. All rights reserved. Made with ❤️ for anime fans.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
