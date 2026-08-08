import React from 'react';
import { 
  Sparkles, 
  Film, 
  Bot, 
  Share2, 
  PlusCircle, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Sliders,
  Box
} from 'lucide-react';
import { Project, PipelineStage } from '../types/cinegen';

interface HeaderProps {
  project: Project;
  currentStage: PipelineStage;
  onSelectStage: (stage: PipelineStage) => void;
  onNewProject: () => void;
  onOpenCopilot: () => void;
  isCopilotOpen: boolean;
  onOpenVersionHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  currentStage,
  onSelectStage,
  onNewProject,
  onOpenCopilot,
  isCopilotOpen,
  onOpenVersionHistory,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div 
            onClick={onNewProject}
            className="flex cursor-pointer items-center gap-2.5 group"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Box className="h-5 w-5 text-amber-400 group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold tracking-tight text-white">
                  CINEGEN 3D
                </span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  REALISTIC 3D STUDIO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                Autonomous 3D WebGL Film Engine
              </p>
            </div>
          </div>
        </div>

        {/* Current Project Info & Status */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-1.5 border border-white/10">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-200 truncate max-w-[240px]">
              {project.title}
            </span>
            <span className="text-[10px] text-amber-400 font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-amber-500/20">
              3D PBR
            </span>
            <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-800">
              ~6:00
            </span>
          </div>

          {/* Version Badge */}
          <button
            onClick={onOpenVersionHistory}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-850 px-2.5 py-1.5 text-xs text-slate-300 border border-white/10 transition-colors"
            title="View Project Version History"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>v{project.currentVersion}.0</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Video Button */}
          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 border border-white/10 transition-all hover:border-white/20"
          >
            <PlusCircle className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">New 3D Prompt</span>
          </button>

          {/* AI Copilot Drawer Toggle */}
          <button
            onClick={onOpenCopilot}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              isCopilotOpen
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>3D Copilot</span>
          </button>

          {/* Quick Publish / Export */}
          <button
            onClick={() => onSelectStage('publish')}
            className="btn-cine-primary flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Export 3D Master</span>
          </button>
        </div>
      </div>
    </header>
  );
};
