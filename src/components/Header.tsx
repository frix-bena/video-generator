import React from 'react';
import { 
  Box, 
  Bot, 
  Share2, 
  PlusCircle, 
  Layers
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
  onSelectStage,
  onNewProject,
  onOpenCopilot,
  isCopilotOpen,
  onOpenVersionHistory,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-pink-500/20 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-6 py-3 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Brand Logo & Clean Vertical Flex Title Container */}
        <div 
          onClick={onNewProject}
          className="flex cursor-pointer items-center gap-3.5 group select-none"
        >
          {/* Glowing 3D Brand Icon Box */}
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600 p-0.5 shadow-lg shadow-pink-500/25 group-hover:scale-105 group-hover:shadow-pink-500/40 transition-all duration-200 shrink-0">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950/90">
              <Box className="h-5 w-5 text-pink-400 group-hover:text-pink-300 transition-colors" />
            </div>
          </div>

          {/* Clean Vertical Stack for Title, Subtitle, and Version Tag */}
          <div className="flex flex-col justify-center space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-white group-hover:text-pink-200 transition-colors">
                CINEGEN <span className="text-pink-400">3D</span>
              </span>
              <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-pink-300 border border-pink-500/30 shadow-sm">
                STUDIO v{project.currentVersion}.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-normal truncate max-w-[180px] sm:max-w-xs">
              AI Text-to-Video Diffusion Studio
            </p>
          </div>
        </div>

        {/* Center: Current Project Info & Version Badge (Clean Glassmorphic Pill) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/80 px-3.5 py-1.5 border border-pink-500/20 backdrop-blur-md shadow-sm">
            <div className="h-2 w-2 rounded-full bg-pink-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[220px]">
              {project.title}
            </span>
            <span className="text-[10px] text-pink-300 font-mono font-bold px-1.5 py-0.5 rounded-md bg-pink-950/60 border border-pink-500/30">
              3D PBR
            </span>
            <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded-md bg-slate-800/80">
              ~6:00
            </span>
          </div>

          {/* Version History Quick Badge Button */}
          <button
            onClick={onOpenVersionHistory}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-850 px-3 py-1.5 text-xs font-medium text-slate-300 border border-pink-500/20 hover:border-pink-500/40 hover:text-white transition-all duration-200 shadow-sm"
            title="View Project Version History"
          >
            <Layers className="h-3.5 w-3.5 text-pink-400" />
            <span>Cuts History</span>
          </button>
        </div>

        {/* Right: Custom Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New 3D Prompt Button (Sleek semi-transparent pill with pink border glow) */}
          <button
            onClick={onNewProject}
            className="btn-cine-secondary flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold hover:scale-[1.02] transition-all duration-200"
            title="Create a New 3D Video from Prompt"
          >
            <PlusCircle className="h-3.5 w-3.5 text-pink-400" />
            <span className="hidden sm:inline">New 3D Prompt</span>
          </button>

          {/* 3D Copilot Button (Sleek semi-transparent pill/card with pink gradient border and glow) */}
          <button
            onClick={onOpenCopilot}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
              isCopilotOpen
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 border border-pink-400/50 scale-[1.02]'
                : 'btn-cine-secondary'
            }`}
            title="Open Cinegen AI Copilot Director"
          >
            <Bot className={`h-3.5 w-3.5 ${isCopilotOpen ? 'text-white animate-bounce' : 'text-pink-400'}`} />
            <span>3D Copilot</span>
          </button>

          {/* Export 3D Master (Lush Pink Gradient Primary Action Button) */}
          <button
            onClick={() => onSelectStage('publish')}
            className="btn-cine-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-md shadow-pink-500/30 hover:scale-[1.02] transition-all duration-200"
            title="Export Master 3D Video and Subtitles"
          >
            <Share2 className="h-3.5 w-3.5 text-white" />
            <span className="hidden sm:inline">Export 3D Master</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
