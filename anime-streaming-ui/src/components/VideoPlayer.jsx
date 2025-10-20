import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './VideoPlayer.css';

export default function VideoPlayer({ src, poster, onTimeUpdate, onEnded, useProxy = true }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [quality, setQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Proxy server URL
  const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:5000';

  // Convert video URL to use proxy
  const getProxiedUrl = (url) => {
    if (!url || !useProxy) return url;
    
    // If already proxied, return as is
    if (url.includes('/proxy?url=')) return url;
    
    // Proxy the URL
    return `${PROXY_URL}/proxy?url=${encodeURIComponent(url)}`;
  };

  useEffect(() => {
    // Video.js player oluştur
    if (!playerRef.current && videoRef.current) {
      const player = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: false,
        responsive: false,
        aspectRatio: '16:9',
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'remainingTimeDisplay',
            'playbackRateMenuButton',
            'qualitySelector',
            'fullscreenToggle',
          ],
        },
        html5: {
          vhs: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
            withCredentials: false, // Important for CORS
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
      });

      playerRef.current = player;

      // F tuşu ile tam ekran
      const handleKeyPress = (e) => {
        if (e.key === 'f' || e.key === 'F') {
          if (player.isFullscreen()) {
            player.exitFullscreen();
          } else {
            player.requestFullscreen();
          }
        }
      };

      document.addEventListener('keydown', handleKeyPress);

      // Cleanup
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };

      // Event listeners
      if (onTimeUpdate) {
        player.on('timeupdate', () => {
          onTimeUpdate({
            currentTime: player.currentTime(),
            duration: player.duration(),
          });
        });
      }

      if (onEnded) {
        player.on('ended', onEnded);
      }
    }
  }, [onTimeUpdate, onEnded]);

  useEffect(() => {
    const player = playerRef.current;

    if (player && src) {
      // Use proxied URL for HiAnime streams
      const videoUrl = getProxiedUrl(src);
      
      console.log('🎬 Loading video:', videoUrl);
      
      // HLS source set et
      player.src({
        src: videoUrl,
        type: 'application/x-mpegURL',
      });

      // Poster set et
      if (poster) {
        player.poster(poster);
      }
    }
  }, [src, poster, useProxy]);

  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  const qualities = [
    { label: 'Auto', value: 'auto' },
    { label: '1080p', value: '1080' },
    { label: '720p', value: '720' },
    { label: '480p', value: '480' },
    { label: '360p', value: '360' },
  ];

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    setShowQualityMenu(false);
    // TODO: Implement quality switching logic
    console.log('Quality changed to:', newQuality);
  };

  return (
    <div className="video-player-wrapper">
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-theme-netflix vjs-big-play-centered"
        />
        
        {/* Netflix-style Quality Selector */}
        <div className="netflix-quality-selector">
          <button 
            className="quality-button"
            onClick={() => setShowQualityMenu(!showQualityMenu)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{quality === 'auto' ? 'Auto' : quality + 'p'}</span>
          </button>
          
          {showQualityMenu && (
            <div className="quality-menu">
              {qualities.map((q) => (
                <button
                  key={q.value}
                  className={`quality-option ${quality === q.value ? 'active' : ''}`}
                  onClick={() => handleQualityChange(q.value)}
                >
                  {q.label}
                  {quality === q.value && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4L6 11.5L2.5 8" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
