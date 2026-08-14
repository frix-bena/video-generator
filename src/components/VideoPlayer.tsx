import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  FastForward, 
  Rewind, 
  Subtitles, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  Compass,
  Film,
  Box,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Project, SceneSegment, AspectRatio, CaptionStyle, Render3DMode } from '../types/cinegen';
import { Three3DRenderEngine } from '../services/three3dRenderEngine';
import { audioEngine } from '../services/audioEngine';
import { VOICES_LIBRARY } from '../data/voices';

interface VideoPlayerProps {
  project: Project;
  currentSegmentIndex: number;
  onSegmentChange?: (index: number) => void;
  onUpdateProject?: (updated: Partial<Project>) => void;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  project,
  currentSegmentIndex,
  onSegmentChange,
  onUpdateProject,
  autoPlay = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engine3DRef = useRef<Three3DRenderEngine | null>(null);

  // Determine active video URL (from project or selected variation)
  const activeVariation = project.variations?.find((v) => v.id === project.selectedVariationId);
  const activeVideoUrl = project.videoUrl || activeVariation?.videoUrl;

  // View mode: 'video' (HTML5 <video>) or '3d' (WebGL canvas)
  const [sourceMode, setSourceMode] = useState<'video' | '3d'>(activeVideoUrl ? 'video' : '3d');

  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [globalTime, setGlobalTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(project.targetDurationSec || 360);
  const [videoBuffered, setVideoBuffered] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || '16:9');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(project.captionStyle || 'documentary');
  const [render3DMode, setRender3DMode] = useState<Render3DMode>(project.render3DMode || 'cinematic_pbr');
  const [isInteractive3D, setIsInteractive3D] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [isCaptionMenuOpen, setIsCaptionMenuOpen] = useState<boolean>(false);

  // Synchronize sourceMode when activeVideoUrl changes
  useEffect(() => {
    if (activeVideoUrl) {
      setSourceMode('video');
    }
  }, [activeVideoUrl]);

  const totalDuration = sourceMode === 'video' && videoDuration > 0 ? videoDuration : (project.targetDurationSec || 360);
  const segments = project.segments || [];

  // Find active segment based on global time
  const currentSegment = segments.find(
    (seg) => globalTime >= seg.startTime && globalTime < seg.endTime
  ) || segments[segments.length - 1] || segments[0];

  const currentSegmentIdx = currentSegment ? currentSegment.index : 0;
  const timeInSegment = currentSegment ? globalTime - currentSegment.startTime : 0;

  // Initialize 3D Engine if canvas available
  useEffect(() => {
    if (canvas3DRef.current && !engine3DRef.current && sourceMode === '3d') {
      engine3DRef.current = new Three3DRenderEngine(canvas3DRef.current);
    }
  }, [sourceMode]);

  // Update 3D Interactive Mode
  useEffect(() => {
    if (engine3DRef.current && sourceMode === '3d') {
      engine3DRef.current.setInteractiveMode(isInteractive3D);
    }
  }, [isInteractive3D, sourceMode]);

  // Update 3D Render Mode
  useEffect(() => {
    if (engine3DRef.current && sourceMode === '3d') {
      engine3DRef.current.setRenderMode(render3DMode);
    }
  }, [render3DMode, sourceMode]);

  // Sync segment changes to parent if needed
  useEffect(() => {
    if (onSegmentChange && currentSegmentIdx !== currentSegmentIndex) {
      onSegmentChange(currentSegmentIdx);
    }
  }, [currentSegmentIdx, currentSegmentIndex, onSegmentChange]);

  // Voice lookup
  const selectedVoice = VOICES_LIBRARY.find((v) => v.id === project.selectedVoiceId) || VOICES_LIBRARY[0];

