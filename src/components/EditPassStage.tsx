import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Scissors, 
  Music, 
  ArrowRight, 
  Plus, 
  Minus, 
  Check, 
  Save, 
  FileText,
  Box,
  Camera,
  Sparkles
} from 'lucide-react';
import { Project, CaptionStyle, ProjectVersion, CameraTrajectory } from '../types/cinegen';
import { VideoPlayer } from './VideoPlayer';
import { audioEngine } from '../services/audioEngine';

interface EditPassStageProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
  onProceed: () => void;
  onOpenVersionHistory: () => void;
}

export const EditPassStage: React.FC<EditPassStageProps> = ({
  project,
  onUpdateProject,
  onProceed,
}) => {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState<boolean>(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState<boolean>(false);
  const [dialogueText, setDialogueText] = useState<string>(project.segments[0]?.narration || '');

  const currentSegment = project.segments[selectedSceneIndex] || project.segments[0];

  // Update dialogue text when selected scene changes
  const handleSelectScene = (idx: number) => {
    setSelectedSceneIndex(idx);
    setDialogueText(project.segments[idx]?.narration || '');
  };

  // Plain-Language Brightness / Mood adjustments
  const handleAdjustBrightness = (delta: number) => {
    const updatedSegments = project.segments.map((seg, i) => {
      if (i === selectedSceneIndex) {
        const cur = seg.brightnessAdjustment || 0;
        return { ...seg, brightnessAdjustment: Math.max(-40, Math.min(40, cur + delta)) };
      }
      return seg;
    });
    onUpdateProject({ segments: updatedSegments });
    audioEngine.playSFX('click');
  };

  // Plain-Language Pacing & Duration adjustments
  const handleAdjustDuration = (deltaSec: number) => {
    const updatedSegments = project.segments.map((seg, i) => {
      if (i === selectedSceneIndex) {
        const newDur = Math.max(15, seg.duration + deltaSec);
        return { ...seg, duration: newDur };
      }
      return seg;
    });
    let currentStart = 0;
    const finalSegments = updatedSegments.map((seg) => {
      const segStart = currentStart;
      const segEnd = currentStart + seg.duration;
      currentStart = segEnd;
      return { ...seg, startTime: segStart, endTime: segEnd };
    });

    onUpdateProject({
      segments: finalSegments,
      targetDurationSec: currentStart,
    });
    audioEngine.playSFX('click');
  };

  // 3D Camera Trajectory Path change
  const handleSelect3DCameraTrajectory = (trajectory: CameraTrajectory) => {
    const updatedSegments = project.segments.map((seg, i) => {
      if (i === selectedSceneIndex) {
        return {
          ...seg,
          camera3D: {
            trajectory,
            fov: seg.camera3D?.fov || 45,
            startPos: (seg.camera3D?.startPos || [0, 4, 12]) as [number, number, number],
            endPos: (seg.camera3D?.endPos || [0, 2, 4]) as [number, number, number],
            lookAt: [0, 0, 0] as [number, number, number],
            lensPreset: `${trajectory.replace('_', ' ').toUpperCase()} Lens`,
          },
        };
      }
      return seg;
    });
    onUpdateProject({ segments: updatedSegments });
    audioEngine.playSFX('click');
  };

  // 3D Particle Type change
  const handleSelect3DParticleType = (type: any) => {
    const updatedSegments = project.segments.map((seg, i) => {
      if (i === selectedSceneIndex) {
        return {
          ...seg,
          particles3D: {
            type,
            count: 400,
            color: type === 'embers' ? '#f43f5e' : type === 'steam' ? '#ffffff' : '#ec4899',
            speed: 1,
            size: 0.1,
          },
        };
      }
      return seg;
    });
    onUpdateProject({ segments: updatedSegments });
    audioEngine.playSFX('click');
  };

  // Rewrite dialogue line with scoped single-scene audio re-render
  const handleApplyDialogueRewrite = () => {
    const updatedSegments = project.segments.map((seg, i) => {
      if (i === selectedSceneIndex) {
        return { ...seg, narration: dialogueText };
      }
      return seg;
    });
    onUpdateProject({ segments: updatedSegments });
    audioEngine.playSFX('chime');
  };

  // Swap Music Style
  const handleSwapMusic = (style: string) => {
    onUpdateProject({ musicStyle: style });
    audioEngine.playSFX('whoosh');
    audioEngine.startMusic(style);
  };

  // Swap Captions Style
  const handleSwapCaptionStyle = (style: CaptionStyle) => {
    onUpdateProject({ captionStyle: style });
    audioEngine.playSFX('click');
  };

  // Save Version Snapshot
  const handleSaveVersionSnapshot = () => {
    setIsSavingSnapshot(true);
    const newVersionNum = project.currentVersion + 1;
    const newSnapshot: ProjectVersion = {
      versionId: `v${newVersionNum}.0`,
      label: `Cut v${newVersionNum}.0 (3D Edit Pass)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: '3D Director Edit',
      summary: `Modified Scene ${selectedSceneIndex + 1} 3D camera trajectory & lighting`,
      segments: [...project.segments],
      selectedVoiceId: project.selectedVoiceId,
      musicStyle: project.musicStyle,
      captionStyle: project.captionStyle,
    };

    setTimeout(() => {
      onUpdateProject({
        currentVersion: newVersionNum,
        versionHistory: [newSnapshot, ...(project.versionHistory || [])],
      });
      setIsSavingSnapshot(false);
      setSnapshotSuccess(true);
      setTimeout(() => setSnapshotSuccess(false), 2500);
      audioEngine.playSFX('chime');
    }, 400);
  };

  return (
    <div className="mx-auto max-w-6xl py-4 sm:py-6 space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-pink-500/25 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-md bg-pink-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-pink-300 border border-pink-500/30">
              STAGE 5 • 3D DIRECTOR & EDIT PASS
            </span>
            <span className="text-xs text-pink-300/80">• Realtime 3D Scene Controls</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Fine-Tune Your 3D Video
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Direct 3D camera paths, adjust volumetric lighting, swap soundtrack beds, or edit dialogue lines in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Save Snapshot Button */}
          <button
            onClick={handleSaveVersionSnapshot}
            disabled={isSavingSnapshot}
            className="btn-cine-secondary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
          >
            {snapshotSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Cut Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-pink-400" />
                <span>Save Cut Snapshot</span>
              </>
            )}
          </button>

          <button
            onClick={onProceed}
            className="btn-cine-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg shadow-pink-500/30"
          >
            <span>Proceed to Publish</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace: Side-by-Side Player & 3D Directing Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player */}
        <div className="lg:col-span-7 space-y-4">
          <VideoPlayer
            project={project}
            videoUrl={project.videoUrl}
            currentSegmentIndex={selectedSceneIndex}
            onSegmentChange={handleSelectScene}
            onUpdateProject={onUpdateProject}
          />

          {/* Quick Scene Selector Pills */}
          <div className="glass-panel p-3.5 rounded-2xl border border-pink-500/20 space-y-2.5 shadow-md">
            <span className="text-[11px] font-bold text-pink-300 uppercase tracking-wider">
              Select 3D Scene to Direct
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {project.segments.map((seg, i) => (
                <button
                  key={seg.id}
                  onClick={() => handleSelectScene(i)}
                  className={`flex-shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    selectedSceneIndex === i
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-pink-500/15'
                  }`}
                >
                  Shot {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: 3D Directing & Plain-Language Editing Panels */}
        <div className="lg:col-span-5 space-y-4">
          {/* 3D Camera & Scene Panel */}
          <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-pink-500/15">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Box className="h-4 w-4 text-pink-400" />
                <span>Directing Shot {selectedSceneIndex + 1}: {currentSegment?.title.split(':')[1] || currentSegment?.title}</span>
              </h3>
              <span className="font-mono text-xs text-pink-300 font-bold">
                {currentSegment?.duration}s
              </span>
            </div>

            {/* 1. 3D Camera Trajectory Path */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-pink-400" />
                3D Camera Trajectory Path
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'macro_push', label: 'Macro Push-In' },
                  { id: 'orbit_360', label: 'Orbit 360° Sweep' },
                  { id: 'drone_flyover', label: 'Drone Flyover' },
                  { id: 'crane_rise', label: 'Crane Rise' },
                ].map((traj) => (
                  <button
                    key={traj.id}
                    onClick={() => handleSelect3DCameraTrajectory(traj.id as CameraTrajectory)}
                    className={`rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all duration-200 ${
                      currentSegment.camera3D?.trajectory === traj.id
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-pink-500/15'
                    }`}
                  >
                    {traj.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 3D Particle Environment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                3D Atmosphere Particles
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['dust', 'steam', 'embers', 'rain', 'stardust', 'none'].map((pType) => (
                  <button
                    key={pType}
                    onClick={() => handleSelect3DParticleType(pType)}
                    className={`rounded-xl px-2 py-1.5 text-center text-xs capitalize font-semibold transition-all duration-200 ${
                      currentSegment.particles3D?.type === pType
                        ? 'bg-pink-600 text-white shadow-sm shadow-pink-500/30'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-pink-500/15'
                    }`}
                  >
                    {pType}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Scene Lighting / Mood Adjustment */}
            <div className="space-y-2 pt-2 border-t border-pink-500/15">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                3D Volumetric Lighting & Exposure
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAdjustBrightness(-10)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-pink-500/20 py-2 text-xs font-semibold text-slate-200"
                >
                  <Moon className="h-3.5 w-3.5 text-pink-400" />
                  <span>Moodier (-10%)</span>
                </button>
                <button
                  onClick={() => handleAdjustBrightness(10)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-pink-500/20 py-2 text-xs font-semibold text-slate-200"
                >
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Brighter (+10%)</span>
                </button>
              </div>
            </div>

            {/* 4. Scene Trimming & Pacing */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5 text-pink-400" />
                Shot Duration & Pacing
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAdjustDuration(-5)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-pink-500/20 py-2 text-xs font-semibold text-slate-200"
                >
                  <Minus className="h-3.5 w-3.5 text-rose-400" />
                  <span>Shorten (-5s)</span>
                </button>
                <button
                  onClick={() => handleAdjustDuration(5)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-pink-500/20 py-2 text-xs font-semibold text-slate-200"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Extend (+5s)</span>
                </button>
              </div>
            </div>

            {/* 5. Rewrite Spoken Dialogue with Scoped Audio Re-render */}
            <div className="space-y-2 pt-2 border-t border-pink-500/15">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-pink-400" />
                  Narration Track (Instant 3D Audio Sync)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {dialogueText.split(/\s+/).filter(Boolean).length} words
                </span>
              </label>
              <textarea
                rows={3}
                value={dialogueText}
                onChange={(e) => setDialogueText(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-pink-500/20 p-2.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500 resize-none leading-relaxed"
              />
              <button
                onClick={handleApplyDialogueRewrite}
                className="w-full rounded-xl bg-pink-600 hover:bg-pink-500 py-2 text-xs font-bold text-white shadow-md shadow-pink-600/30 transition-colors"
              >
                Apply & Re-Synthesize Dialogue Track
              </button>
            </div>
          </div>

          {/* Global Soundtrack & Captions Style */}
          <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-4 shadow-md">
            <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <Music className="h-4 w-4 text-pink-400" />
              <span>Background Score & Captions</span>
            </h4>

            {/* Music Bed Switcher */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-pink-300 uppercase">Music Atmosphere</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Cinematic Orchestral',
                  'Lo-fi Ambient Beats',
                  'Electronic Cyberpulse',
                  'Acoustic Strings Warmth',
                ].map((mStyle) => (
                  <button
                    key={mStyle}
                    onClick={() => handleSwapMusic(mStyle)}
                    className={`rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all duration-200 ${
                      project.musicStyle?.includes(mStyle.split(' ')[0])
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-pink-500/15'
                    }`}
                  >
                    {mStyle}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Style Switcher */}
            <div className="space-y-2 pt-2 border-t border-pink-500/15">
              <label className="text-[11px] font-bold text-pink-300 uppercase">Captions Appearance</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'documentary', label: 'Documentary Minimal' },
                  { id: 'mrbeast', label: 'Hormozi / Pop Yellow' },
                  { id: 'neon', label: 'Neon Cyber Pink' },
                  { id: 'netflix', label: 'Netflix Classic' },
                ].map((cap) => (
                  <button
                    key={cap.id}
                    onClick={() => handleSwapCaptionStyle(cap.id as CaptionStyle)}
                    className={`rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all duration-200 ${
                      project.captionStyle === cap.id
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-pink-500/15'
                    }`}
                  >
                    {cap.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
