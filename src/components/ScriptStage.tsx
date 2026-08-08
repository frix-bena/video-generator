import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Check, 
  Sparkles, 
  Clock, 
  Edit3, 
  ArrowRight, 
  Pause, 
  Play, 
  RotateCcw, 
  BookOpen, 
  Flame, 
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Project, SceneSegment } from '../types/cinegen';

interface ScriptStageProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
  onProceed: () => void;
  autoProceed?: boolean;
}

export const ScriptStage: React.FC<ScriptStageProps> = ({
  project,
  onUpdateProject,
  onProceed,
  autoProceed = false,
}) => {
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(8);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(!autoProceed);
  const [expandedSegmentId, setExpandedSegmentId] = useState<string | null>(project.segments[0]?.id || null);

  // Auto-proceed countdown
  useEffect(() => {
    if (isTimerPaused) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onProceed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerPaused, onProceed]);

  // Calculate total words
  const totalWords = project.segments.reduce((acc, seg) => acc + (seg.narration.split(/\s+/).filter(Boolean).length || 0), 0);
  const targetWords = 850;
  const pacingStatus = totalWords >= 780 && totalWords <= 950 ? 'Optimal (~6:00 pacing)' : totalWords < 780 ? 'Slightly fast' : 'Slightly slow';

  const handleUpdateNarration = (segId: string, newText: string) => {
    const updatedSegments = project.segments.map((s) => {
      if (s.id === segId) {
        const words = newText.split(/\s+/).filter(Boolean).length;
        return { ...s, narration: newText, wordCount: words };
      }
      return s;
    });
    onUpdateProject({ segments: updatedSegments });
  };

  const handleUpdateLogline = (newLogline: string) => {
    onUpdateProject({ logline: newLogline });
  };

  return (
    <div className="mx-auto max-w-5xl py-6 px-4 sm:px-6 space-y-6">
      {/* Auto Proceed Banner */}
      {!isTimerPaused && countdown > 0 && (
        <div className="glass-panel p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-wrap items-center justify-between gap-3 animate-soft-pulse">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">
              {countdown}s
            </div>
            <div>
              <p className="text-xs font-bold text-amber-200">
                Script treatment approved automatically in {countdown}s
              </p>
              <p className="text-[11px] text-amber-400/80">
                Proceeding to Stage 2: Storyboard & Visual Continuity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTimerPaused(true)}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-white/10"
            >
              <Pause className="h-3 w-3" />
              <span>Pause & Edit</span>
            </button>
            <button
              onClick={onProceed}
              className="btn-cine-primary flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-bold"
            >
              <span>Proceed Now</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Script Treatment Overview Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">
                STAGE 1 • TREATMENT & SCRIPT
              </span>
              <span className="text-xs text-slate-400">• Broadcast Standard</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              {project.title}
            </h2>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-900/90 border border-white/10 px-3 py-1.5 text-right">
              <p className="text-[10px] text-slate-400">Total Word Count</p>
              <p className="font-mono text-sm font-bold text-indigo-300">
                {totalWords} <span className="text-[11px] text-slate-400">/ ~{targetWords}</span>
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-white/10 px-3 py-1.5 text-right">
              <p className="text-[10px] text-slate-400">Target Duration</p>
              <p className="font-mono text-sm font-bold text-amber-400">
                06:00 <span className="text-[11px] text-slate-400">(360s)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Treatment Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Logline</label>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{project.logline}"
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tone & Pace</label>
            <p className="text-xs text-slate-300 font-medium">
              {project.tone}
            </p>
            <span className="inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
              {pacingStatus}
            </span>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Target Audience</label>
            <p className="text-xs text-slate-300">
              {project.targetAudience}
            </p>
          </div>
        </div>
      </div>

      {/* Scene-by-Scene Script Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            <h3 className="font-display text-lg font-bold text-white">
              Scene-by-Scene Narrative Breakdown ({project.segments.length} Chapters)
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Click any section to edit narration inline
          </p>
        </div>

        <div className="space-y-3">
          {project.segments.map((seg, idx) => {
            const isExpanded = expandedSegmentId === seg.id;
            const isEditing = editingSegmentId === seg.id;
            const startMins = Math.floor(seg.startTime / 60);
            const startSecs = Math.floor(seg.startTime % 60);
            const endMins = Math.floor(seg.endTime / 60);
            const endSecs = Math.floor(seg.endTime % 60);
            const timeRange = `${startMins.toString().padStart(2, '0')}:${startSecs.toString().padStart(2, '0')} – ${endMins.toString().padStart(2, '0')}:${endSecs.toString().padStart(2, '0')}`;

            return (
              <div
                key={seg.id}
                className={`glass-card rounded-xl border transition-all ${
                  isExpanded ? 'border-indigo-500/40 bg-slate-900/90' : 'border-white/5 bg-slate-900/40'
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedSegmentId(isExpanded ? null : seg.id)}
                  className="flex items-center justify-between p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-mono text-xs font-bold border border-indigo-500/20">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {seg.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-amber-400">
                          {timeRange} ({seg.duration}s)
                        </span>
                        <span className="text-[11px] text-slate-500">•</span>
                        <span className="text-[11px] text-slate-400">
                          {seg.wordCount} words
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 hidden sm:inline font-mono">
                      {seg.shotType.split('•')[0]}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Narration Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-indigo-400" />
                          Spoken Narration Voiceover
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">
                          Speaker: {seg.speaker}
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        value={seg.narration}
                        onChange={(e) => handleUpdateNarration(seg.id, e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-white/10 p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none leading-relaxed resize-none"
                      />
                    </div>

                    {/* Scene Metadata pills */}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <div className="rounded bg-slate-950 px-2.5 py-1 text-slate-300 border border-white/5">
                        <span className="text-slate-500">Setting: </span>{seg.setting}
                      </div>
                      <div className="rounded bg-slate-950 px-2.5 py-1 text-slate-300 border border-white/5">
                        <span className="text-slate-500">Lighting: </span>{seg.lighting}
                      </div>
                      <div className="rounded bg-slate-950 px-2.5 py-1 text-slate-300 border border-white/5">
                        <span className="text-slate-500">SFX: </span>{seg.sfxCue}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button
          onClick={() => setIsTimerPaused(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Draft</span>
        </button>

        <button
          onClick={onProceed}
          className="btn-cine-primary flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-indigo-600/30"
        >
          <span>Approve Script & Plan Storyboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
