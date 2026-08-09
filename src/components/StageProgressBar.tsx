import React from 'react';
import { 
  FileText, 
  Mic2, 
  Sliders, 
  Share2, 
  Check, 
  Lightbulb, 
  ChevronRight,
  Layers,
  Film
} from 'lucide-react';
import { PipelineStage } from '../types/cinegen';

interface StageProgressBarProps {
  currentStage: PipelineStage;
  onSelectStage: (stage: PipelineStage) => void;
  renderProgress?: number;
}

const PRIMARY_STAGES: { id: PipelineStage; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
  { id: 'prompt', label: '1. Write Prompt', icon: Lightbulb, description: 'Idea & Video Intent' },
  { id: 'variety', label: '2. Video Variety', icon: Layers, description: 'Pick Best 3D Cut' },
  { id: 'voice', label: '3. Choose Voice', icon: Mic2, description: 'Narration Track' },
  { id: 'publish', label: '4. Download Video', icon: Share2, description: '4K Export & Subtitles' },
];

const ADVANCED_STAGES: { id: PipelineStage; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'script', label: 'Script', icon: FileText },
  { id: 'storyboard', label: 'Storyboard', icon: Film },
  { id: 'edit', label: 'Edit Pass', icon: Sliders },
];

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  currentStage,
  onSelectStage,
}) => {
  const getPrimaryStageIndex = (stage: PipelineStage) => {
    if (stage === 'generating') return 1;
    return PRIMARY_STAGES.findIndex((s) => s.id === stage);
  };
  const currentPrimaryIndex = getPrimaryStageIndex(currentStage);

  return (
    <div className="w-full border-b border-pink-500/15 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-6 py-2.5 shadow-sm">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
        {/* Core 4-Step Primary Pipeline */}
        <div className="flex-1 flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none min-w-[320px]">
          {PRIMARY_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = currentPrimaryIndex !== -1 && idx < currentPrimaryIndex;
            const isCurrent = currentStage === stage.id || (stage.id === 'variety' && currentStage === 'generating');

            return (
              <React.Fragment key={stage.id}>
                {/* Step Item Glassmorphic Card Button */}
                <button
                  onClick={() => onSelectStage(stage.id)}
                  className={`group relative flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-200 min-w-[130px] ${
                    isCurrent
                      ? 'bg-pink-500/15 border border-pink-500/50 shadow-md shadow-pink-500/15 scale-[1.01]'
                      : isCompleted
                      ? 'bg-slate-900/60 hover:bg-slate-900/90 border border-pink-500/10 hover:border-pink-500/30 text-slate-200'
                      : 'bg-transparent hover:bg-slate-900/40 border border-transparent hover:border-white/5 text-slate-500'
                  }`}
                >
                  {/* Step Icon Badge */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 group-hover:scale-105 ${
                      isCurrent
                        ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/40'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 group-hover:text-pink-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Step Title & Subtitle */}
                  <div className="min-w-0 flex flex-col justify-center">
                    <span
                      className={`text-xs font-bold truncate ${
                        isCurrent
                          ? 'text-white'
                          : isCompleted
                          ? 'text-slate-200'
                          : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    >
                      {stage.label}
                    </span>
                    <p className="text-[10px] text-slate-500 truncate hidden md:block font-medium">
                      {stage.description}
                    </p>
                  </div>

                  {/* Active Glowing Pink Indicator bar */}
                  {isCurrent && (
                    <div className="absolute -bottom-2.5 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 shadow-sm shadow-pink-500" />
                  )}
                </button>

                {/* Clean Connector Chevron Arrow */}
                {idx < PRIMARY_STAGES.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center text-slate-600 shrink-0 select-none">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Secondary Advanced Studio Tools (Script / Storyboard / Edit Pass) */}
        <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-pink-500/15">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mr-1">
            Studio:
          </span>
          {ADVANCED_STAGES.map((adv) => {
            const Icon = adv.icon;
            const isCurrent = currentStage === adv.id;
            return (
              <button
                key={adv.id}
                onClick={() => onSelectStage(adv.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  isCurrent
                    ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3 w-3 text-pink-400" />
                <span>{adv.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
