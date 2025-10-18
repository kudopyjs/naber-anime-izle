import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './VideoPlayer.css';

export default function VideoPlayer({ src, poster, onTimeUpdate, onEnded }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

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
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
      });

      playerRef.current = player;

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
      // HLS source set et
      player.src({
        src: src,
        type: 'application/x-mpegURL',
      });

      // Poster set et
      if (poster) {
        player.poster(poster);
      }
    }
  }, [src, poster]);

  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="video-player-wrapper">
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-theme-anime vjs-big-play-centered"
        />
      </div>
    </div>
  );
}
