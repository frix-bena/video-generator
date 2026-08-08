import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Camera, 
  Sun, 
  Eye, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Palette, 
  SlidersHorizontal,
  ChevronRight,
  Box,
  Compass
} from 'lucide-react';
import { Project, SceneSegment } from '../types/cinegen';
import { audioEngine } from '../services/audioEngine';

interface StoryboardStageProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
  onProceed: () => void;
  onSelectSceneForPreview?: (index: number) => void;
}

export const StoryboardStage: React.FC<StoryboardStageProps> = ({
  project,
  onUpdateProject,
  onProceed,
  onSelectSceneForPreview,
}) => {
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const handleRegenerateShot = (index: number) => {
    setRegeneratingIndex(index);
    audioEngine.playSFX('whoosh');
    setTimeout(() => {
      setRegeneratingIndex(null);
      audioEngine.playSFX('chime');
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-6xl py-6 px-4 sm:px-6 space-y-6">
      {/* 3D Visual Continuity Matrix Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Box className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white">
                  Realistic 3D Storyboard & Camera Rig Matrix
                </h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  3D PBR LOCKED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Guarantees 3D camera trajectory paths, physically-based materials, and consistent volumetric lighting across all scenes.
              </p>
            </div>
          </div>

          {/* Color Grade & 3D Shaders Swatches */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 px-3.5 py-2 border border-white/10">
            <Palette className="h-4 w-4 text-amber-400" />
            <div className="text-left">
              <p className="text-[10px] text-slate-400 uppercase font-mono">Master 3D LUT</p>
              <p className="text-xs font-semibold text-slate-200">{project.colorGrade.split('•')[0]}</p>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <span className="h-4 w-4 rounded-full bg-amber-600 border border-white/20 shadow-sm" title="Amber Highlight" />
              <span className="h-4 w-4 rounded-full bg-amber-900 border border-white/20 shadow-sm" title="Warm Midtone" />
              <span className="h-4 w-4 rounded-full bg-slate-900 border border-white/20 shadow-sm" title="Deep Shadow" />
            </div>
          </div>
        </div>
      </div>

      {/* Storyboard Grid Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-indigo-400" />
            <span>3D Shot Compositions & Motion Trajectories</span>
          </h2>
          <p className="text-xs text-slate-400">
            Preview 3D camera spline movements, PBR textures, and volumetric particle atmosphere before rendering.
          </p>
        </div>

        <button
          onClick={onProceed}
          className="btn-cine-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg shadow-indigo-600/30"
        >
          <span>Render 3D Master Video</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* 8-Scene Storyboard Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {project.segments.map((seg, idx) => {
          const isRegen = regeneratingIndex === idx;

          return (
            <div
              key={seg.id}
              className="glass-card rounded-xl border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all"
            >
              <div>
                {/* Visual Preview Frame */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <div 
                    className={`h-full w-full bg-gradient-to-br transition-all duration-500 flex items-center justify-center p-3 text-center ${
                      seg.visualTheme.includes('coffee')
                        ? 'from-amber-950 via-slate-900 to-amber-900'
                        : seg.visualTheme.includes('scifi')
                        ? 'from-indigo-950 via-slate-900 to-amber-950'
                        : seg.visualTheme.includes('quantum')
                        ? 'from-blue-950 via-slate-900 to-cyan-950'
                        : 'from-slate-950 via-indigo-950 to-slate-900'
                    }`}
                  >
                    {isRegen ? (
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
                        <span className="text-[10px] font-mono text-indigo-300">Regenerating 3D Shot...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-2xl">
                            {seg.visualTheme.includes('coffee') ? '☕' : seg.visualTheme.includes('scifi') ? '🪐' : '⚛️'}
                          </span>
                          <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/30">
                            3D PBR
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-200 line-clamp-2 px-2">
                          {seg.visualPrompt}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Scene Number & Duration Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="rounded bg-black/75 backdrop-blur-md px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400 border border-white/10">
                      Shot {idx + 1}
                    </span>
                    <span className="rounded bg-black/75 backdrop-blur-md px-1.5 py-0.5 font-mono text-[10px] text-slate-300 border border-white/10">
                      {seg.duration}s
                    </span>
                  </div>

                  {/* 3D Camera Trajectory Badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="rounded bg-indigo-950/80 backdrop-blur-md px-2 py-0.5 font-mono text-[9px] text-indigo-300 border border-indigo-500/30">
                      {seg.camera3D?.trajectory === 'orbit_360' ? 'Orbit 360°' :
                       seg.camera3D?.trajectory === 'drone_flyover' ? 'Drone Flyover' :
                       seg.camera3D?.trajectory === 'crane_rise' ? 'Crane Tracking' : 'Macro Push-In'}
                    </span>
                  </div>

                  {/* Lower Third Preview Pill */}
                  {seg.lowerThirdText && (
                    <div className="absolute bottom-2 left-2 right-2 rounded bg-black/85 backdrop-blur-md px-2 py-1 text-[9px] font-mono text-slate-300 border-l-2 border-indigo-500 truncate">
                      {seg.lowerThirdText}
                    </div>
                  )}
                </div>

                {/* Shot Specification Details */}
                <div className="p-3.5 space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">
                      {seg.title.split(':')[1] || seg.title}
                    </h4>
                    <p className="text-[11px] font-mono text-indigo-400 mt-0.5">
                      {seg.camera3D?.lensPreset || seg.shotType}
                    </p>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Camera className="h-3 w-3 text-slate-500 shrink-0" />
                      <span className="truncate">{seg.cameraMovement}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Sun className="h-3 w-3 text-slate-500 shrink-0" />
                      <span className="truncate">{seg.lighting}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3D Mesh Assets Token Footer */}
              <div className="px-3.5 py-2 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="truncate">3D Rig: {seg.particles3D?.type.toUpperCase() || 'DUST'}</span>
                <span className="text-emerald-400 font-semibold">60 FPS PBR</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Proceed Section */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <p className="text-xs text-slate-400">
          All 8 shots configured with 3D WebGL camera rigs and volumetric lighting.
        </p>

        <button
          onClick={onProceed}
          className="btn-cine-primary flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-indigo-600/30"
        >
          <span>Generate 3D Video Timeline</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
