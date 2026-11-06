import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw, 
  X, 
  Music, 
  Sparkles,
  Repeat,
  Headphones,
  Radio
} from 'lucide-react';

export const FloatingMusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('batighor_theme_song_volume');
      return saved ? parseFloat(saved) : 0.8;
    } catch {
      return 0.8;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio('/audio/sotter-songram.mp3');
    audio.preload = 'none';
    audio.volume = volume;
    audio.loop = isLooping;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Update loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play request error:', err);
      });
      setIsCardOpen(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const skipSeconds = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration || 1000);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    try {
      localStorage.setItem('batighor_theme_song_volume', newVol.toString());
    } catch {}
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Floating Music Widget Container (Bottom Right) */}
      <div className="fixed z-40 bottom-20 right-4 md:bottom-8 md:right-8 flex flex-col items-end select-none">
        
        {/* Expanded White Glassmorphic Music Player Card */}
        {isCardOpen && (
          <div 
            className="mb-3 w-[320px] sm:w-[350px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_20px_50px_rgba(11,107,58,0.22)] border border-emerald-500/20 dark:border-emerald-500/30 animate-in fade-in zoom-in-95 duration-200 transition-all"
            role="region"
            aria-label="Theme Song Player"
          >
            {/* Header with pill and close button */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Music className="w-3.5 h-3.5 text-[#0B6B3A]" />
                <span>সময়ের বাতিঘর থিম সং</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCardOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close player card"
                title="প্লেয়ার মিনিমাইজ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Song Meta with Dancing Waveform Equalizer */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-heading font-black text-slate-900 dark:text-slate-50 text-base leading-tight truncate">
                  সত্যের সংগ্রাম
                </h4>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1">
                  <span>সত্যের সংগ্রামে ফোটা ফুল</span>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">অফিসিয়াল থিম সং</span>
                </p>
              </div>

              {/* Animated Audio Equalizer Bars */}
              <div className="flex items-end gap-1 h-6 px-2.5 py-1 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/60">
                {[
                  isPlaying ? 'h-5 animate-pulse' : 'h-2',
                  isPlaying ? 'h-3 animate-pulse delay-75' : 'h-1.5',
                  isPlaying ? 'h-6 animate-pulse delay-150' : 'h-3',
                  isPlaying ? 'h-4 animate-pulse delay-100' : 'h-2'
                ].map((barClass, idx) => (
                  <span
                    key={idx}
                    className={`w-1 bg-[#0B6B3A] rounded-full transition-all duration-300 ${barClass}`}
                  />
                ))}
              </div>
            </div>

            {/* Interactive Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="relative group">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  aria-label="Song progress"
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                  style={{
                    background: `linear-gradient(to right, #0B6B3A 0%, #10b981 ${progressPercent}%, #e2e8f0 ${progressPercent}%, #e2e8f0 100%)`
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 font-medium px-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls Row */}
            <div className="mt-3 flex items-center justify-between gap-2">
              {/* Loop Button */}
              <button
                type="button"
                onClick={() => setIsLooping(!isLooping)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isLooping 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isLooping ? 'লুপ চালু আছে' : 'লুপ বন্ধ আছে'}
                aria-label="Toggle loop"
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* Rewind 10s */}
              <button
                type="button"
                onClick={() => skipSeconds(-10)}
                className="p-2 text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer"
                title="১০ সেকেন্ড পেছনে যান"
                aria-label="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Main Play/Pause Button */}
              <button
                type="button"
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0B6B3A] via-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-700/30 hover:shadow-emerald-700/50 hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                title={isPlaying ? 'বিরতি দিন' : 'প্লে করুন'}
                aria-label={isPlaying ? 'Pause song' : 'Play song'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Forward 10s */}
              <button
                type="button"
                onClick={() => skipSeconds(10)}
                className="p-2 text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer"
                title="১০ সেকেন্ড সামনে যান"
                aria-label="Forward 10 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume / Mute Button */}
              <div className="flex items-center gap-1 group relative">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title={isMuted ? 'আনমিউট করুন' : 'মিউট করুন'}
                  aria-label="Toggle mute"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume slider"
                  className="w-14 h-1 bg-slate-200 dark:bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-600 hidden sm:block"
                />
              </div>
            </div>
          </div>
        )}

        {/* White Glassmorphic (সাদা গ্লাসি) "থিম সং" Floating Trigger Button */}
        <div className="relative group">
          {isPlaying && (
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping duration-1000 pointer-events-none" />
          )}

          <button
            type="button"
            onClick={() => {
              if (isCardOpen) {
                togglePlay();
              } else {
                setIsCardOpen(true);
                if (!isPlaying) togglePlay();
              }
            }}
            className={`group/btn relative px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-xl border border-white/80 dark:border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_35px_rgba(11,107,58,0.25)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer ${
              isPlaying ? 'ring-2 ring-[#0B6B3A]/40' : ''
            }`}
            aria-label={isPlaying ? 'Pause theme song' : 'Play theme song'}
            title="সময়ের বাতিঘর থিম সং"
          >
            {/* Modern 2D Circular Emerald Icon with Audio Waves */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isPlaying 
                ? 'bg-[#0B6B3A] text-white shadow-md' 
                : 'bg-emerald-50 dark:bg-emerald-950 text-[#0B6B3A] border border-emerald-200 dark:border-emerald-800'
            }`}>
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-0.5 h-3 bg-white rounded-full animate-pulse" />
                  <span className="w-0.5 h-2 bg-white rounded-full animate-pulse delay-75" />
                  <span className="w-0.5 h-3.5 bg-white rounded-full animate-pulse delay-150" />
                </div>
              ) : (
                <Headphones className="w-4 h-4 text-[#0B6B3A] group-hover/btn:scale-110 transition-transform" />
              )}
            </div>

            {/* Distinct "থিম সং" Text in Bengali */}
            <div className="flex items-center gap-1.5 pr-1">
              <span className="text-xs sm:text-sm font-black font-heading tracking-tight text-[#14231B] dark:text-white">
                থিম সং
              </span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>

            {/* Mini Play / Pause State Icon */}
            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              {isPlaying ? (
                <Pause className="w-2.5 h-2.5 fill-current" />
              ) : (
                <Play className="w-2.5 h-2.5 fill-current ml-0.5 text-emerald-700" />
              )}
            </div>
          </button>
        </div>

      </div>
    </>
  );
};

export default FloatingMusicPlayer;
