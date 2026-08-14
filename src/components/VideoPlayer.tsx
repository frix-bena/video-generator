import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  Subtitles, 
  Download, 
  Sparkles, 
  AlertTriangle,
} from 'lucide-react';
import { Project } from '../types/cinegen';
import { audioEngine } from '../services/audioEngine';

export interface VideoPlayerProps {
  project?: Project;
  videoUrl?: string;
  isGenerating?: boolean;
  generationProgress?: number;
  generationMessage?: string;
  currentSegmentIndex?: number;
  onSegmentChange?: (index: number) => void;
  onUpdateProject?: (updated: Partial<Project>) => void;
  autoPlay?: boolean;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  project,
  videoUrl: propVideoUrl,
  isGenerating = false,
  generationProgress,
  generationMessage,
  currentSegmentIndex = 0,
  onSegmentChange,
  onUpdateProject: _onUpdateProject,
  autoPlay = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // 1. Determine active video URL (from direct prop, project, or selected variation)
  const activeVariation = project?.variations?.find((v) => v.id === project?.selectedVariationId);
  const videoUrl = propVideoUrl || project?.videoUrl || activeVariation?.videoUrl || null;

  const isImageUrl = (url?: string | null): boolean => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|ico)$/i.test(cleanUrl);
  };

  const hasValidVideoUrl = Boolean(videoUrl && !isImageUrl(videoUrl));

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedPct, setBufferedPct] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Scrubber hover state
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState<boolean>(false);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Format seconds to mm:ss
  const formatTime = (secs: number): string => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Autoplay handler when videoUrl is mounted or changes
  useEffect(() => {
    if (videoUrl && hasValidVideoUrl && videoRef.current) {
      setPlaybackError(null);
      if (autoPlay) {
        // Trigger programmatic autoplay with audio or muted fallback
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((_err) => {
          // If browser blocks unmuted autoplay, mute and play
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {});
          }
        });
      }
    }
  }, [videoUrl, hasValidVideoUrl, autoPlay]);

  // Sync volume with video ref
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Sync playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (!isNaN(dur) && dur > 0) {
        setDuration(dur);
      }
      setIsVideoBuffering(false);
      if (autoPlay) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isDraggingScrubber) {
      const curr = videoRef.current.currentTime;
      setCurrentTime(curr);

      // Update buffered percentage
      if (videoRef.current.buffered.length > 0 && duration > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBufferedPct(Math.min(100, (bufferedEnd / duration) * 100));
      }

      // Sync active scene segment if project has segments
      if (project?.segments && project.segments.length > 0 && onSegmentChange) {
        const activeIdx = project.segments.findIndex(
          (s) => curr >= s.startTime && curr <= s.endTime
        );
        if (activeIdx !== -1 && activeIdx !== currentSegmentIndex) {
          onSegmentChange(activeIdx);
        }
      }
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        audioEngine.playSFX('click');
      }).catch((e) => console.warn('Play error:', e));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      audioEngine.playSFX('click');
    }
  };

  const handleSeek = (timeInSecs: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(timeInSecs, duration || 100));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);

    if (isDraggingScrubber) {
      handleSeek(pos * duration);
    }
  };

  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    setIsDraggingScrubber(true);
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleSeek(pos * duration);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingScrubber) {
        setIsDraggingScrubber(false);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDraggingScrubber]);

  // Skip forward / backward
  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    handleSeek(videoRef.current.currentTime + seconds);
    audioEngine.playSFX('click');
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.playSFX('click');
  };

  // Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Fullscreen Toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((e) => console.warn('Fullscreen error:', e));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((e) => console.warn('Exit fullscreen error:', e));
    }
  };

  // Direct .MP4 Download Handler
  const handleDownloadVideo = () => {
    if (!videoUrl) return;
    audioEngine.playSFX('whoosh');
    const a = document.createElement('a');
    a.href = videoUrl;
    const cleanTitle = (project?.title || 'generated_ai_video').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${cleanTitle}.mp4`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Auto hide controls on inactivity
  const handleMouseMoveContainer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.code === 'KeyK') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkip(5);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  // Current scene segment for subtitles
  const segments = project?.segments || [];
  const currentSegment = segments.find(
    (seg) => currentTime >= seg.startTime && currentTime <= seg.endTime
  ) || segments[0];

  const currentProgressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMoveContainer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative flex flex-col rounded-2xl overflow-hidden border border-pink-500/30 bg-slate-950 shadow-2xl shadow-black/90 group/player select-none ${className}`}
    >
      {/* Video Viewport Container */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        
        {/* State A: Video is generating OR no valid video URL available yet */}
        {(isGenerating || !hasValidVideoUrl) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-center p-6 space-y-4 z-20">
            {/* Spinning Glowing Diffusion Indicator */}
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 rounded-full border-3 border-pink-500/20 border-t-pink-500 animate-spin" />
              <div className="absolute h-10 w-10 rounded-full bg-pink-500/10 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-pink-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-display text-base sm:text-lg font-bold text-white tracking-wide">
                Generating realistic video frames...
              </h4>
              <p className="text-xs text-slate-400">
                {generationMessage || 'Synthesizing text-to-video diffusion latent frames with temporal consistency...'}
              </p>
            </div>

            {/* Progress bar if percent available */}
            {generationProgress !== undefined && (
              <div className="w-48 sm:w-64 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden border border-pink-500/20">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${Math.max(10, generationProgress)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-pink-300">
                  <span>Rendering</span>
                  <span>{generationProgress}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* State B: HTML5 <video> Element (Active when videoUrl is valid) */}
        {hasValidVideoUrl && (
          <video
            ref={videoRef}
            key={videoUrl!}
            src={videoUrl!}
            preload="auto"
            autoPlay={autoPlay}
            muted={isMuted}
            playsInline
            loop
            onLoadedMetadata={handleLoadedMetadata}
            onDurationChange={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onCanPlay={() => setIsVideoBuffering(false)}
            onWaiting={() => setIsVideoBuffering(true)}
            onPlaying={() => {
              setIsVideoBuffering(false);
              setIsPlaying(true);
              setPlaybackError(null);
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('[VideoPlayer] Playback Error:', e);
              setPlaybackError('Unable to decode video format. Please check stream URL.');
              setIsVideoBuffering(false);
            }}
            onClick={handleTogglePlay}
            className="w-full h-full object-cover cursor-pointer"
          />
        )}

        {/* Playback Error Banner */}
        {playbackError && (
          <div className="absolute inset-x-4 top-14 z-30 flex items-center justify-between gap-3 rounded-xl bg-rose-950/95 border border-rose-500/80 p-4 text-rose-200 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <div className="text-left text-xs">
                <p className="font-bold text-rose-100 uppercase">Video Stream Playback Notice</p>
                <p className="text-rose-300/90 mt-0.5">{playbackError}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setPlaybackError(null);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="btn-cine-primary px-3 py-1 text-xs font-bold shrink-0"
            >
              Retry Stream
            </button>
          </div>
        )}

        {/* Buffering Indicator */}
        {isVideoBuffering && hasValidVideoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-25 pointer-events-none">
            <div className="h-12 w-12 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin shadow-lg" />
          </div>
        )}

        {/* Center Big Play / Pause Overlay Icon */}
        {hasValidVideoUrl && !isPlaying && !isVideoBuffering && (
          <button
            onClick={handleTogglePlay}
            className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-pink-600/80 hover:bg-pink-500 hover:scale-110 active:scale-95 text-white flex items-center justify-center shadow-2xl shadow-pink-500/50 backdrop-blur-md border border-white/20 transition-all duration-200 z-20 cursor-pointer"
            title="Play Video (Spacebar)"
          >
            <Play className="h-7 w-7 fill-current translate-x-0.5" />
          </button>
        )}

        {/* Subtitles Overlay */}
        {showSubtitles && currentSegment?.narration && hasValidVideoUrl && (
          <div className="absolute bottom-16 inset-x-6 z-20 pointer-events-none flex justify-center text-center">
            <div className="max-w-xl rounded-xl bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-pink-300 font-bold mr-1.5">{currentSegment.title}:</span>
              <span>{currentSegment.narration}</span>
            </div>
          </div>
        )}

        {/* Top Badges (Metadata & Diffusion Tag) */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-20 pointer-events-auto">
          {hasValidVideoUrl ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-emerald-300 border border-emerald-500/40 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI VIDEO DIFFUSION • 1080P MP4</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-pink-300 border border-pink-500/30 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />
              <span>RENDERING FRAMES</span>
            </div>
          )}

          {/* Model Tag */}
          <div className="rounded-lg bg-black/80 backdrop-blur-md px-2 py-1 text-[11px] font-mono text-pink-200 border border-pink-500/30 shadow-lg hidden sm:block">
            {project?.aiModel || activeVariation?.styleName || 'MiniMax Video-01'}
          </div>
        </div>

        {/* Top-Right: Direct Download Button in Viewport */}
        {hasValidVideoUrl && (
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            <button
              onClick={handleDownloadVideo}
              className="flex items-center gap-1.5 rounded-xl bg-black/80 hover:bg-slate-900 border border-pink-500/30 hover:border-pink-400 px-3 py-1.5 text-xs font-semibold text-pink-200 hover:text-white transition-all shadow-lg backdrop-blur-md cursor-pointer"
              title="Download Master .MP4 Video"
            >
              <Download className="h-3.5 w-3.5 text-pink-400" />
              <span className="hidden sm:inline">Download .MP4</span>
            </button>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* Playback Control Bar (Scrubber, Play, Volume, Fullscreen) */}
      {/* ========================================================= */}
      <div 
        className={`p-3 sm:p-4 bg-slate-950/95 border-t border-pink-500/20 backdrop-blur-xl transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber / Seek Bar */}
        <div 
          ref={progressBarRef}
          onMouseMove={handleScrubberMouseMove}
          onMouseDown={handleScrubberMouseDown}
          onMouseLeave={() => setHoverTime(null)}
          className="relative h-4 w-full flex items-center cursor-pointer group/scrubber select-none"
        >
          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div 
              className="absolute -top-7 transform -translate-x-1/2 rounded-md bg-pink-600 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white shadow-md pointer-events-none"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Background Track */}
          <div className="h-1.5 w-full rounded-full bg-slate-800 relative overflow-hidden group-hover/scrubber:h-2 transition-all">
            {/* Buffered Progress */}
            <div 
              className="absolute top-0 bottom-0 left-0 bg-slate-700/60 rounded-full"
              style={{ width: `${bufferedPct}%` }}
            />
            {/* Played Progress Fill */}
            <div 
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 rounded-full"
              style={{ width: `${currentProgressPct}%` }}
            />
          </div>

          {/* Scrubber Thumb Knob */}
          <div 
            className="absolute h-3.5 w-3.5 rounded-full bg-white shadow-md border-2 border-pink-500 transform -translate-x-1/2 opacity-0 group-hover/scrubber:opacity-100 transition-opacity"
            style={{ left: `${currentProgressPct}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {/* Left Controls: Play/Pause, Rewind, Fast Forward, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play / Pause Toggle */}
            <button
              onClick={handleTogglePlay}
              disabled={!hasValidVideoUrl}
              className="h-8 w-8 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-white flex items-center justify-center transition-colors border border-pink-500/30 disabled:opacity-40 cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current translate-x-0.5" />}
            </button>

            {/* Rewind 5s */}
            <button
              onClick={() => handleSkip(-5)}
              disabled={!hasValidVideoUrl}
              className="h-8 w-8 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
              title="Rewind 5s (Left Arrow)"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Fast-Forward 5s */}
            <button
              onClick={() => handleSkip(5)}
              disabled={!hasValidVideoUrl}
              className="h-8 w-8 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
              title="Forward 5s (Right Arrow)"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={handleToggleMute}
                className="h-8 w-8 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1.5 rounded-full bg-slate-800 accent-pink-500 cursor-pointer hidden sm:block"
                title="Volume"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-xs font-mono text-slate-300 flex items-center gap-1">
              <span className="font-semibold text-white">{formatTime(currentTime)}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Subtitles, Speed, Download, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Subtitles Toggle */}
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showSubtitles 
                  ? 'bg-pink-500/30 border border-pink-500 text-pink-200' 
                  : 'hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
              title="Toggle Subtitles / Captions"
            >
              <Subtitles className="h-4 w-4" />
              <span className="hidden sm:inline">CC</span>
            </button>

            {/* Playback Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="h-8 px-2.5 rounded-lg hover:bg-white/10 text-xs font-mono font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Playback Speed"
              >
                <span>{playbackSpeed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-10 right-0 rounded-xl bg-slate-900 border border-pink-500/30 p-1 shadow-2xl z-30 flex flex-col space-y-0.5">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setPlaybackSpeed(s);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-mono text-left transition-colors cursor-pointer ${
                        playbackSpeed === s ? 'bg-pink-600 font-bold text-white' : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Download Button */}
            {hasValidVideoUrl && (
              <button
                onClick={handleDownloadVideo}
                className="h-8 px-2.5 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-pink-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download Master .MP4 Video"
              >
                <Download className="h-3.5 w-3.5 text-pink-400" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={handleToggleFullscreen}
              className="h-8 w-8 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
