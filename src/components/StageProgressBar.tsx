import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  Mic2, 
  Sliders, 
  Share2, 
  Check, 
  Lightbulb, 
  ArrowRight
} from 'lucide-react';
import { PipelineStage } from '../types/cinegen';

interface StageProgressBarProps {
  currentStage: PipelineStage;
  onSelectStage: (stage: PipelineStage) => void;
  renderProgress: number;
}

const STAGES: { id: PipelineStage; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
  { id: 'prompt', label: 'Prompt', icon: Lightbulb, description: 'Idea & Intent' },
  { id: 'script', label: '1. Script', icon: FileText, description: '~6-min Treatment' },
  { id: 'storyboard', label: '2. Storyboard', icon: ImageIcon, description: 'Visual Continuity' },
  { id: 'generating', label: '3. Video Gen', icon: Sparkles, description: 'Cinematic Master' },
  { id: 'voice', label: '4. Voice', icon: Mic2, description: 'Narration & Audio' },
  { id: 'edit', label: '5. Edit Pass', icon: Sliders, description: 'Plain English Edits' },
  { id: 'publish', label: '6. Publish', icon: Share2, description: 'Export & Share' },
];

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  currentStage,
  onSelectStage,
  renderProgress,
}) => {
  const getStageIndex = (stage: PipelineStage) => STAGES.findIndex((s) => s.id === stage);
  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="w-full border-b border-white/5 bg-slate-950/90 px-4 py-2.5">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isPending = idx > currentIndex;

            return (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => onSelectStage(stage.id)}
                  className={`group relative flex flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all duration-200 min-w-[120px] ${
                    isCurrent
                      ? 'bg-indigo-600/15 border border-indigo-500/50 shadow-md shadow-indigo-500/10'
                      : isCompleted
                      ? 'bg-slate-900/60 hover:bg-slate-900 border border-white/5 text-slate-300'
                      : 'bg-transparent hover:bg-slate-900/40 border border-transparent text-slate-500'
                  }`}
                >
                  {/* Step Icon Badge */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-transform group-hover:scale-105 ${
                      isCurrent
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/40'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Step Title & Subtitle */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold truncate ${
                          isCurrent
                            ? 'text-white'
                            : isCompleted
                            ? 'text-slate-200'
                            : 'text-slate-400'
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate hidden lg:block">
                      {stage.description}
                    </p>
                  </div>

                  {/* Active Indicator bar */}
                  {isCurrent && (
                    <div className="absolute -bottom-2.5 left-2 right-2 h-0.5 rounded-full bg-indigo-500" />
                  )}
                </button>

                {idx < STAGES.length - 1 && (
                  <div className="hidden sm:flex text-slate-700">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
