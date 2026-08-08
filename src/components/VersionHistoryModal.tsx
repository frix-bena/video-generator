import React from 'react';
import { 
  Layers, 
  X, 
  RotateCcw, 
  Clock, 
  Check, 
  User, 
  FileText,
  Sparkles
} from 'lucide-react';
import { Project, ProjectVersion } from '../types/cinegen';
import { audioEngine } from '../services/audioEngine';

interface VersionHistoryModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (version: ProjectVersion) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  project,
  isOpen,
  onClose,
  onRestoreVersion,
}) => {
  if (!isOpen) return null;

  const versions = project.versionHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/10 p-6 space-y-5 bg-slate-950/95 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                Project Cut & Version History
              </h3>
              <p className="text-xs text-slate-400">
                Revert to any previous draft or snapshot instantly without data loss.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Version List */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {/* Current Master */}
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-display text-sm font-bold text-white">
                  Current Master Cut (v{project.currentVersion}.0)
                </span>
              </div>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300">
              8 scenes • Duration: {Math.floor(project.targetDurationSec / 60)}:00 • Voice: {project.selectedVoiceId}
            </p>
          </div>

          {/* Historical Versions */}
          {versions.map((ver, idx) => (
            <div
              key={ver.versionId}
              className="glass-card p-4 rounded-xl border border-white/5 hover:border-white/20 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-display text-xs font-bold text-white">
                    {ver.label}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {ver.timestamp}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                {ver.summary}
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-white/5">
                <span className="text-[10px] text-slate-500">
                  By {ver.author}
                </span>

                <button
                  onClick={() => {
                    onRestoreVersion(ver);
                    audioEngine.playSFX('chime');
                    onClose();
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Restore This Cut</span>
                </button>
              </div>
            </div>
          ))}

          {versions.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500">
              No previous saved snapshots yet. Click "Save Cut Snapshot" in Stage 5 to create rollback points.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 px-4 py-2 text-xs font-medium text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
