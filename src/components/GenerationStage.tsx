import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, 
  ArrowRight, 
  Tv, 
  Sparkles, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { Project, VideoVariation } from '../types/cinegen';
import { VideoPlayer } from './VideoPlayer';
import { VideoApiService, VideoTaskResponse } from '../services/videoApiService';
import { audioEngine } from '../services/audioEngine';

interface GenerationStageProps {
  project: Project;
  taskId?: string;
  onProceed: () => void;
  onUpdateProject: (updated: Partial<Project>) => void;
  onCancel?: () => void;
}

export const GenerationStage: React.FC<GenerationStageProps> = ({
  project,
  taskId,
  onProceed,
  onUpdateProject,
  onCancel,
}) => {
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(project.renderProgress || 10);
  const [statusMessage, setStatusMessage] = useState<string>(
    project.statusMessage || 'Generating realistic video frames...'
  );
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [estimatedRemainingSec, setEstimatedRemainingSec] = useState<number>(35);
  const [isCompleted, setIsCompleted] = useState<boolean>(Boolean(project.videoUrl));
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | undefined>(project.videoUrl);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([
    'Initializing Cinegen AI Video Diffusion Pipeline...',
    `Target Model: ${project.aiModel || 'MiniMax Video-01'}`,
    `Prompt: "${project.prompt.slice(0, 60)}..."`,
    'Generating realistic video frames...',
  ]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Poll video status if taskId is provided
  useEffect(() => {
    if (!taskId) return;

    abortControllerRef.current = new AbortController();

    const startPolling = async () => {
      try {
        const result = await VideoApiService.pollVideoUntilComplete(
          taskId,
          (statusUpdate: VideoTaskResponse) => {
            setProgressPct(statusUpdate.progress);
            if (statusUpdate.message) {
              setStatusMessage(statusUpdate.message);
              setLogs((prev) => {
                if (prev[prev.length - 1] !== statusUpdate.message) {
                  return [...prev, statusUpdate.message];
                }
                return prev;
              });
            }
            if (statusUpdate.elapsedSec !== undefined) {
              setElapsedSec(statusUpdate.elapsedSec);
              setEstimatedRemainingSec(Math.max(0, 45 - statusUpdate.elapsedSec));
            }
          },
          abortControllerRef.current?.signal,
          1800
        );

        if (result.status === 'completed' && result.videoUrl) {
          setIsCompleted(true);
          setCurrentVideoUrl(result.videoUrl);
          setProgressPct(100);
          setStatusMessage('Photorealistic video rendered successfully!');
          audioEngine.playSFX('chime');

          // Update project with generated video URL
          onUpdateProject({
            videoUrl: result.videoUrl,
            renderProgress: 100,
            generationStatus: 'completed',
            statusMessage: 'Ready for playback and export',
          });

          // Also update selected variation if exists
          if (project.variations && project.variations.length > 0) {
            const updatedVariations: VideoVariation[] = project.variations.map((v) => ({
              ...v,
              videoUrl: result.videoUrl,
            }));
            onUpdateProject({ variations: updatedVariations });
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown generation error';
        if (message !== 'Video generation was canceled.') {
          setGenerationError(message);
          setStatusMessage('Rendering error encountered.');
        }
      }
    };

    startPolling();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [taskId]);

  // Elapsed timer tick
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
      setEstimatedRemainingSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted]);

  const handleCancelClick = () => {
    if (taskId) {
      VideoApiService.cancelTask(taskId).catch(() => {});
    }
    abortControllerRef.current?.abort();
    audioEngine.playSFX('click');
    onCancel?.();
  };

  return (
    <div className="mx-auto max-w-6xl py-4 sm:py-6 space-y-6">
      {/* Top Banner with Real-Time Rendering Status */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-950/30 via-slate-900 to-slate-950 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          {/* Animated Circular Progress Indicator */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-950/60 border border-pink-500/40 shadow-inner">
            {isCompleted ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-400 animate-pulse" />
            ) : generationError ? (
              <XCircle className="h-7 w-7 text-rose-400" />
            ) : (
              <div className="relative flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-3 border-pink-500/25 border-t-pink-500 animate-spin" />
                <span className="absolute font-mono text-[11px] font-bold text-white">
                  {progressPct}%
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                {isCompleted 
                  ? 'High-Fidelity Master Video Synthesized!' 
                  : generationError 
                  ? 'Rendering Issue Encountered' 
                  : 'Generating realistic video frames...'}
              </h2>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold border ${
                isCompleted 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
              }`}>
                {isCompleted ? 'READY FOR PLAYBACK' : `${progressPct}% COMPLETE`}
              </span>
            </div>
            
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span className="text-pink-300 font-semibold">{statusMessage}</span>
              {!isCompleted && !generationError && (
                <span className="text-slate-400 hidden sm:inline">
                  • Elapsed: {elapsedSec}s (ETA: ~{estimatedRemainingSec}s)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {!isCompleted && (
            <button
              onClick={handleCancelClick}
              className="btn-cine-secondary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold hover:border-rose-500/50 hover:text-rose-300 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          )}

          <button
            onClick={onProceed}
            className="btn-cine-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <span>{isCompleted ? 'Choose Voice & Narration' : 'Inspect Timeline & Variations'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Player on Left, Live Progress & Terminal Logs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Video Player Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Tv className="h-4 w-4 text-pink-400" />
              <span>{isCompleted ? 'Generated MP4 Video Player' : 'Live Diffusion Preview'}</span>
            </h3>
            <span className="text-[11px] font-mono text-pink-400 flex items-center gap-1 font-semibold">
              <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />
              {(currentVideoUrl || project.videoUrl) ? 'HTML5 MP4 Stream' : 'Generating Frames...'}
            </span>
          </div>

          <VideoPlayer
            project={{ ...project, videoUrl: currentVideoUrl || project.videoUrl }}
            videoUrl={currentVideoUrl || project.videoUrl}
            isGenerating={!isCompleted && !currentVideoUrl && !project.videoUrl}
            generationProgress={progressPct}
            generationMessage={statusMessage}
            currentSegmentIndex={activeSceneIdx}
            onSegmentChange={setActiveSceneIdx}
            onUpdateProject={onUpdateProject}
            autoPlay={isCompleted}
          />
        </div>

        {/* Right Column: Rendering Tasks & Live Terminal */}
        <div className="lg:col-span-5 space-y-4">
          {/* Step-by-Step Progress Card */}
          <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-4 shadow-md bg-slate-900/80">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-pink-400" />
                <span>Diffusion Pipeline Tasks</span>
              </h4>
              <span className="text-[11px] font-mono text-pink-300 font-bold">
                {project.aiModel || 'MiniMax Video-01'}
              </span>
            </div>

            <div className="space-y-3">
              {[
                { 
                  label: 'Cinematic Prompt Conditioning & Motion Vectoring', 
                  done: progressPct >= 20, 
                  pct: Math.min(100, Math.max(0, Math.floor(progressPct * 3.5))) 
                },
                { 
                  label: 'Latent Keyframe Diffusion & Optical Consistency', 
                  done: progressPct >= 60, 
                  pct: Math.min(100, Math.max(0, Math.floor((progressPct - 20) * 2))) 
                },
                { 
                  label: 'High-Fidelity Texture & Lighting Synthesis', 
                  done: progressPct >= 85, 
                  pct: Math.min(100, Math.max(0, Math.floor((progressPct - 50) * 2.5))) 
                },
                { 
                  label: 'Master MP4 Video Container Finalization', 
                  done: progressPct >= 100, 
                  pct: progressPct >= 90 ? 100 : Math.max(0, Math.floor((progressPct - 75) * 4)) 
                },
              ].map((task, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${task.done ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {task.done ? '✓ ' : '• '} {task.label}
                    </span>
                    <span className="font-mono text-[11px] text-pink-400 font-bold">{task.pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-pink-500/10">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${task.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Timers metadata */}
            <div className="pt-2 border-t border-pink-500/15 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-pink-400" />
                Elapsed: {elapsedSec}s
              </span>
              <span>ETA: ~{isCompleted ? '0s' : `${estimatedRemainingSec}s`}</span>
            </div>
          </div>

          {/* Terminal Console Logs */}
          <div className="glass-panel p-4 rounded-2xl border border-pink-500/20 font-mono text-[11px] space-y-2 bg-slate-950/90 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-pink-500/15 text-slate-400">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                <span className="text-pink-300 font-semibold">CINEGEN DIFFUSION CONSOLE</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30">
                {isCompleted ? 'COMPLETED' : 'RENDERING'}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {logs.map((log, idx) => (
                <div key={idx} className="text-slate-300 flex items-start gap-1.5">
                  <span className="text-pink-400 select-none font-bold">&gt;</span>
                  <span className="leading-tight">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationStage;
