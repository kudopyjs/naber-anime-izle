import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { saveWatchProgress } from '../utils/watchHistory'

function CustomVideoPlayer({ videoRef, hlsRef, anime, currentEpisode, subtitles = [], proxyServer, introOutro = {} }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isSeeking, setIsSeeking] = useState(false)
  const [currentSubtitle, setCurrentSubtitle] = useState(null)
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false)
  const [showSkipIntro, setShowSkipIntro] = useState(false)
  const [showSkipOutro, setShowSkipOutro] = useState(false)
  
  const containerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const progressBarRef = useRef(null)
  const [hideCursor, setHideCursor] = useState(false)
  const saveProgressTimerRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update time
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime)
        setDuration(video.duration || 0)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0)
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [videoRef, isSeeking])

  // Auto-hide controls and cursor
  useEffect(() => {
    const resetTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      
      setShowControls(true)
      setHideCursor(false)
      
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false)
          setHideCursor(true)
        }, 3000)
      }
    }

    resetTimeout()

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  const handleMouseMove = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    setShowControls(true)
    if (!isMobile) {
      setHideCursor(false)
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
        if (!isMobile) {
          setHideCursor(true)
        }
      }, 3000)
    }
  }

  const handleTouchStart = () => {
    // Toggle controls on touch
    setShowControls(!showControls)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

  const handleSeek = (e) => {
    const video = videoRef.current
    if (!video || !progressBarRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    const newTime = pos * duration
    
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleProgressMouseDown = (e) => {
    setIsSeeking(true)
    handleSeek(e)
  }

  const handleProgressMouseMove = (e) => {
    if (isSeeking) {
      handleSeek(e)
    }
  }

  const handleProgressMouseUp = () => {
    setIsSeeking(false)
  }

  useEffect(() => {
    if (isSeeking) {
      document.addEventListener('mousemove', handleProgressMouseMove)
      document.addEventListener('mouseup', handleProgressMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleProgressMouseMove)
        document.removeEventListener('mouseup', handleProgressMouseUp)
      }
    }
  }, [isSeeking])

  const skip = (seconds) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration))
  }

  const handleVolumeChange = (e) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume || 0.5
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    const container = containerRef.current
    
    if (!video || !container) return

    // iOS Safari uses webkitEnterFullscreen on video element
    if (video.webkitEnterFullscreen) {
      try {
        if (video.webkitDisplayingFullscreen) {
          video.webkitExitFullscreen()
        } else {
          video.webkitEnterFullscreen()
        }
        return
      } catch (e) {
        console.log('iOS fullscreen error:', e)
      }
    }

    // Standard fullscreen API for other browsers
    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen()
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen()
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    }
  }

  const skipIntro = () => {
    const video = videoRef.current
    if (!video || !introOutro?.intro) return
    
    video.currentTime = introOutro.intro.end
    setShowSkipIntro(false)
  }

  const skipOutro = () => {
    const video = videoRef.current
    if (!video || !introOutro?.outro) return
    
    video.currentTime = introOutro.outro.end
    setShowSkipOutro(false)
  }

  useEffect(() => {
    const video = videoRef.current
    
    const handleFullscreenChange = () => {
      // Check standard fullscreen
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      )
      
      // Check iOS fullscreen
      const isIOSFullscreen = video?.webkitDisplayingFullscreen || false
      
      setIsFullscreen(isFullscreen || isIOSFullscreen)
    }

    // Standard fullscreen events
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    
    // iOS fullscreen events
    if (video) {
      video.addEventListener('webkitbeginfullscreen', handleFullscreenChange)
      video.addEventListener('webkitendfullscreen', handleFullscreenChange)
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      
      if (video) {
        video.removeEventListener('webkitbeginfullscreen', handleFullscreenChange)
        video.removeEventListener('webkitendfullscreen', handleFullscreenChange)
      }
    }
  }, [videoRef])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      const video = videoRef.current
      if (!video) return

      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'arrowleft':
          e.preventDefault()
          skip(-10)
          break
        case 'arrowright':
          e.preventDefault()
          skip(10)
          break
        case 'j':
          e.preventDefault()
          skip(-10)
          break
        case 'l':
          e.preventDefault()
          skip(10)
          break
        case 'arrowup':
          e.preventDefault()
          video.volume = Math.min(1, video.volume + 0.1)
          setVolume(video.volume)
          setIsMuted(false)
          break
        case 'arrowdown':
          e.preventDefault()
          video.volume = Math.max(0, video.volume - 0.1)
          setVolume(video.volume)
          setIsMuted(video.volume === 0)
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'c':
          e.preventDefault()
          // Toggle subtitles
          if (subtitles.length > 0) {
            const video = videoRef.current
            if (video && video.textTracks) {
              if (currentSubtitle === null) {
                // Enable first subtitle
                video.textTracks[0].mode = 'showing'
                setCurrentSubtitle(0)
              } else {
                // Disable all subtitles
                for (let i = 0; i < video.textTracks.length; i++) {
                  video.textTracks[i].mode = 'disabled'
                }
                setCurrentSubtitle(null)
              }
            }
          }
          break
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault()
          const percent = parseInt(e.key) / 10
          video.currentTime = duration * percent
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [duration, togglePlay, skip, toggleMute, toggleFullscreen])

  // Check for intro/outro and show skip buttons
  useEffect(() => {
    if (!introOutro || !introOutro.intro || !introOutro.outro) return

    const intro = introOutro.intro
    const outro = introOutro.outro

    // Show skip intro button if within intro range (intro.start can be 0)
    if (intro && intro.end > intro.start && intro.end > 0) {
      if (currentTime >= intro.start && currentTime <= intro.end) {
        setShowSkipIntro(true)
      } else {
        setShowSkipIntro(false)
      }
    }

    // Show skip outro button if within outro range
    if (outro && outro.start > 0 && outro.end > outro.start) {
      if (currentTime >= outro.start && currentTime <= outro.end) {
        setShowSkipOutro(true)
      } else {
        setShowSkipOutro(false)
      }
    }
  }, [currentTime, introOutro])

  // Show skip intro immediately if intro starts at 0 and video is loaded
  useEffect(() => {
    if (!introOutro?.intro || !duration) return
    
    const intro = introOutro.intro
    
    // If intro starts at 0 and video is loaded, show skip intro button
    if (intro.start === 0 && intro.end > 0 && currentTime < intro.end) {
      setShowSkipIntro(true)
    }
  }, [introOutro, duration])

  // Save watch progress periodically
  useEffect(() => {
    if (!anime || !currentEpisode || !duration || duration === 0) {
      console.log('⏸️ Progress save skipped:', { anime: !!anime, episode: !!currentEpisode, duration })
      return
    }

    const saveProgress = () => {
      const progress = (currentTime / duration) * 100
      
      console.log('💾 Attempting to save progress:', {
        anime: anime.name,
        episode: currentEpisode.number,
        currentTime: Math.round(currentTime),
        duration: Math.round(duration),
        progress: Math.round(progress)
      })
      
      // Only save if watched more than 1% and less than 95%
      if (progress > 1 && progress < 95) {
        const saved = saveWatchProgress({
          animeId: anime.id,
          animeName: anime.name,
          poster: anime.poster,
          episodeId: currentEpisode.episodeId,
          episodeNumber: currentEpisode.number,
          episodeTitle: currentEpisode.title || `Episode ${currentEpisode.number}`,
          currentTime: currentTime,
          duration: duration,
          progress: Math.round(progress)
        })
        console.log('✅ Progress saved:', saved)
      } else {
        console.log('⏭️ Progress not saved (outside 5-95% range)')
      }
    }

    // Save progress every 10 seconds while playing
    if (isPlaying) {
      saveProgressTimerRef.current = setInterval(saveProgress, 10000)
    }

    return () => {
      if (saveProgressTimerRef.current) {
        clearInterval(saveProgressTimerRef.current)
        // Save one last time when stopping
        saveProgress()
      }
    }
  }, [anime, currentEpisode, currentTime, duration, isPlaying])

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black group"
      style={{ cursor: hideCursor && !isMobile ? 'none' : 'default' }}
      onMouseMove={!isMobile ? handleMouseMove : undefined}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onMouseLeave={() => {
        if (isPlaying && !isMobile) {
          setShowControls(false)
          setHideCursor(true)
        }
      }}
      onClick={togglePlay}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        webkit-playsinline="true"
        crossOrigin="anonymous"
        poster={anime?.poster}
        preload="metadata"
        controlsList="nodownload"
      >
        {/* Subtitles */}
        {subtitles.map((track, index) => (
          <track
            key={index}
            kind={track.kind || 'subtitles'}
            src={track.file ? `${proxyServer}/proxy?url=${encodeURIComponent(track.file)}` : track.file}
            srcLang={track.label?.toLowerCase() || 'en'}
            label={track.label || `Subtitle ${index + 1}`}
            default={index === 0}
          />
        ))}
      </video>

      {/* Top Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-20 p-4 pb-2 bg-gradient-to-b from-black/70 to-transparent"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 shrink-0"></div>
              <div className="text-center">
                <h2 className="text-white text-lg font-bold leading-tight">
                  {anime?.name || 'Video'}
                </h2>
                {currentEpisode && (
                  <p className="text-white/70 text-sm">
                    Bölüm {currentEpisode.number}: {currentEpisode.title || 'Bölüm'}
                  </p>
                )}
              </div>
              <div className="w-12 flex items-center justify-end">
                {subtitles.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowSubtitleMenu(!showSubtitleMenu)
                      }}
                      className={`${isMobile ? 'p-3' : 'p-2'} text-white hover:text-primary transition-colors touch-manipulation`}
                      title="Altyazılar"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/>
                      </svg>
                    </button>
                    
                    {/* Subtitle Menu */}
                    <AnimatePresence>
                      {showSubtitleMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full right-0 mt-2 bg-black/90 rounded-lg shadow-xl overflow-hidden min-w-[150px] z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              const video = videoRef.current
                              if (video && video.textTracks) {
                                for (let i = 0; i < video.textTracks.length; i++) {
                                  video.textTracks[i].mode = 'disabled'
                                }
                              }
                              setCurrentSubtitle(null)
                              setShowSubtitleMenu(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
                              currentSubtitle === null ? 'text-primary font-bold' : 'text-white'
                            }`}
                          >
                            Kapalı
                          </button>
                          {subtitles.map((track, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                const video = videoRef.current
                                if (video && video.textTracks) {
                                  for (let i = 0; i < video.textTracks.length; i++) {
                                    video.textTracks[i].mode = i === index ? 'showing' : 'disabled'
                                  }
                                }
                                setCurrentSubtitle(index)
                                setShowSubtitleMenu(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
                                currentSubtitle === index ? 'text-primary font-bold' : 'text-white'
                              }`}
                            >
                              {track.label || `Altyazı ${index + 1}`}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Play Button */}
      <AnimatePresence>
        {showControls && !isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
              className="flex items-center justify-center rounded-full w-20 h-20 bg-primary text-white hover:bg-primary/80 transition-all transform hover:scale-110"
            >
              <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Intro Button */}
      <AnimatePresence>
        {showSkipIntro && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={(e) => {
              e.stopPropagation()
              skipIntro()
            }}
            className="absolute bottom-24 right-6 z-30 px-6 py-3 bg-white/90 hover:bg-white text-black font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            Skip Intro →
          </motion.button>
        )}
      </AnimatePresence>

      {/* Skip Outro Button */}
      <AnimatePresence>
        {showSkipOutro && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={(e) => {
              e.stopPropagation()
              skipOutro()
            }}
            className="absolute bottom-24 right-6 z-30 px-6 py-3 bg-white/90 hover:bg-white text-black font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            Skip Outro →
          </motion.button>
        )}
      </AnimatePresence>

      {/* Skip Buttons Overlay */}
      <AnimatePresence>
        {showControls && isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-around pointer-events-none"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                skip(-10)
              }}
              className="p-4 text-white pointer-events-auto hover:scale-110 transition-transform"
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                <text x="9" y="16" fontSize="8" fill="white" fontWeight="bold">10</text>
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
              className="flex items-center justify-center rounded-full w-16 h-16 bg-primary/80 text-white pointer-events-auto hover:bg-primary transition-all"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                skip(10)
              }}
              className="p-4 text-white pointer-events-auto hover:scale-110 transition-transform"
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                <text x="9" y="16" fontSize="8" fill="white" fontWeight="bold">10</text>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-4 space-y-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent"
          >
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-white text-xs font-medium min-w-[45px]">
                {formatTime(currentTime)}
              </span>
              <div
                ref={progressBarRef}
                className="h-1 flex-1 rounded-full bg-white/30 cursor-pointer relative group/progress"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleProgressMouseDown(e)
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="h-1 rounded-full bg-primary relative transition-all"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 -top-1.5 w-4 h-4 rounded-full bg-primary opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
                </div>
              </div>
              <span className="text-white text-xs font-medium min-w-[45px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 md:gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    skip(-10)
                  }}
                  className={`${isMobile ? 'p-3' : 'p-2'} text-white hover:text-primary transition-colors touch-manipulation`}
                  title="10 saniye geri"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlay()
                  }}
                  className={`${isMobile ? 'p-3' : 'p-2'} text-white hover:text-primary transition-colors touch-manipulation`}
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    skip(10)
                  }}
                  className={`${isMobile ? 'p-3' : 'p-2'} text-white hover:text-primary transition-colors touch-manipulation`}
                  title="10 saniye ileri"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                {/* Volume Control - Hidden on mobile (iOS doesn't support volume control) */}
                {!isMobile && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMute()
                      }}
                      className="p-2 text-white hover:text-primary transition-colors"
                    >
                      {isMuted || volume === 0 ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        </svg>
                      ) : volume < 0.5 ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                        </svg>
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                  </div>
                )}

                {/* Fullscreen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFullscreen()
                  }}
                  className={`${isMobile ? 'p-3' : 'p-2'} text-white hover:text-primary transition-colors touch-manipulation`}
                >
                  {isFullscreen ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomVideoPlayer
