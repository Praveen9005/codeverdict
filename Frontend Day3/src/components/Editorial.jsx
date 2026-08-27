import { useState, useRef, useEffect } from 'react';
import {
  Pause,
  Play,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Settings,
  Loader2,
  PictureInPicture2,
} from 'lucide-react';

const Editorial = ({ secureUrl, thumbnailUrl, duration }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideControlsTimeout = useRef(null);
  const clickTimer = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(duration);
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isPiP, setIsPiP] = useState(false);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Toggle fullscreen on container (so custom controls are visible)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  // Volume change
  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setMuted(newVolume === 0);
    }
    setVolume(newVolume);
  };

  // Seek by amount (seconds)
  const seekBy = (seconds) => {
    if (!videoRef.current) return;
    const newTime = Math.min(
      Math.max(videoRef.current.currentTime + seconds, 0),
      videoRef.current.duration || actualDuration
    );
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Change playback speed
  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setPlaybackRate(rate);
  };

  // Toggle Picture-in-Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  // Single click vs double click on video
  const handleVideoClick = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      // Double click => toggle fullscreen
      toggleFullscreen();
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        togglePlayPause();
      }, 250);
    }
  };

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    const handleTimeUpdate = () => {
      if (video) setCurrentTime(video.currentTime);
    };
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, []);

  // Load metadata and set actual duration
  useEffect(() => {
    const video = videoRef.current;
    const handleLoadedMetadata = () => {
      if (video?.duration) setActualDuration(video.duration);
    };
    if (video) {
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, []);

  // Track play/pause events
  useEffect(() => {
    const video = videoRef.current;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    if (video) {
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);
      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  // Buffering events
  useEffect(() => {
    const video = videoRef.current;
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handlePlaying = () => setIsBuffering(false);
    if (video) {
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('playing', handlePlaying);
      return () => {
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('playing', handlePlaying);
      };
    }
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Track Picture-in-Picture changes
  useEffect(() => {
    const handlePiPEnter = () => setIsPiP(true);
    const handlePiPLeave = () => setIsPiP(false);
    document.addEventListener('enterpictureinpicture', handlePiPEnter);
    document.addEventListener('leavepictureinpicture', handlePiPLeave);
    return () => {
      document.removeEventListener('enterpictureinpicture', handlePiPEnter);
      document.removeEventListener('leavepictureinpicture', handlePiPLeave);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'arrowright':
          seekBy(10);
          break;
        case 'arrowleft':
          seekBy(-10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((prev) => {
            const newVol = Math.min(prev + 0.1, 1);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((prev) => {
            const newVol = Math.max(prev - 0.1, 0);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'p':
          togglePiP();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, muted, playbackRate]); // dependencies to avoid stale closures

  // Auto-hide controls when playing and not hovering
  useEffect(() => {
    if (isHovering || !isPlaying) {
      setShowControls(true);
      clearTimeout(hideControlsTimeout.current);
    } else {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(hideControlsTimeout.current);
  }, [isHovering, isPlaying]);

  // Set initial volume and playback rate when video loads
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, muted, playbackRate]);

  const effectiveDuration = actualDuration || duration;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg bg-black"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => setIsHovering(true)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={secureUrl}
        poster={thumbnailUrl}
        onClick={handleVideoClick}
        onDoubleClick={(e) => e.preventDefault()} // handle via click timer
        className="w-full aspect-video bg-black cursor-pointer"
      />

      {/* Loading Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Video Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Main controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="btn btn-circle btn-sm btn-primary"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Skip back 10s */}
          <button
            onClick={() => seekBy(-10)}
            className="btn btn-circle btn-sm btn-ghost text-white"
            aria-label="Back 10 seconds"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Skip forward 10s */}
          <button
            onClick={() => seekBy(10)}
            className="btn btn-circle btn-sm btn-ghost text-white"
            aria-label="Forward 10 seconds"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Volume / Mute */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="btn btn-circle btn-sm btn-ghost text-white"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="range range-primary range-xs w-20 sm:w-24"
              aria-label="Volume"
            />
          </div>

          {/* Current Time */}
          <span className="text-white text-xs sm:text-sm whitespace-nowrap">
            {formatTime(currentTime)}
          </span>

          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max={effectiveDuration || 0}
            step="0.1"
            value={currentTime}
            onChange={(e) => {
              const newTime = Number(e.target.value);
              if (videoRef.current) {
                videoRef.current.currentTime = newTime;
                setCurrentTime(newTime);
              }
            }}
            className="range range-primary range-xs flex-1 min-w-[100px]"
            aria-label="Seek"
          />

          {/* Duration */}
          <span className="text-white text-xs sm:text-sm whitespace-nowrap">
            {formatTime(effectiveDuration)}
          </span>

          {/* Playback Speed Menu */}
          <div className="dropdown dropdown-top dropdown-end">
            <button
              tabIndex={0}
              className="btn btn-circle btn-sm btn-ghost text-white"
              aria-label="Playback speed"
            >
              <Settings className="w-4 h-4" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-200 rounded-box z-50 w-32 p-2 shadow"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <li key={rate}>
                  <button
                    onClick={() => changePlaybackRate(rate)}
                    className={`text-sm ${playbackRate === rate ? 'active' : ''}`}
                  >
                    {rate}x
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Picture-in-Picture */}
          <button
            onClick={togglePiP}
            className="btn btn-circle btn-sm btn-ghost text-white"
            aria-label={isPiP ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture'}
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="btn btn-circle btn-sm btn-ghost text-white"
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editorial;