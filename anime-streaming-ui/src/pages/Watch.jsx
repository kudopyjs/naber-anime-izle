import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Watch() {
  const { id } = useParams()
  const [isPlaying, setIsPlaying] = useState(false)

  // Mock data - in real app this would come from API
  const animeInfo = {
    title: 'Cybernetic Echoes',
    episode: 7,
    rating: 4.5,
    duration: '23:45',
    description: 'In a neon-drenched metropolis, a rogue android discovers a hidden truth that could shatter the fragile peace between humans and machines. This episode follows Kaito as he delves deeper into the digital underworld...',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAW97_rdIranqBqIyAiYVU1L1SVSa-ABgP36XFZso5OTC-djb7CRh9qaP_8UFevb0iIxf9O0_PSz-bZaCpr456NDGnmGf6PxkXMrbmhLJ3qM1BvBHmH5do_NKKjr7x7mX7hi0vzu7v4-UHC4oS8IiUf4qhznrACoDM3dle98KhGjKSYg2hMex3m0Xa2L8tUWXbE8Tus2skH1mSvYHlF8rY1-NMC7wk-tISp3wMC5202fTGW6Flo50izTtbrP0BZMyI5CWpbOYnSIvgX'
  }

  const episodes = [
    { id: 1, title: 'Episode 1', duration: '24:12', watched: true },
    { id: 7, title: 'Episode 7', duration: '23:45', watched: false },
    { id: 8, title: 'Episode 8: Digital Ghost', duration: '23:50', watched: false }
  ]

  const recommended = [
    { id: 11, title: 'Neon Genesis', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOrZSxX_QzD1bxcoK42PdPCr_rJtalFjMqj6rPJcgb6JfLMR94QoPu-iEX19GxsglOHXvh5sBBBjkVF3Q8II0hEA1OirTD-I-5ARp4vTNhTu7R2fyPmhUpZQeTUikFNXtg5Xkd0z61cgsshavAD14zMmUZYdf8zQGk8I93BmaxWvF-vlE--ky7g_jqwYdpZdZl2wQVrTARV49t7xkviHnDPaRNXq1YNtLCbHByZI_q9nUuN0nd6ShiqzPFglTK6WR-Ga4Lh2vJ1REW' },
    { id: 12, title: 'Akira Redux', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcOZwArfhwGd0pWoCXM2raJX6G3c2kTPuuSOOKPdSrD_oR2xuStepsoRIIbhrGUiizy9f_ffCUCDTHpzek_aP3ZjNvGPOYIAwtvkjINb_Olv2AI0DIsiwFoVVsTTYmc1T0VvVrXRcYWrqBjR0gYgQAIqT8f4TJYPGE-JcS13MMHg0iaQNZ23rzSxSD_gv6P_CUS-MPVA7X_GLBpBhOuDVCCJf5RNgMCmCv3jIJxDCl-Fd6MZgLYw36xTRshNUum3e_UIumHER9Bcpj' },
    { id: 13, title: 'Ghost in the Machine', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRJkfPhYsBZ_pFc99mBFfPdxzSzEzG20mlbdO5NjJn_PitEpYCSEGKbYkcYStphIFCkPg5VPdWjOQIvOU26sE67yoEZjVzWqUHqf_I5dfgFlYOaGp5jpLdywr3veTNoOjVNA_qn01f0t6fzNNuhP3OfCKY9dP1DBT1MD0d7KN4fsxq_Js9CO821lY20fk0Jlg2NSNThxK-mbZVCBDBaifeDMcM966GKAS3mT6jGWTNeUoUqtWMVTj2vJFY8BbWBhSilToWxdO6EAC5' }
  ]

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-video rounded-xl overflow-hidden glow-cyan bg-black"
            >
              <img
                src={animeInfo.thumbnail}
                alt={animeInfo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 rounded-full bg-black/50 hover:bg-primary flex items-center justify-center transition-all transform hover:scale-110 glow-magenta"
                >
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-primary" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-white text-sm">
                  <span>10:32</span>
                  <div className="flex gap-4">
                    <button className="hover:text-primary transition-colors">🔊</button>
                    <button className="hover:text-primary transition-colors">⚙️</button>
                    <button className="hover:text-primary transition-colors">HD</button>
                    <button className="hover:text-primary transition-colors">⛶</button>
                  </div>
                  <span>{animeInfo.duration}</span>
                </div>
              </div>
            </motion.div>

            {/* Anime Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <h1 className="text-4xl font-bold text-white mb-3">
                {animeInfo.title}: Episode {animeInfo.episode}
              </h1>
              <div className="flex items-center gap-4 text-white/80 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className="text-primary">⭐</span>
                  ))}
                  <span className="text-primary/50">⭐</span>
                </div>
                <span>{animeInfo.rating}</span>
                <span>|</span>
                <span>{animeInfo.duration}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button className="flex items-center gap-2 px-6 py-3 bg-primary/20 hover:bg-primary text-primary hover:text-background-dark rounded-lg transition-all font-semibold">
                  👍 Like
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold">
                  ➕ Add to List
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold">
                  🔗 Share
                </button>
              </div>

              <p className="text-white/80 leading-relaxed mb-6">
                {animeInfo.description}
              </p>

              {/* Language Selection */}
              <div className="flex gap-3">
                <button className="px-6 py-2 bg-primary text-background-dark rounded-lg font-bold">
                  ENG
                </button>
                <button className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition-colors">
                  JP
                </button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Next Episode */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h2 className="text-white font-bold text-lg mb-4">Next Episode</h2>
              <Link to={`/watch/${episodes[2].id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors">
                <img
                  src={animeInfo.thumbnail}
                  alt="Next episode"
                  className="w-28 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{episodes[2].title}</p>
                  <p className="text-white/60 text-xs">{episodes[2].duration}</p>
                </div>
                <span className="text-primary text-2xl">▶</span>
              </Link>
            </div>

            {/* All Episodes */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h2 className="text-white font-bold text-lg mb-4">All Episodes</h2>
              <div className="space-y-2">
                {episodes.map((ep) => (
                  <Link
                    key={ep.id}
                    to={`/watch/${ep.id}`}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      ep.id === 7 ? 'bg-primary/10' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      ep.watched ? 'border-primary text-primary' : 'border-white/20 text-white/60'
                    }`}>
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${ep.id === 7 ? 'text-primary' : 'text-white'}`}>
                        {ep.title}
                      </p>
                      <p className="text-white/60 text-xs">{ep.duration}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recommended */}
            <div className="bg-white/5 rounded-xl p-4">
              <h2 className="text-white font-bold text-lg mb-4">Recommended</h2>
              <div className="space-y-3">
                {recommended.map((anime) => (
                  <Link
                    key={anime.id}
                    to={`/watch/${anime.id}`}
                    className="block"
                  >
                    <img
                      src={anime.image}
                      alt={anime.title}
                      className="w-full h-40 object-cover rounded-lg hover:scale-105 transition-transform"
                    />
                    <p className="text-white font-semibold mt-2">{anime.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Watch
