import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ArrowRight, 
  Tv, 
  Box
} from 'lucide-react';
import { Project } from '../types/cinegen';
import { VideoPlayer } from './VideoPlayer';

interface GenerationStageProps {
  project: Project;
  onProceed: () => void;
  onUpdateProject: (updated: Partial<Project>) => void;
}

export const GenerationStage: React.FC<GenerationStageProps> = ({
  project,
  onProceed,
  onUpdateProject,
}) => {
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(75);
  const [logs, setLogs] = useState<string[]>([
    'Initializing Cinegen Realistic 3D Autonomous WebGL Pipeline...',
    'Compiling Three.js Physically-Based Rendering (PBR) Shaders... DONE',
    'Synthesizing Shot 1: Macro 3D Espresso Liquid & Floating Beans... DONE',
    'Synthesizing Shot 2: Ethiopian Highlands Procedural 3D Terrain... DONE',
    'Synthesizing Shot 3: Arabian Stone Monastery & 3D Brass Lanterns... DONE',
    'Synthesizing Shot 4: London 1652 Tavern & Candlelit 3D Atmosphere...',
  ]);

  // Simulate progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgressPct((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const next = prev + 5;
        if (next === 85) {
          setLogs((l) => [...l, 'Calculating 3D Spline Camera Trajectories & Depth of Field... DONE']);
          setActiveSceneIdx(4);
        } else if (next === 95) {
          setLogs((l) => [...l, 'Mastering 60 FPS 3D Stream & Synchronized Narration... DONE']);
          setActiveSceneIdx(6);
        }
        return next;
      });
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-6xl py-4 sm:py-6 space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-pink-500/30 bg-pink-950/20 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/25 text-pink-400 border border-pink-500/40 shadow-md">
            <Box className="h-5 w-5 text-pink-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-white">
                {progressPct < 100 ? 'Synthesizing Realistic 3D Video Timeline...' : 'Realistic 3D Video Master Synthesized!'}
              </h2>
              <span className="rounded-full bg-pink-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-pink-300 border border-pink-500/30">
                {progressPct}% COMPLETE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live WebGL 3D preview active. You can inspect 3D scenes in real time while generation finalizes.
            </p>
          </div>
        </div>

        <button
          onClick={onProceed}
          className="btn-cine-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg shadow-pink-500/30"
        >
          <span>Choose Voice & Narration</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Side-by-Side: 3D Video Player Preview & Multi-Stage Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Tv className="h-4 w-4 text-pink-400" />
              <span>Realtime 3D WebGL Generated Video</span>
            </h3>
            <span className="text-[11px] font-mono text-pink-400 flex items-center gap-1 font-semibold">
              <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />
              60 FPS 3D Stream
            </span>
          </div>

          <VideoPlayer
            project={project}
            currentSegmentIndex={activeSceneIdx}
            onSegmentChange={setActiveSceneIdx}
            onUpdateProject={onUpdateProject}
            autoPlay={true}
          />
        </div>

        {/* Right: Pipeline Task Progress & Realtime Logs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Progress Breakdown */}
          <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-4 shadow-md">
            <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-pink-400" />
              <span>3D Pipeline Stage Breakdown</span>
            </h4>

            <div className="space-y-3.5">
              {[
                { label: '3D Geometry & PBR Textures Synthesis', status: 'done', pct: 100 },
                { label: '3D Camera Spline Trajectories & Motion', status: 'done', pct: 100 },
                { label: 'Volumetric Atmosphere & Particle Physics', status: progressPct > 80 ? 'done' : 'running', pct: progressPct > 80 ? 100 : 70 },
                { label: 'Synchronized Broadcast Audio & Subtitles', status: progressPct >= 100 ? 'done' : 'running', pct: progressPct },
              ].map((task, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{task.label}</span>
                    <span className="font-mono text-[11px] text-pink-400 font-bold">{task.pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-pink-500/10">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${task.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Console Logs */}
          <div className="glass-panel p-4 rounded-2xl border border-pink-500/20 font-mono text-[11px] space-y-2 bg-slate-950/90 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-pink-500/15 text-slate-400">
              <span className="text-pink-300 font-semibold">CINEGEN 3D AGENT TERMINAL</span>
              <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30">ONLINE</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {logs.map((log, idx) => (
                <div key={idx} className="text-slate-300 flex items-start gap-1.5">
                  <span className="text-pink-400 select-none font-bold">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
