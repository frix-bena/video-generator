import React, { useState } from 'react';
import { 
  Download, 
  Mic, 
  Sparkles, 
  FileText, 
  Check, 
  Volume2, 
  Image as ImageIcon 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Project } from '../types/cinegen';
import { VOICES_LIBRARY } from '../data/voices';
import { audioEngine } from '../services/audioEngine';
import { VideoPlayer } from './VideoPlayer';
import { VoiceSelectorModal } from './VoiceSelectorModal';
import { CoverPageService } from '../services/coverPageService';

interface ChatVideoCardProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
  onQuickAction?: (actionPrompt: string) => void;
}

export const ChatVideoCard: React.FC<ChatVideoCardProps> = ({
  project,
  onUpdateProject,
}) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const selectedVoice = VOICES_LIBRARY.find((v) => v.id === project.selectedVoiceId) || VOICES_LIBRARY[0];
  const activeVideoUrl = project.videoUrl;

  // Master Video Download Handler
  const handleDownloadMaster = () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    audioEngine.playSFX('whoosh');

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);

          if (activeVideoUrl) {
            const a = document.createElement('a');
            a.href = activeVideoUrl;
            a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_master.mp4`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }

          audioEngine.playSFX('chime');
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  // Subtitles SRT Download
  const handleDownloadSRT = () => {
    let srtContent = '';
    project.segments.forEach((seg, idx) => {
      const startMins = Math.floor(seg.startTime / 60);
      const startSecs = Math.floor(seg.startTime % 60);
      const endMins = Math.floor(seg.endTime / 60);
      const endSecs = Math.floor(seg.endTime % 60);

      const startTimeStr = `00:${startMins.toString().padStart(2, '0')}:${startSecs.toString().padStart(2, '0')},000`;
      const endTimeStr = `00:${endMins.toString().padStart(2, '0')}:${endSecs.toString().padStart(2, '0')},000`;

      srtContent += `${idx + 1}\n${startTimeStr} --> ${endTimeStr}\n${seg.narration}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_subtitles.srt`;
    a.click();
    audioEngine.playSFX('chime');
  };

  // Narration Script TXT Download
  const handleDownloadScript = () => {
    const audioContent = `Audio Narration Script Export\nProject: ${project.title}\nVoice: ${selectedVoice.name} (${selectedVoice.tone} - ${selectedVoice.accent})\n\n` +
      project.segments.map((s, i) => `[Scene ${i + 1}: ${s.title} (${s.startTime}s - ${s.endTime}s)]\n${s.narration}\n`).join('\n');
    const blob = new Blob([audioContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_narration_script.txt`;
    a.click();
    audioEngine.playSFX('chime');
  };

  // Cover Page / Poster Download
  const handleDownloadCover = async () => {
    audioEngine.playSFX('whoosh');
    try {
      await CoverPageService.downloadCoverImage(project, project.coverStyle || 'cinematic');
      audioEngine.playSFX('chime');
    } catch (err) {
      console.warn('Failed to download cover poster:', err);
    }
  };

  // Quick Voice Swap
  const handleQuickSwapVoice = (voiceId: string) => {
    onUpdateProject({ selectedVoiceId: voiceId });
    audioEngine.playSFX('chime');
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/90 border border-pink-500/30 overflow-hidden shadow-2xl shadow-pink-500/10 backdrop-blur-xl transition-all duration-300">
      {/* Video Header Bar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-pink-500/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <h3 className="font-bold text-white text-sm sm:text-base truncate max-w-xs sm:max-w-md">
            {project.title}
          </h3>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
            {project.aspectRatio === '9:16' ? '9:16 Shorts' : project.aspectRatio === '1:1' ? '1:1 Square' : '16:9 HD'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
            {project.segments.length} Scenes
          </span>
          <span className="bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
            ~{Math.round(project.targetDurationSec || 360)}s
          </span>
        </div>
      </div>

      {/* Embedded High-Definition Video Player (HTML5 Native) */}
      <div className="p-3 sm:p-4 bg-slate-950/60">
        <VideoPlayer
          project={project}
          videoUrl={project.videoUrl}
          currentSegmentIndex={0}
          onUpdateProject={onUpdateProject}
          autoPlay={false}
        />
      </div>

      {/* Interactive Controls & Voice Management Bar */}
      <div className="p-4 bg-slate-900/95 border-t border-pink-500/20 space-y-4">
        {/* Voice Customization Section */}
        <div className="rounded-xl bg-slate-950/70 border border-pink-500/20 p-3.5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${selectedVoice.avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/20 shrink-0`}>
                {selectedVoice.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Narrator Voice:</span>
                  <span className="text-xs font-bold text-white">{selectedVoice.name}</span>
                  <span className="text-[10px] text-pink-300 font-semibold px-1.5 py-0.2 rounded bg-pink-500/20 border border-pink-500/30">
                    {selectedVoice.accent} • {selectedVoice.tone}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Audio & speech narration is synchronized with this voice profile.
                </p>
              </div>
            </div>

            {/* Change Voice Modal Trigger */}
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="btn-cine-secondary flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:scale-105 transition-all cursor-pointer"
            >
              <Mic className="h-3.5 w-3.5 text-pink-400" />
              <span>Change Voice</span>
            </button>
          </div>

          {/* Quick Voice Switcher Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 custom-scrollbar">
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
              Quick Pick:
            </span>
            {VOICES_LIBRARY.slice(0, 5).map((v) => (
              <button
                key={v.id}
                onClick={() => handleQuickSwapVoice(v.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  v.id === project.selectedVoiceId
                    ? 'bg-pink-500/30 border-pink-500 text-pink-200 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-pink-500/30'
                }`}
              >
                <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${v.avatarGradient}`} />
                <span>{v.name}</span>
                {v.id === project.selectedVoiceId && <Check className="h-3 w-3 text-pink-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Master Video Download & Export Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Main Download Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMaster}
              disabled={isDownloading}
              className="btn-cine-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>
                {isDownloading ? `Exporting Master (${downloadProgress}%)...` : 'Download Master .MP4'}
              </span>
            </button>

            <span className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-pink-500/15">
              1080p HD • MP4 Master
            </span>
          </div>

          {/* Auxiliary Downloads (SRT Subtitles, Audio Script) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSRT}
              title="Download Subtitles in SRT format"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-950/60 hover:bg-slate-800 border border-pink-500/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-pink-400" />
              <span>Subtitles (.SRT)</span>
            </button>

            <button
              onClick={handleDownloadScript}
              title="Download Narration Script in TXT format"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-950/60 hover:bg-slate-800 border border-pink-500/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5 text-pink-400" />
              <span>Script (.TXT)</span>
            </button>

            <button
              onClick={handleDownloadCover}
              title="Download High-Resolution Video Cover Page / Poster (.PNG)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-950/60 hover:bg-slate-800 border border-pink-500/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <ImageIcon className="h-3.5 w-3.5 text-pink-400" />
              <span>Poster (.PNG)</span>
            </button>
          </div>
        </div>

        {/* Diffusion Engine Metadata Inspector */}
        <div className="rounded-xl bg-slate-950/50 border border-pink-500/15 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-pink-400" />
              Diffusion Engine Parameters
            </span>
            <span className="font-mono text-[10px] bg-pink-500/10 text-pink-300 px-2 py-0.5 rounded border border-pink-500/20">
              1080p • 60 FPS • Photoreal
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Diffusion Model</span>
              <span className="text-slate-200 font-semibold truncate block">
                {project.aiModel || 'MiniMax Video-01'}
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Lens Preset</span>
              <span className="text-slate-200 font-semibold truncate block">
                {project.segments[0]?.camera3D?.lensPreset || '35mm Cine Prime'}
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Lighting Model</span>
              <span className="text-slate-200 font-semibold truncate block">
                {project.segments[0]?.lighting3D?.environment.replace('_', ' ').toUpperCase() || 'VOLUMETRIC'}
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Aspect Ratio</span>
              <span className="text-slate-200 font-semibold truncate block">
                {project.aspectRatio || '16:9'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Voice Selection Modal */}
      <VoiceSelectorModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        selectedVoiceId={project.selectedVoiceId}
        onSelectVoice={(voiceId) => {
          onUpdateProject({ selectedVoiceId: voiceId });
        }}
      />
    </div>
  );
};
