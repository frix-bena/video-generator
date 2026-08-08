import React, { useState } from 'react';
import { 
  Wand2, 
  ArrowRight, 
  Clock, 
  Compass, 
  Zap, 
  ChevronRight,
  Box
} from 'lucide-react';
import { SAMPLE_PROMPT_PRESETS } from '../data/defaultProjects';
import { AspectRatio } from '../types/cinegen';

interface PromptStageProps {
  onGenerate: (prompt: string, options: { duration: number; aspectRatio: AspectRatio; autonomous: boolean }) => void;
  isLoading: boolean;
}

export const PromptStage: React.FC<PromptStageProps> = ({ onGenerate, isLoading }) => {
  const [promptText, setPromptText] = useState<string>('Make a documentary-style realistic 3D video about the history of coffee, from ancient Ethiopia to modern specialty cafes');
  const [selectedDuration, setSelectedDuration] = useState<number>(360); // 6 mins
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('16:9');
  const [isAutonomousMode, setIsAutonomousMode] = useState<boolean>(true);
  const [is3DModeActive, setIs3DModeActive] = useState<boolean>(true);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim() || isLoading) return;
    onGenerate(promptText, {
      duration: selectedDuration,
      aspectRatio: selectedAspectRatio,
      autonomous: isAutonomousMode,
    });
  };

  const handleSelectPreset = (presetPrompt: string) => {
    setPromptText(presetPrompt);
  };

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-4 shadow-sm">
          <Box className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span>Realistic 3D Video Studio • WebGL 60 FPS Engine</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Produce <span className="text-gradient-cine">Realistic 3D Videos</span> from a Single Prompt
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Cinegen synthesizes photorealistic 3D environments, PBR materials, cinematic camera trajectories, voice narration, and broadcast color grading.
        </p>
      </div>

      {/* Main Single Prompt Bar Card */}
      <div className="glass-panel-glow p-6 sm:p-8 rounded-2xl mb-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. Make a documentary-style realistic 3D video about the history of coffee, with macro PBR espresso and floating coffee beans..."
              className="w-full rounded-xl bg-slate-900/90 border border-white/15 px-4 py-3.5 text-base sm:text-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none resize-none transition-all shadow-inner"
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-500 font-mono">
              {promptText.length} chars
            </div>
          </div>

          {/* Configuration Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-3">
              {/* 3D Engine Toggle */}
              <button
                type="button"
                onClick={() => setIs3DModeActive(!is3DModeActive)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  is3DModeActive
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-white/10'
                }`}
                title="Enable Photorealistic 3D PBR WebGL Engine"
              >
                <Box className={`h-3.5 w-3.5 ${is3DModeActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{is3DModeActive ? '3D Engine: Enabled' : '3D Engine: Off'}</span>
              </button>

              {/* Duration Badge */}
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-slate-300 border border-white/10">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-semibold text-white">~6:00 min</span>
                <span className="text-slate-400">(800–950 words)</span>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="flex items-center rounded-lg bg-slate-900 border border-white/10 p-1">
                {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setSelectedAspectRatio(ar)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                      selectedAspectRatio === ar
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ar === '16:9' ? '16:9 (Landscape)' : ar === '9:16' ? '9:16 (Vertical)' : '1:1 (Square)'}
                  </button>
                ))}
              </div>

              {/* Autonomous Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsAutonomousMode(!isAutonomousMode)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                  isAutonomousMode
                    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-white/10'
                }`}
              >
                <Zap className={`h-3.5 w-3.5 ${isAutonomousMode ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{isAutonomousMode ? 'Autonomous Pipeline' : 'Step-by-Step Approval'}</span>
              </button>
            </div>

            {/* Execute Button */}
            <button
              type="submit"
              disabled={isLoading || !promptText.trim()}
              className="btn-cine-primary flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Generating 3D Video...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 text-amber-300" />
                  <span>Generate Realistic 3D Video</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Preset Inspiration Prompts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-400" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">
              Featured Realistic 3D Production Presets
            </h3>
          </div>
          <span className="text-xs text-amber-400 font-mono">PBR Shaders & 3D Camera Trajectories</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {SAMPLE_PROMPT_PRESETS.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectPreset(preset.prompt)}
              className="glass-card p-4 rounded-xl cursor-pointer group hover:border-indigo-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{preset.icon}</span>
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {preset.category}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{preset.duration}</span>
                </div>
                <h4 className="font-display text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
                  {preset.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {preset.prompt}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] italic text-slate-400">{preset.tone}</span>
                <span className="flex items-center gap-1 font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  Load 3D Preset <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
