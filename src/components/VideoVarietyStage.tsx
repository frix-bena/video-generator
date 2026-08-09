import React, { useState } from 'react';
import { 
  Check, 
  ArrowRight, 
  Tv, 
  Sparkles, 
  RotateCcw, 
  Layers, 
  Eye, 
  Music, 
  Mic, 
  ChevronRight,
  Camera,
  Sun
} from 'lucide-react';
import { Project, VideoVariation } from '../types/cinegen';
import { VideoPlayer } from './VideoPlayer';
import { audioEngine } from '../services/audioEngine';

interface VideoVarietyStageProps {
  project: Project;
  variations: VideoVariation[];
  onSelectVariation: (variation: VideoVariation) => void;
  onProceedToVoice: () => void;
  onBackToPrompt: () => void;
  onUpdateProject: (updated: Partial<Project>) => void;
}

export const VideoVarietyStage: React.FC<VideoVarietyStageProps> = ({
  project,
  variations,
  onSelectVariation,
  onProceedToVoice,
  onBackToPrompt,
  onUpdateProject,
}) => {
  // If variations are provided, use them; otherwise fallback to project variations or create on the fly
  const variationList = variations && variations.length > 0 ? variations : project.variations || [];
  const [selectedVarId, setSelectedVarId] = useState<string>(
    project.selectedVariationId || (variationList[0]?.id || 'var-1')
  );
  const [previewingVarId, setPreviewingVarId] = useState<string>(
    project.selectedVariationId || (variationList[0]?.id || 'var-1')
  );

  const activeVariation = variationList.find((v) => v.id === previewingVarId) || variationList[0];
  const activeProject = activeVariation?.project || project;

  const handlePreviewVariation = (variation: VideoVariation) => {
    setPreviewingVarId(variation.id);
    audioEngine.playSFX('click');
  };

  const handleChooseVariation = (variation: VideoVariation) => {
    setSelectedVarId(variation.id);
    setPreviewingVarId(variation.id);
    onSelectVariation(variation);
    audioEngine.playSFX('chime');
  };

  const handleConfirmAndProceed = () => {
    const chosen = variationList.find((v) => v.id === selectedVarId) || activeVariation;
    if (chosen) {
      onSelectVariation(chosen);
    }
    audioEngine.playSFX('whoosh');
    onProceedToVoice();
  };

  return (
    <div className="mx-auto max-w-7xl py-4 sm:py-6 space-y-8">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-2xl border border-pink-500/30 bg-pink-950/25 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-md bg-pink-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-pink-300 border border-pink-500/30">
              STEP 2 • VIDEO VARIETY SELECTION
            </span>
            <span className="text-xs text-pink-300 font-semibold">• 4 Candidate Cuts Synthesized</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Choose the Best Video Direction
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
            The AI agent synthesized <strong>4 distinct candidate video cuts</strong> with different camera trajectories, lighting shaders, and pacing. Test-play them in real time and pick your favorite before selecting voice narration.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPrompt}
            className="btn-cine-secondary flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold"
            title="Go back and tweak prompt"
          >
            <RotateCcw className="h-3.5 w-3.5 text-pink-400" />
            <span>Tweak Prompt</span>
          </button>

          <button
            onClick={handleConfirmAndProceed}
            className="btn-cine-primary flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition-transform"
          >
            <span>Proceed with Chosen Video</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Live 3D Preview Player on Left, Candidate Selection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live 3D WebGL Player for Active Variation Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Tv className="h-4 w-4 text-pink-400" />
              <span>Real-Time 3D Video Preview:</span>
              <span className="text-pink-300 font-normal truncate max-w-[200px]">
                {activeVariation?.title || 'Selected Video'}
              </span>
            </h3>
            <span className="text-[11px] font-mono text-pink-400 flex items-center gap-1.5 font-bold">
              <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />
              60 FPS WebGL Engine
            </span>
          </div>

          {/* Embedded 3D Player */}
          <VideoPlayer
            project={activeProject}
            currentSegmentIndex={0}
            onUpdateProject={onUpdateProject}
            autoPlay={true}
          />

          {/* Active Variation Specs Bar */}
          {activeVariation && (
            <div className="glass-panel p-4 rounded-2xl border border-pink-500/20 bg-slate-950/80 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-sm"
                    style={{ backgroundColor: activeVariation.accentColor }}
                  >
                    {activeVariation.badge}
                  </span>
                  <h4 className="font-display text-sm font-bold text-white">
                    {activeVariation.title}
                  </h4>
                </div>
                <span className="text-xs font-mono text-pink-300">
                  {activeVariation.tone}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeVariation.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-pink-500/10 text-[11px]">
                <div className="space-y-0.5">
                  <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-bold">
                    <Camera className="h-3 w-3 text-pink-400" /> Camera Style
                  </span>
                  <p className="text-slate-200 font-medium truncate">{activeVariation.cameraStyle.split('•')[0]}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-bold">
                    <Sun className="h-3 w-3 text-pink-400" /> Lighting Shaders
                  </span>
                  <p className="text-slate-200 font-medium truncate">{activeVariation.lightingEnvironment.split('&')[0]}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-bold">
                    <Music className="h-3 w-3 text-pink-400" /> Soundtrack Bed
                  </span>
                  <p className="text-slate-200 font-medium truncate">{activeVariation.musicStyle}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-bold">
                    <Mic className="h-3 w-3 text-pink-400" /> Recommended Voice
                  </span>
                  <p className="text-slate-200 font-medium truncate">{activeVariation.recommendedVoiceId.replace('voice-', '').toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Variety Cards (4 Candidate Variations to Choose From) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Layers className="h-4 w-4 text-pink-400" />
              <span>Available Video Cuts ({variationList.length})</span>
            </h3>
            <span className="text-xs text-pink-400 font-mono">Click card to preview or select</span>
          </div>

          <div className="space-y-3">
            {variationList.map((variation, idx) => {
              const isSelected = selectedVarId === variation.id;
              const isPreviewing = previewingVarId === variation.id;

              return (
                <div
                  key={variation.id}
                  onClick={() => handlePreviewVariation(variation)}
                  className={`glass-card p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                    isSelected
                      ? 'border-pink-500 bg-pink-950/40 shadow-xl shadow-pink-500/20 ring-2 ring-pink-500/80'
                      : isPreviewing
                      ? 'border-pink-500/60 bg-slate-900/90 shadow-md shadow-pink-500/10'
                      : 'border-pink-500/15 hover:border-pink-500/40 hover:bg-slate-900/70'
                  }`}
                >
                  {/* Top Bar: Badge & Number */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md text-white tracking-wider shadow-sm"
                          style={{ backgroundColor: variation.accentColor }}
                        >
                          {variation.badge}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Option {idx + 1}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          <Check className="h-3 w-3" />
                          <span>CHOSEN VIDEO</span>
                        </div>
                      )}
                    </div>

                    {/* Title & Tagline */}
                    <h4 className="font-display text-base font-bold text-white group-hover:text-pink-300 transition-colors mb-0.5">
                      {variation.title}
                    </h4>
                    <p className="text-xs text-pink-300/90 font-medium mb-2">
                      {variation.tagline}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {variation.description}
                    </p>

                    {/* Scene Snippets / Visual Keywords */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[10px] bg-slate-950/70 border border-pink-500/15 px-2 py-0.5 rounded-md text-slate-300 font-mono">
                        {variation.colorGrade.split('&')[0]}
                      </span>
                      <span className="text-[10px] bg-slate-950/70 border border-pink-500/15 px-2 py-0.5 rounded-md text-slate-300 font-mono">
                        {variation.captionStyle.toUpperCase()} Captions
                      </span>
                      <span className="text-[10px] bg-slate-950/70 border border-pink-500/15 px-2 py-0.5 rounded-md text-slate-300 font-mono">
                        {variation.project.segments.length} 3D Scenes
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="pt-2.5 border-t border-pink-500/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewVariation(variation);
                      }}
                      className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        isPreviewing
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Eye className="h-3 w-3 text-pink-400" />
                      <span>{isPreviewing ? 'Previewing in Player' : 'Preview 3D'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChooseVariation(variation);
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-md ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-pink-500/30 ring-1 ring-white/30'
                          : 'bg-slate-800 text-pink-300 hover:bg-pink-600 hover:text-white border border-pink-500/30'
                      }`}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                      <span>{isSelected ? 'Selected' : 'Choose This Video'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Confirmation Card */}
          <div className="glass-panel p-4 rounded-2xl border border-pink-500/25 bg-pink-950/30 flex items-center justify-between gap-3 shadow-md">
            <div>
              <p className="text-xs font-bold text-white">
                Happy with your chosen video?
              </p>
              <p className="text-[11px] text-slate-300">
                Next, choose the perfect voice actor for your narration.
              </p>
            </div>
            <button
              onClick={handleConfirmAndProceed}
              className="btn-cine-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition-transform shrink-0"
            >
              <span>Pick Voice Track</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
