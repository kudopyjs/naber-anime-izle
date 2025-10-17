import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function WatchB2() {
  const { animeSlug, seasonNumber, episodeNumber } = useParams();
  const navigate = useNavigate();
  
  // URL parametrelerinden bilgileri al
  const anime = animeSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); // "one-piece" -> "One Piece"
  const season = seasonNumber;
  const episode = episodeNumber;
  
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // B2 + Cloudflare CDN URL'i oluştur
  const cdnUrl = import.meta.env.VITE_CDN_URL || 'https://f003.backblazeb2.com/file/kudopy';
  const videoPath = `${anime} Season ${season}/Episode ${episode}`;
  const playlistUrl = `${cdnUrl}/${encodeURIComponent(videoPath)}/playlist.m3u8`;
  const thumbnailUrl = `${cdnUrl}/${encodeURIComponent(videoPath)}/thumbnail.jpg`;
  
  const handleTimeUpdate = ({ currentTime, duration }) => {
    setCurrentTime(currentTime);
    
    // İleriye kaydetme (localStorage)
    const watchKey = `watch_${anime}_s${season}_e${episode}`;
    localStorage.setItem(watchKey, JSON.stringify({
      currentTime,
      duration,
      lastWatched: new Date().toISOString()
    }));
  };
  
  const handleEnded = () => {
    // Sonraki bölüme geç
    const nextEpisode = parseInt(episode) + 1;
    navigate(`/watch-b2/${animeSlug}/${season}/${nextEpisode}`);
  };
  
  // Önceki izleme noktasını yükle
  useEffect(() => {
    const watchKey = `watch_${animeSlug}_s${season}_e${episode}`;
    const savedProgress = localStorage.getItem(watchKey);
    
    if (savedProgress) {
      const { currentTime } = JSON.parse(savedProgress);
      // Video player'a seek yapılabilir (videojs API ile)
      console.log('Saved progress:', currentTime);
    }
  }, [animeSlug, season, episode]);
  
  if (!animeSlug || !season || !episode) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">❌ Geçersiz URL</h1>
            <p className="text-white/60 mb-6">
              Kullanım: /watch-b2/one-piece/1/36
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/80 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl mb-6">
              <VideoPlayer
                src={playlistUrl}
                poster={thumbnailUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
              />
            </div>
            
            {/* Video Info */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {anime} - Bölüm {episode}
              </h1>
              <p className="text-white/60 mb-4">Sezon {season}</p>
              
              {/* Debug Info (Development) */}
              {import.meta.env.DEV && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm font-mono">
                    <strong>🔧 Debug Info:</strong><br/>
                    CDN URL: {cdnUrl}<br/>
                    Video Path: {videoPath}<br/>
                    Playlist URL: {playlistUrl}<br/>
                    <br/>
                    <a 
                      href={playlistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      → Test Playlist URL
                    </a>
                    <br/>
                    <a 
                      href={thumbnailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      → Test Thumbnail URL
                    </a>
                  </p>
                </div>
              )}
              
              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                {parseInt(episode) > 1 && (
                  <button
                    onClick={() => navigate(`/watch-b2/${animeSlug}/${season}/${parseInt(episode) - 1}`)}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold"
                  >
                    ← Önceki Bölüm
                  </button>
                )}
                <button
                  onClick={() => navigate(`/watch-b2/${animeSlug}/${season}/${parseInt(episode) + 1}`)}
                  className="px-6 py-3 bg-primary hover:bg-primary/80 text-background-dark rounded-lg transition-all font-semibold"
                >
                  Sonraki Bölüm →
                </button>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-xl p-4">
              <h2 className="text-white font-bold text-lg mb-4">Video Bilgileri</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Anime:</span>
                  <span className="text-white font-semibold">{anime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Sezon:</span>
                  <span className="text-white font-semibold">{season}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Bölüm:</span>
                  <span className="text-white font-semibold">{episode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">İzleme Süresi:</span>
                  <span className="text-white font-semibold">
                    {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Episode Selector */}
            <div className="bg-white/5 rounded-xl p-4 mt-4">
              <h2 className="text-white font-bold text-lg mb-4">Hızlı Bölüm Seçimi</h2>
              <div className="grid grid-cols-5 gap-2">
                {[...Array(50)].map((_, i) => {
                  const ep = i + 1;
                  const isActive = ep === parseInt(episode);
                  return (
                    <button
                      key={ep}
                      onClick={() => navigate(`/watch-b2/${animeSlug}/${season}/${ep}`)}
                      className={`
                        w-full aspect-square rounded-lg font-bold text-sm transition-all
                        ${isActive 
                          ? 'bg-primary text-background-dark' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                        }
                      `}
                    >
                      {ep}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