  // Speech Narration Trigger on Segment Transition (only in 3D Mode, or video mode if audio engine used)
  const lastSpokenSegmentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isPlaying && currentSegment && currentSegment.id !== lastSpokenSegmentIdRef.current && sourceMode === '3d') {
      lastSpokenSegmentIdRef.current = currentSegment.id;
      audioEngine.playSFX('whoosh');
      audioEngine.speakNarration(currentSegment.narration, selectedVoice);
    }
  }, [isPlaying, currentSegment, selectedVoice, sourceMode]);

  // Draw 2D Overlay (Lower Thirds, Vignette, Subtitles, Aspect guides)
  const draw2DOverlay = useCallback((
    seg: SceneSegment | undefined,
    currentTime: number,
    progress: number
  ) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!seg) return;

    // 1. Film Vignette
    ctx.save();
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.35,
      width / 2, height / 2, width * 0.75
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // 2. Broadcast Lower-Third Overlay (1.5s to 9.5s)
    if (currentTime >= 1.5 && currentTime <= 9.5 && seg.lowerThirdText) {
      const elapsed = currentTime - 1.5;
      const alpha = Math.min(elapsed / 0.6, 1);
      const slide = Math.min(elapsed / 0.8, 1);
      const xPos = 40 * slide;
      const yPos = height - 130;

      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.fillStyle = 'rgba(26, 10, 20, 0.9)';
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(xPos, yPos, 480, 68, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.roundRect(xPos, yPos, 6, 68, [12, 0, 0, 12]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Outfit", sans-serif';
      ctx.fillText(seg.title.toUpperCase(), xPos + 22, yPos + 26);

      ctx.fillStyle = '#fce7f3';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(seg.lowerThirdText, xPos + 22, yPos + 48);

      ctx.restore();
    }

    // 3. Captions
    if (captionStyle !== 'off' && seg.narration) {
      ctx.save();
      const words = seg.narration.split(' ');
      if (words.length > 0) {
        const activeIndex = Math.min(Math.floor(progress * words.length), words.length - 1);
        const chunkWindow = 7;
        const startIdx = Math.max(0, Math.floor(activeIndex / chunkWindow) * chunkWindow);
        const visibleWords = words.slice(startIdx, startIdx + chunkWindow);
        const captionY = height - 70;

        if (captionStyle === 'mrbeast') {
          ctx.font = '900 26px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          const phrase = visibleWords.join(' ');
          const totalWidth = ctx.measureText(phrase).width;
          let startX = (width - totalWidth) / 2;

          visibleWords.forEach((w, i) => {
            const globalWordIdx = startIdx + i;
            const isActive = globalWordIdx === activeIndex;
            const wWidth = ctx.measureText(w + ' ').width;

            ctx.fillStyle = isActive ? '#ec4899' : '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 5;
            ctx.strokeText(w, startX + wWidth / 2, captionY);
            ctx.fillText(w, startX + wWidth / 2, captionY);

            startX += wWidth;
          });
        } else if (captionStyle === 'documentary') {
          ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          const phrase = visibleWords.join(' ');
          const textWidth = ctx.measureText(phrase).width;

          ctx.fillStyle = 'rgba(20, 7, 16, 0.85)';
          ctx.beginPath();
          ctx.roundRect((width - textWidth - 36) / 2, captionY - 26, textWidth + 36, 38, 8);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(phrase, width / 2, captionY);
        } else if (captionStyle === 'neon') {
          ctx.font = '700 22px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          const phrase = visibleWords.join(' ');
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#f472b6';
          ctx.fillText(phrase, width / 2, captionY);
        } else if (captionStyle === 'netflix') {
          ctx.font = '600 21px "Inter", sans-serif';
          ctx.textAlign = 'center';
          const phrase = visibleWords.join(' ');
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.fillStyle = '#fce7f3';
          ctx.strokeText(phrase, width / 2, captionY);
          ctx.fillText(phrase, width / 2, captionY);
        }
      }
      ctx.restore();
    }

    // 4. Aspect ratio pillarboxes
    if (aspectRatio !== '16:9') {
      ctx.save();
      ctx.fillStyle = 'rgba(14, 4, 10, 0.95)';
      if (aspectRatio === '9:16') {
        const targetWidth = height * (9 / 16);
        const sideMargin = (width - targetWidth) / 2;
        ctx.fillRect(0, 0, sideMargin, height);
        ctx.fillRect(width - sideMargin, 0, sideMargin, height);
      } else if (aspectRatio === '1:1') {
        const sideMargin = (width - height) / 2;
        ctx.fillRect(0, 0, sideMargin, height);
        ctx.fillRect(width - sideMargin, 0, sideMargin, height);
      }
      ctx.restore();
    }
  }, [aspectRatio, captionStyle]);

  // Main 3D Engine Render Loop (Active in 3D Mode)
  useEffect(() => {
    if (sourceMode !== '3d') return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        setGlobalTime((prev) => {
          const next = prev + deltaSec * playbackSpeed;
          if (next >= totalDuration) {
            setIsPlaying(false);
            audioEngine.stopSpeaking();
            audioEngine.stopMusic();
            return 0;
          }
          return next;
        });
      }

      if (engine3DRef.current && currentSegment) {
        const segTime = Math.max(0, globalTime - currentSegment.startTime);
        const progress = Math.min(Math.max(segTime / (currentSegment.duration || 1), 0), 1);

        engine3DRef.current.renderFrame(currentSegment, segTime, globalTime, {
          captionStyle,
          aspectRatio,
          brightnessAdjustment: currentSegment.brightnessAdjustment || 0,
          showLowerThirds: true,
          render3DMode,
        });

        draw2DOverlay(currentSegment, segTime, progress);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [sourceMode, isPlaying, globalTime, currentSegment, playbackSpeed, totalDuration, captionStyle, aspectRatio, render3DMode, draw2DOverlay]);

  // HTML5 Video Event Handlers
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration || project.targetDurationSec || 6);
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.volume = isMuted ? 0 : volume;
      setIsVideoLoading(false);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && sourceMode === 'video') {
      const cur = videoRef.current.currentTime;
      setGlobalTime(cur);

      // Update buffered percent
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        const dur = videoRef.current.duration || 1;
        setVideoBuffered((bufferedEnd / dur) * 100);
      }

      // Draw 2D overlays on top of video
      if (currentSegment) {
        const segTime = Math.max(0, cur - currentSegment.startTime);
        const progress = Math.min(Math.max(segTime / (currentSegment.duration || 1), 0), 1);
        draw2DOverlay(currentSegment, segTime, progress);
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setGlobalTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Play / Pause handler
  const handleTogglePlay = useCallback(() => {
    if (sourceMode === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Video play error:', err);
        });
      }
      return;
    }

    // 3D Mode Play/Pause
    if (!isPlaying) {
      audioEngine.setMute(isMuted);
      audioEngine.startMusic(project.musicStyle || 'cinematic');
      if (currentSegment) {
        audioEngine.speakNarration(currentSegment.narration, selectedVoice);
      }
      setIsPlaying(true);
    } else {
      audioEngine.stopSpeaking();
      audioEngine.stopMusic();
      setIsPlaying(false);
    }
  }, [sourceMode, isPlaying, isMuted, project.musicStyle, currentSegment, selectedVoice]);

  // Jump to specific timestamp
  const handleSeek = (time: number) => {
    const clamped = Math.max(0, Math.min(time, totalDuration));
    setGlobalTime(clamped);

    if (sourceMode === 'video' && videoRef.current) {
      videoRef.current.currentTime = clamped;
    } else {
      audioEngine.stopSpeaking();
      lastSpokenSegmentIdRef.current = null;
      if (isPlaying) {
        const targetSeg = segments.find((s) => clamped >= s.startTime && clamped < s.endTime);
        if (targetSeg) {
          audioEngine.speakNarration(targetSeg.narration, selectedVoice);
        }
      }
    }
  };

  // Jump to next / previous scene
  const handleJumpScene = (direction: 'prev' | 'next') => {
    if (direction === 'next' && currentSegmentIdx < segments.length - 1) {
      const nextSeg = segments[currentSegmentIdx + 1];
      handleSeek(nextSeg.startTime);
    } else if (direction === 'prev') {
      if (timeInSegment > 3) {
        handleSeek(currentSegment.startTime);
      } else if (currentSegmentIdx > 0) {
        handleSeek(segments[currentSegmentIdx - 1].startTime);
      }
    }
  };

  // Speed changer
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Volume & Mute handlers
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    audioEngine.setMute(nextMuted);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Export / Download generated video
  const handleExportOrDownload = async () => {
    // If MP4 video is available, download directly!
    if (activeVideoUrl) {
      try {
        const response = await fetch(activeVideoUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_master.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {
        const a = document.createElement('a');
        a.href = activeVideoUrl;
        a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_master.mp4`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      audioEngine.playSFX('chime');
      return;
    }

    // Otherwise record 3D WebGL Canvas
    if (!canvas3DRef.current) return;
    setIsRecording(true);
    setRecordProgress(0);

    const stream = canvas3DRef.current.captureStream(60);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm',
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_3d_master.webm`;
      a.click();
      setIsRecording(false);
      audioEngine.playSFX('chime');
    };

    mediaRecorder.start();
    handleSeek(0);
    setIsPlaying(true);

    const recordTimer = setInterval(() => {
      setRecordProgress((p) => {
        if (p >= 100) {
          clearInterval(recordTimer);
          mediaRecorder.stop();
          setIsPlaying(false);
          return 100;
        }
        return p + 10;
      });
    }, 1200);
  };

  // Format time (mm:ss)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-col rounded-2xl overflow-hidden border border-pink-500/30 bg-slate-950 shadow-2xl shadow-black/90 group/player select-none"
    >
      {/* Video / 3D Canvas Visual Container */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        
        {/* Layer 1A: HTML5 <video> Element (Active when MP4 video is rendered) */}
        {sourceMode === 'video' && activeVideoUrl && (
          <video
            ref={videoRef}
            src={activeVideoUrl}
            playsInline
            crossOrigin="anonymous"
            loop={false}
            onLoadedMetadata={handleVideoLoadedMetadata}
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setIsVideoLoading(true)}
            onPlaying={() => setIsVideoLoading(false)}
            onClick={handleTogglePlay}
            className="h-full w-full object-contain cursor-pointer z-10"
          />
        )}

        {/* Layer 1B: Three.js 3D WebGL Canvas (Active when in 3D mode or when no MP4 URL) */}
        {sourceMode === '3d' && (
          <canvas
            ref={canvas3DRef}
            width={1280}
            height={720}
            className={`h-full w-full object-contain ${isInteractive3D ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
            onClick={!isInteractive3D ? handleTogglePlay : undefined}
          />
        )}

        {/* Fallback if in Video mode but URL is loading */}
        {sourceMode === 'video' && !activeVideoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6 space-y-3 z-10">
            <div className="h-10 w-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            <p className="text-sm font-bold text-white">Synthesizing High-Resolution MP4 Stream...</p>
            <p className="text-xs text-slate-400">Switching to 3D WebGL engine in the meantime.</p>
            <button
              onClick={() => setSourceMode('3d')}
              className="btn-cine-primary text-xs px-4 py-1.5 rounded-xl font-bold"
            >
              View 3D WebGL Engine
            </button>
          </div>
        )}

        {/* Layer 2: 2D Overlay Canvas (Captions, Lower-Thirds, Vignette) */}
        <canvas
          ref={overlayCanvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none z-15"
        />

        {/* Video Loading Spinner Overlay */}
        {isVideoLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-25 pointer-events-none">
            <div className="h-12 w-12 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin shadow-lg" />
          </div>
        )}

        {/* Top-Left: Mode & Cinema Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-20 pointer-events-auto">
          {sourceMode === 'video' && activeVideoUrl ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-emerald-300 border border-emerald-500/40 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>HTML5 MP4 VIDEO • HIGH FIDELITY</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-pink-300 border border-pink-500/30 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />
              <span>REALISTIC 3D MASTER • 60 FPS</span>
            </div>
          )}

          {/* Model info badge */}
          {(project.aiModel || activeVariation?.styleName) && (
            <div className="rounded-lg bg-black/80 backdrop-blur-md px-2 py-1 text-[11px] font-mono text-pink-200 border border-pink-500/30 shadow-lg hidden sm:block">
              {project.aiModel || activeVariation?.styleName || 'Cinema Master'}
            </div>
          )}
        </div>

        {/* Top-Right: Mode Switcher & Camera Orbit Controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          {/* Toggle between HTML5 MP4 Video & 3D WebGL Canvas */}
          {activeVideoUrl && (
            <div className="flex items-center rounded-xl bg-black/80 backdrop-blur-md border border-pink-500/30 p-0.5 shadow-lg">
              <button
                onClick={() => {
                  setSourceMode('video');
                  setIsPlaying(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  sourceMode === 'video'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View AI Generated .MP4 Video"
              >
                <Film className="h-3 w-3" />
                <span>AI Video (.MP4)</span>
              </button>
              <button
                onClick={() => {
                  setSourceMode('3d');
                  setIsPlaying(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  sourceMode === '3d'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View Interactive 3D WebGL Scene"
              >
                <Box className="h-3 w-3" />
                <span>3D WebGL</span>
              </button>
            </div>
          )}

          {/* Interactive 3D Orbit Camera Toggle (when in 3D mode) */}
          {sourceMode === '3d' && (
            <button
              onClick={() => setIsInteractive3D(!isInteractive3D)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold backdrop-blur-md border transition-all duration-200 ${
                isInteractive3D
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400 shadow-lg shadow-pink-500/30 font-bold'
                  : 'bg-black/80 hover:bg-slate-900 text-slate-200 border-pink-500/20'
              }`}
              title="Toggle between Directed Camera and Interactive 3D Free-Orbit Inspection"
            >
              <Compass className={`h-3.5 w-3.5 ${isInteractive3D ? 'animate-spin text-white' : 'text-pink-400'}`} />
              <span>{isInteractive3D ? '🕹️ 3D Orbit' : '🎬 Directed'}</span>
            </button>
          )}

          <div className="rounded-xl bg-pink-950/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-pink-200 border border-pink-500/40 shadow-lg hidden md:block">
            Scene {currentSegmentIdx + 1} / {segments.length}: {currentSegment?.title.split(':')[1] || currentSegment?.title || 'Main Timeline'}
          </div>
        </div>

        {/* Interactive 3D Orbit Tip Toast */}
        {sourceMode === '3d' && isInteractive3D && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-pink-500/40 rounded-full px-4 py-1 text-xs text-pink-200 shadow-xl flex items-center gap-2 pointer-events-none animate-pulse z-20">
            <Compass className="h-3.5 w-3.5 text-pink-400" />
            <span>Click & drag to rotate 3D angle • Scroll to zoom</span>
          </div>
        )}

        {/* Big Center Play/Pause Button on Hover */}
        {!isPlaying && !isInteractive3D && (
          <div 
            onClick={handleTogglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px] cursor-pointer transition-opacity z-20 group-hover/player:bg-black/25"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-2xl shadow-pink-500/50 hover:scale-110 transition-transform duration-200 ring-4 ring-pink-500/20">
              <Play className="h-9 w-9 translate-x-0.5 fill-white" />
            </div>
          </div>
        )}

        {/* Recording Overlay Indicator */}
        {isRecording && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-30">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-4 w-4 rounded-full bg-rose-500 animate-ping" />
              <span className="text-lg font-bold text-white font-display">Encoding Master Video File...</span>
            </div>
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-pink-500/20">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 transition-all duration-300"
                style={{ width: `${recordProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">{recordProgress}% completed</p>
          </div>
        )}
      </div>

      {/* Directing & Timeline Bar */}
      <div className="bg-slate-900/95 px-4 pt-3 pb-2 border-t border-pink-500/20">
        {/* Visual Segment Slices / Buffered Bar */}
        <div className="relative mb-2">
          <div className="flex h-3 w-full gap-1 rounded-full overflow-hidden bg-slate-950 p-0.5 border border-pink-500/20 relative">
            {/* Background buffered track (for HTML5 video) */}
            {sourceMode === 'video' && videoBuffered > 0 && (
              <div 
                className="absolute top-0 left-0 h-full bg-pink-900/40 rounded-full transition-all duration-300 pointer-events-none"
                style={{ width: `${videoBuffered}%` }}
              />
            )}

            {segments.map((seg, i) => {
              const segPct = (seg.duration / totalDuration) * 100;
              const isCurrent = currentSegmentIdx === i;
              const isPast = globalTime >= seg.endTime;
              const isInProgress = globalTime >= seg.startTime && globalTime < seg.endTime;
              const segProgress = isInProgress ? (globalTime - seg.startTime) / seg.duration : isPast ? 1 : 0;

              return (
                <div
                  key={seg.id}
                  onClick={() => handleSeek(seg.startTime)}
                  style={{ width: `${segPct}%` }}
                  title={`${seg.title} (${formatTime(seg.startTime)} - ${formatTime(seg.endTime)})`}
                  className={`relative h-full cursor-pointer transition-all hover:brightness-125 z-10 ${
                    isCurrent ? 'ring-1 ring-pink-400' : ''
                  }`}
                >
                  <div className="h-full w-full bg-slate-800/80 rounded-sm overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        isCurrent 
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500' 
                          : isPast 
                          ? 'bg-pink-700/60' 
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${segProgress * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Draggable Playhead Slider */}
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.05}
            value={globalTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="absolute -top-1.5 left-0 w-full h-6 opacity-0 cursor-pointer z-30"
          />
        </div>

        {/* Player Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Left Controls (Play, Prev, Next, Time) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleJumpScene('prev')}
              className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Previous Scene"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleSeek(globalTime - 10)}
              className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Rewind 10s"
            >
              <Rewind className="h-4 w-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 hover:from-rose-500 hover:to-pink-600 text-white shadow-md shadow-pink-500/30 transition-transform active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 translate-x-0.5 fill-white" />}
            </button>

            <button
              onClick={() => handleSeek(globalTime + 10)}
              className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fast Forward 10s"
            >
              <FastForward className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleJumpScene('next')}
              className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Next Scene"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Timecode */}
            <div className="ml-2 font-mono text-xs text-slate-300">
              <span className="text-white font-semibold">{formatTime(globalTime)}</span>
              <span className="text-slate-500"> / {formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Right Controls (Shaders/Format, Speed, Aspect, Captions, Volume, Fullscreen, Export) */}
          <div className="flex items-center gap-2">
            {/* 3D Render Shading Mode Selector (when in 3D mode) */}
            {sourceMode === '3d' && (
              <div className="flex items-center rounded-xl bg-slate-800 border border-pink-500/20 p-0.5">
                {(['cinematic_pbr', 'wireframe', 'clay_model'] as Render3DMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setRender3DMode(mode);
                      onUpdateProject?.({ render3DMode: mode });
                    }}
                    className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all duration-200 ${
                      render3DMode === mode ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={`3D Shading Mode: ${mode}`}
                  >
                    {mode === 'cinematic_pbr' ? '3D PBR' : mode === 'wireframe' ? 'Wireframe' : 'Clay'}
                  </button>
                ))}
              </div>
            )}

            {/* Playback Speed Selector */}
            <select
              value={playbackSpeed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="rounded-xl bg-slate-800 border border-pink-500/20 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>

            {/* Aspect Ratio Switcher */}
            <div className="flex items-center rounded-xl bg-slate-800 border border-pink-500/20 p-0.5 hidden sm:flex">
              {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
                <button
                  key={ar}
                  onClick={() => {
                    setAspectRatio(ar);
                    onUpdateProject?.({ aspectRatio: ar });
                  }}
                  className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all duration-200 ${
                    aspectRatio === ar ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>

            {/* Captions Style Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCaptionMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs transition-colors ${
                  isCaptionMenuOpen 
                    ? 'bg-pink-500/25 border-pink-500 text-pink-200 shadow-sm' 
                    : 'bg-slate-800 border-pink-500/20 text-slate-200 hover:bg-slate-700'
                }`}
                title="Captions Style (Click to change)"
              >
                <Subtitles className="h-3.5 w-3.5 text-pink-400" />
                <span className="capitalize text-[11px] font-semibold">{captionStyle}</span>
              </button>
              {isCaptionMenuOpen && (
                <div 
                  className="absolute right-0 bottom-full mb-1 flex flex-col rounded-xl bg-slate-900/95 border border-pink-500/30 p-1 shadow-2xl z-30 min-w-[130px] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setIsCaptionMenuOpen(false)}
                >
                  {(['documentary', 'mrbeast', 'netflix', 'neon', 'off'] as CaptionStyle[]).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => {
                        setCaptionStyle(style);
                        onUpdateProject?.({ captionStyle: style });
                        setIsCaptionMenuOpen(false);
                      }}
                      className={`rounded-lg px-2.5 py-1.5 text-left text-xs capitalize transition-colors ${
                        captionStyle === style ? 'bg-pink-600 text-white font-bold' : 'text-slate-300 hover:bg-pink-950/60 hover:text-white'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-pink-500/20 rounded-xl px-2 py-1">
              <button
                onClick={handleToggleMute}
                className="text-slate-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-pink-400" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-14 h-1 accent-pink-500 bg-slate-700 rounded-lg cursor-pointer hidden md:block"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>

            {/* Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            {/* Export / Download Master Video Button */}
            <button
              onClick={handleExportOrDownload}
              disabled={isRecording}
              className="btn-cine-primary flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-md shadow-pink-500/30 hover:scale-[1.02] transition-transform"
              title={activeVideoUrl ? 'Download Generated .MP4 Video' : 'Export 3D Master Video (.WebM)'}
            >
              <Download className="h-3.5 w-3.5 text-white" />
              <span>{activeVideoUrl ? 'Download .MP4' : 'Export 3D'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
