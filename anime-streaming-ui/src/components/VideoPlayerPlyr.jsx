import { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import Hls from 'hls.js';
import './VideoPlayerPlyr.css';

export default function VideoPlayerPlyr({ src, poster, onTimeUpdate, onEnded }) {
  const playerRef = useRef(null);
  const hlsRef = useRef(null);
  const [quality, setQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [qualities, setQualities] = useState([]);

  useEffect(() => {
    const video = playerRef.current?.plyr?.media;
    if (!video || !src) return;

    // HLS.js setup
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        // Kalite seviyeleri
        const levels = data.levels.map((level, index) => ({
          label: `${level.height}p`,
          value: index,
        }));
        setQualities([{ label: 'Auto', value: -1 }, ...levels]);
      });

      hlsRef.current = hls;

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
    }
  }, [src]);

  // F tuşu ile tam ekran
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        const player = playerRef.current?.plyr;
        if (player) {
          player.fullscreen.toggle();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Time update
  useEffect(() => {
    const player = playerRef.current?.plyr;
    if (!player) return;

    const handleTimeUpdate = () => {
      if (onTimeUpdate) {
        onTimeUpdate({
          currentTime: player.currentTime,
          duration: player.duration,
        });
      }
    };

    const handleEnded = () => {
      if (onEnded) {
        onEnded();
      }
    };

    player.on('timeupdate', handleTimeUpdate);
    player.on('ended', handleEnded);

    return () => {
      player.off('timeupdate', handleTimeUpdate);
      player.off('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  const handleQualityChange = (newQuality) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = newQuality;
      setQuality(newQuality === -1 ? 'auto' : qualities.find(q => q.value === newQuality)?.label || 'auto');
      setShowQualityMenu(false);
    }
  };

  const plyrOptions = {
    controls: [
      'play-large',
      'play',
      'progress',
      'current-time',
      'duration',
      'mute',
      'volume',
      'settings',
      'fullscreen',
    ],
    settings: ['speed'],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
    keyboard: { focused: true, global: true },
    tooltips: { controls: true, seek: true },
    poster: poster,
  };

  return (
    <div className="video-player-wrapper-plyr">
      <Plyr
        ref={playerRef}
        source={{
          type: 'video',
          sources: [{ src: src, type: 'application/x-mpegURL' }],
          poster: poster,
        }}
        options={plyrOptions}
      />

      {/* Netflix-style Quality Selector */}
      {qualities.length > 0 && (
        <div className="netflix-quality-selector-plyr">
          <button
            className="quality-button-plyr"
            onClick={() => setShowQualityMenu(!showQualityMenu)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                fill="currentColor"
              />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
            <span>{quality === 'auto' ? 'Auto' : quality}</span>
          </button>

          {showQualityMenu && (
            <div className="quality-menu-plyr">
              {qualities.map((q) => (
                <button
                  key={q.value}
                  className={`quality-option-plyr ${
                    (quality === 'auto' && q.value === -1) ||
                    quality === q.label
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => handleQualityChange(q.value)}
                >
                  {q.label}
                  {((quality === 'auto' && q.value === -1) ||
                    quality === q.label) && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M13.5 4L6 11.5L2.5 8"
                        stroke="#E50914"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
