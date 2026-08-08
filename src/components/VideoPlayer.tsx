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
  Compass
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
  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engine3DRef = useRef<Three3DRenderEngine | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [globalTime, setGlobalTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || '16:9');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(project.captionStyle || 'documentary');
  const [render3DMode, setRender3DMode] = useState<Render3DMode>(project.render3DMode || 'cinematic_pbr');
  const [isInteractive3D, setIsInteractive3D] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);

  const totalDuration = project.targetDurationSec || 360;
  const segments = project.segments || [];

  // Find active segment based on global time
  const currentSegment = segments.find(
    (seg) => globalTime >= seg.startTime && globalTime < seg.endTime
  ) || segments[segments.length - 1] || segments[0];

  const currentSegmentIdx = currentSegment ? currentSegment.index : 0;
  const timeInSegment = currentSegment ? globalTime - currentSegment.startTime : 0;

  // Initialize 3D Engine
  useEffect(() => {
    if (canvas3DRef.current && !engine3DRef.current) {
      engine3DRef.current = new Three3DRenderEngine(canvas3DRef.current);
    }
  }, []);

  // Update 3D Interactive Mode
  useEffect(() => {
    if (engine3DRef.current) {
      engine3DRef.current.setInteractiveMode(isInteractive3D);
    }
  }, [isInteractive3D]);

  // Update 3D Render Mode
  useEffect(() => {
    if (engine3DRef.current) {
      engine3DRef.current.setRenderMode(render3DMode);
    }
  }, [render3DMode]);

  // Sync segment changes to parent if needed
  useEffect(() => {
    if (onSegmentChange && currentSegmentIdx !== currentSegmentIndex) {
      onSegmentChange(currentSegmentIdx);
    }
  }, [currentSegmentIdx, currentSegmentIndex, onSegmentChange]);

  // Voice lookup
  const selectedVoice = VOICES_LIBRARY.find((v) => v.id === project.selectedVoiceId) || VOICES_LIBRARY[0];

  // Speech Narration Trigger on Segment Transition
  const lastSpokenSegmentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isPlaying && currentSegment && currentSegment.id !== lastSpokenSegmentIdRef.current) {
      lastSpokenSegmentIdRef.current = currentSegment.id;
      audioEngine.playSFX('whoosh');
      audioEngine.speakNarration(currentSegment.narration, selectedVoice);
    }
  }, [isPlaying, currentSegment, selectedVoice]);

  // Draw 2D Overlay (Lower Thirds, Vignette, Subtitles, Aspect guides)
  const draw2DOverlay = useCallback((
    seg: SceneSegment,
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

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(xPos, yPos, 480, 68, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.roundRect(xPos, yPos, 6, 68, [12, 0, 0, 12]);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px "Outfit", sans-serif';
      ctx.fillText(seg.title.toUpperCase(), xPos + 22, yPos + 26);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(seg.lowerThirdText, xPos + 22, yPos + 48);

      ctx.restore();
    }

    // 3. Captions
    if (captionStyle !== 'off') {
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
          let totalWidth = ctx.measureText(phrase).width;
          let startX = (width - totalWidth) / 2;

          visibleWords.forEach((w, i) => {
            const globalWordIdx = startIdx + i;
            const isActive = globalWordIdx === activeIndex;
            const wWidth = ctx.measureText(w + ' ').width;

            ctx.fillStyle = isActive ? '#fbbf24' : '#ffffff';
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

          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.beginPath();
          ctx.roundRect((width - textWidth - 36) / 2, captionY - 26, textWidth + 36, 38, 8);
          ctx.fill();

          ctx.fillStyle = '#f8fafc';
          ctx.fillText(phrase, width / 2, captionY);
        } else if (captionStyle === 'neon') {
          ctx.font = '700 22px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          const phrase = visibleWords.join(' ');
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#22d3ee';
          ctx.fillText(phrase, width / 2, captionY);
        } else if (captionStyle === 'netflix') {
          ctx.font = '600 21px "Inter", sans-serif';
          ctx.textAlign = 'center';
          const phrase = visibleWords.join(' ');
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.fillStyle = '#fbbf24';
          ctx.strokeText(phrase, width / 2, captionY);
          ctx.fillText(phrase, width / 2, captionY);
        }
      }
      ctx.restore();
    }

    // 4. Aspect ratio pillarboxes
    if (aspectRatio !== '16:9') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
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

  // Main 60fps Render & Playback Loop
  useEffect(() => {
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
  }, [isPlaying, globalTime, currentSegment, playbackSpeed, totalDuration, captionStyle, aspectRatio, render3DMode, draw2DOverlay]);

  // Play / Pause handler
  const handleTogglePlay = useCallback(() => {
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
  }, [isPlaying, isMuted, project.musicStyle, currentSegment, selectedVoice]);

  // Jump to specific timestamp
  const handleSeek = (time: number) => {
    const clamped = Math.max(0, Math.min(time, totalDuration));
    setGlobalTime(clamped);
    audioEngine.stopSpeaking();
    lastSpokenSegmentIdRef.current = null;
    if (isPlaying) {
      const targetSeg = segments.find((s) => clamped >= s.startTime && clamped < s.endTime);
      if (targetSeg) {
        audioEngine.speakNarration(targetSeg.narration, selectedVoice);
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

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // MediaRecorder export: Record realistic 3D video directly from WebGL canvas
  const handleExportRecording = () => {
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
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-col rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-950 shadow-2xl shadow-black/90 group/player"
    >
      {/* 3D Realistic Video Canvas Container */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {/* Layer 1: 3D Three.js WebGL Canvas */}
        <canvas
          ref={canvas3DRef}
          width={1280}
          height={720}
          className={`h-full w-full object-contain ${isInteractive3D ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
          onClick={!isInteractive3D ? handleTogglePlay : undefined}
        />

        {/* Layer 2: 2D Overlay Canvas (Captions, Lower-Thirds, Vignette) */}
        <canvas
          ref={overlayCanvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        />

        {/* Top-Left: Realistic 3D Cinema Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-20">
          <div className="flex items-center gap-1.5 rounded-md bg-black/75 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-amber-400 border border-amber-500/30 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>REALISTIC 3D MASTER • 60 FPS</span>
          </div>
          <div className="rounded-md bg-black/75 backdrop-blur-md px-2 py-1 text-[11px] font-mono text-indigo-300 border border-indigo-500/30 shadow-lg hidden sm:block">
            {currentSegment?.camera3D?.lensPreset || currentSegment?.shotType.split('•')[1] || '50mm Cinema Prime'}
          </div>
        </div>

        {/* Top-Right: Scene Title & 3D Interactive Mode Toggle */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          {/* Interactive 3D Camera Toggle Button */}
          <button
            onClick={() => setIsInteractive3D(!isInteractive3D)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold backdrop-blur-md border transition-all ${
              isInteractive3D
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30 font-bold'
                : 'bg-black/75 hover:bg-slate-900 text-slate-300 border-white/20'
            }`}
            title="Toggle between Directed Camera and Interactive 3D Free-Orbit Inspection"
          >
            <Compass className={`h-3.5 w-3.5 ${isInteractive3D ? 'animate-spin' : ''}`} />
            <span>{isInteractive3D ? '🕹️ 3D Orbit Active' : '🎬 Directed 3D Camera'}</span>
          </button>

          <div className="rounded-md bg-indigo-950/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-500/40 shadow-lg hidden md:block">
            Scene {currentSegmentIdx + 1} / {segments.length}: {currentSegment?.title.split(':')[1] || currentSegment?.title}
          </div>
        </div>

        {/* Interactive 3D Orbit Tip Toast (Shown when interactive 3D enabled) */}
        {isInteractive3D && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-amber-500/40 rounded-full px-4 py-1 text-xs text-amber-300 shadow-xl flex items-center gap-2 pointer-events-none animate-pulse z-20">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span>Click & drag to rotate 3D angle • Scroll to zoom</span>
          </div>
        )}

        {/* Big Center Play/Pause Button on Hover */}
        {!isPlaying && !isInteractive3D && (
          <div 
            onClick={handleTogglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer transition-opacity z-10"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-2xl shadow-indigo-500/50 hover:scale-110 transition-transform">
              <Play className="h-9 w-9 translate-x-0.5 fill-white" />
            </div>
          </div>
        )}

        {/* Recording Overlay Indicator */}
        {isRecording && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-30">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-4 w-4 rounded-full bg-red-500 animate-ping" />
              <span className="text-lg font-bold text-white font-display">Rendering Realistic 3D Master Video...</span>
            </div>
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-300"
                style={{ width: `${recordProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">{recordProgress}% completed</p>
          </div>
        )}
      </div>

      {/* 3D Scene Directing & Timeline Bar */}
      <div className="bg-slate-900/95 px-4 pt-3 pb-2 border-t border-white/10">
        {/* Visual Segment Slices */}
        <div className="relative mb-2">
          <div className="flex h-3 w-full gap-1 rounded-full overflow-hidden bg-slate-950 p-0.5 border border-white/10">
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
                  title={`${seg.title} (${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}) • 3D: ${seg.camera3D?.trajectory || 'Directed'}`}
                  className={`relative h-full cursor-pointer transition-all hover:brightness-125 ${
                    isCurrent ? 'ring-1 ring-indigo-400' : ''
                  }`}
                >
                  <div className="h-full w-full bg-slate-800/80 rounded-sm overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        isCurrent 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                          : isPast 
                          ? 'bg-indigo-700/60' 
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
            step={0.1}
            value={globalTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="absolute -top-1.5 left-0 w-full h-6 opacity-0 cursor-pointer z-20"
          />
        </div>

        {/* Player Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Left Controls (Play, Prev, Next, Time) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleJumpScene('prev')}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Previous Scene"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleSeek(globalTime - 10)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Rewind 10s"
            >
              <Rewind className="h-4 w-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-transform active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 translate-x-0.5 fill-white" />}
            </button>

            <button
              onClick={() => handleSeek(globalTime + 10)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fast Forward 10s"
            >
              <FastForward className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleJumpScene('next')}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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

          {/* Right Controls (3D Shaders, Speed, Aspect, Captions, Volume, Fullscreen) */}
          <div className="flex items-center gap-2">
            {/* 3D Render Shading Mode Selector */}
            <div className="flex items-center rounded-lg bg-slate-800 border border-white/10 p-0.5">
              {(['cinematic_pbr', 'wireframe', 'clay_model'] as Render3DMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setRender3DMode(mode);
                    onUpdateProject?.({ render3DMode: mode });
                  }}
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                    render3DMode === mode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`3D Shading Mode: ${mode}`}
                >
                  {mode === 'cinematic_pbr' ? '3D PBR' : mode === 'wireframe' ? 'Wireframe' : 'Clay'}
                </button>
              ))}
            </div>

            {/* Playback Speed */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="rounded-lg bg-slate-800 border border-white/10 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>

            {/* Aspect Ratio Switcher */}
            <div className="flex items-center rounded-lg bg-slate-800 border border-white/10 p-0.5 hidden sm:flex">
              {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
                <button
                  key={ar}
                  onClick={() => {
                    setAspectRatio(ar);
                    onUpdateProject?.({ aspectRatio: ar });
                  }}
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                    aspectRatio === ar ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>

            {/* Captions Style Switcher */}
            <div className="relative group">
              <button
                className="flex items-center gap-1 rounded-lg bg-slate-800 border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                title="Captions Style"
              >
                <Subtitles className="h-3.5 w-3.5 text-indigo-400" />
                <span className="capitalize text-[11px]">{captionStyle}</span>
              </button>
              <div className="absolute right-0 bottom-full mb-1 hidden group-hover:flex flex-col rounded-lg bg-slate-900 border border-white/10 p-1 shadow-xl z-30 min-w-[120px]">
                {(['documentary', 'mrbeast', 'netflix', 'neon', 'off'] as CaptionStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => {
                      setCaptionStyle(style);
                      onUpdateProject?.({ captionStyle: style });
                    }}
                    className={`rounded px-2 py-1 text-left text-xs capitalize hover:bg-indigo-600 hover:text-white ${
                      captionStyle === style ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Toggle */}
            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                audioEngine.setMute(nextMuted);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            {/* Export 3D Video Button */}
            <button
              onClick={handleExportRecording}
              disabled={isRecording}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 px-2.5 py-1 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/30"
              title="Export 3D Master Video (.WebM / .MP4)"
            >
              <Download className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden sm:inline">Export 3D Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
