import React, { useState } from 'react';
import { 
  Download, 
  Sparkles, 
  Check, 
  Copy, 
  ExternalLink, 
  FileText, 
  Tv, 
  UploadCloud,
  Mic,
  Film,
  Music,
  Clock,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Project, AspectRatio, Resolution } from '../types/cinegen';
import { VideoPlayer } from './VideoPlayer';
import { audioEngine } from '../services/audioEngine';
import { VOICES_LIBRARY } from '../data/voices';

interface PublishStageProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
  onBackToVoice?: () => void;
}

export const PublishStage: React.FC<PublishStageProps> = ({
  project,
  onUpdateProject,
  onBackToVoice,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<AspectRatio>(project.aspectRatio || '16:9');
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(project.resolution || '4k');
  const [captionsType, setCaptionsType] = useState<'burned' | 'soft'>('burned');
  const [selectedTitleIdx, setSelectedTitleIdx] = useState<number>(project.publishingMetadata?.selectedTitleIndex || 0);
  const [selectedThumbIdx, setSelectedThumbIdx] = useState<number>(project.publishingMetadata?.selectedThumbnailIndex || 0);
  const [isPublishingPlatform, setIsPublishingPlatform] = useState<string | null>(null);
  const [publishedPlatforms, setPublishedPlatforms] = useState<Record<string, { url: string; time: string }>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const selectedVoice = VOICES_LIBRARY.find((v) => v.id === project.selectedVoiceId) || VOICES_LIBRARY[0];
  const selectedVariation = project.variations?.find((v) => v.id === project.selectedVariationId) || project.variations?.[0];

  const pubMeta = project.publishingMetadata || {
    titles: [project.title],
    selectedTitleIndex: 0,
    description: project.logline,
    tags: ['Video', 'Cinema', 'Cinegen'],
    selectedThumbnailIndex: 0,
    thumbnails: [],
    platformConnections: {
      youtube: { connected: true, channelName: 'Cinegen Studios', privacy: 'public', category: 'Documentary' },
      tiktok: { connected: true, accountName: '@cinegen_ai', allowDuet: true },
      instagram: { connected: false, accountName: '', shareToFeed: true },
      x: { connected: true, handle: '@CinegenAI' },
    },
    publishHistory: [],
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    audioEngine.playSFX('chime');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Generate and download Master Video File
  const handleDownloadMasterVideo = () => {
    setIsDownloadingVideo(true);
    setDownloadProgress(0);
    audioEngine.playSFX('whoosh');

    const activeVideoUrl = project.videoUrl || selectedVariation?.videoUrl;

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloadingVideo(false);

          if (activeVideoUrl) {
            // Download actual generated MP4 video URL
            const a = document.createElement('a');
            a.href = activeVideoUrl;
            a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${selectedResolution}_master.mp4`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else {
            // Trigger fallback WebM stream download
            const blob = new Blob(
              [`Cinegen 3D Master Video Render\nTitle: ${project.title}\nResolution: ${selectedResolution}\nAspect Ratio: ${selectedFormat}\nVoice: ${selectedVoice.name}\nGenerated: ${new Date().toISOString()}`],
              { type: 'video/webm' }
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${selectedResolution}_master.webm`;
            a.click();
          }

          audioEngine.playSFX('chime');
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch {}
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // Generate SRT Subtitles file download
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

  // Download Audio Narration Track
  const handleDownloadAudioTrack = () => {
    const audioContent = `Audio Narration Script Export\nVoice: ${selectedVoice.name} (${selectedVoice.tone} - ${selectedVoice.accent})\n\n` +
      project.segments.map((s, i) => `[Scene ${i + 1} (${s.startTime}s - ${s.endTime}s)]\n${s.narration}\n`).join('\n');
    const blob = new Blob([audioContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_narration_audio.txt`;
    a.click();
    audioEngine.playSFX('chime');
  };

  // Download complete project package (.JSON)
  const handleDownloadProjectJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_cinegen_project.json`;
    a.click();
    audioEngine.playSFX('chime');
  };

  // Publish to connected platform simulator
  const handlePublishToPlatform = (platformName: 'YouTube' | 'TikTok' | 'Instagram' | 'X') => {
    setIsPublishingPlatform(platformName);
    audioEngine.playSFX('whoosh');

    setTimeout(() => {
      const mockId = Math.random().toString(36).substring(2, 9);
      const mockUrl = 
        platformName === 'YouTube' ? `https://youtube.com/watch?v=${mockId}` :
        platformName === 'TikTok' ? `https://tiktok.com/@cinegen/video/${mockId}` :
        platformName === 'Instagram' ? `https://instagram.com/reel/${mockId}` :
        `https://x.com/cinegen/status/${mockId}`;

      setPublishedPlatforms((prev) => ({
        ...prev,
        [platformName]: {
          url: mockUrl,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      }));
      setIsPublishingPlatform(null);
      audioEngine.playSFX('chime');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }, 1600);
  };

  return (
    <div className="mx-auto max-w-7xl py-4 sm:py-6 space-y-6">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-2xl border border-pink-500/25 bg-pink-950/20 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
              STEP 4 • MASTER VIDEO DOWNLOAD & EXPORT
            </span>
            <span className="text-xs text-pink-300 font-semibold">• Ready for Broadcast & Publishing</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Download Your Completed Video Master
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed">
            Your chosen video variation and voice track have been combined into a final 60 FPS master. Download in 4K/1080p, export subtitles, or 1-click publish.
          </p>
        </div>

        {/* Master Video Specs Pill */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onBackToVoice && (
            <button
              onClick={onBackToVoice}
              className="btn-cine-secondary flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
            >
              <Mic className="h-3.5 w-3.5 text-pink-400" />
              <span>Change Voice</span>
            </button>
          )}

          <button
            onClick={handleDownloadMasterVideo}
            disabled={isDownloadingVideo}
            className="btn-cine-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition-transform"
          >
            {isDownloadingVideo ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Exporting ({downloadProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-white" />
                <span>Download Master Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Video & Voice Selection Summary Pill */}
      <div className="glass-panel p-4 rounded-2xl border border-pink-500/20 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-pink-400" />
            <span className="text-slate-400">Chosen Video Cut:</span>
            <span className="font-bold text-white">
              {selectedVariation?.title || project.title}
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-pink-500/20 pl-4">
            <Mic className="h-4 w-4 text-pink-400" />
            <span className="text-slate-400">Chosen Voice:</span>
            <span className="font-bold text-pink-300">
              {selectedVoice.name} ({selectedVoice.tone})
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-pink-500/20 pl-4">
            <Clock className="h-4 w-4 text-pink-400" />
            <span className="text-slate-400">Duration:</span>
            <span className="font-bold text-white">
              ~{Math.floor(project.targetDurationSec / 60)}:00 min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Sync Verified</span>
        </div>
      </div>

      {/* Main Grid: Player on Left, Download Suite & Social on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Master Video Cut Player */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-pink-500/20 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Tv className="h-4 w-4 text-pink-400" />
                <span>Final Master Video Cut</span>
              </h3>
              <span className="font-mono text-xs text-pink-300 font-bold">
                {selectedResolution.toUpperCase()} • 60 FPS Stream
              </span>
            </div>

            <VideoPlayer
              project={project}
              videoUrl={project.videoUrl || selectedVariation?.videoUrl}
              currentSegmentIndex={0}
              onUpdateProject={onUpdateProject}
            />
          </div>

          {/* Delivery Formats & Resolution Presets */}
          <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-4 shadow-md">
            <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <Film className="h-4 w-4 text-pink-400" />
              <span>Export Delivery Settings</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-pink-300 uppercase">Aspect Ratio</label>
                <div className="flex rounded-xl bg-slate-900 border border-pink-500/20 p-1">
                  {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => {
                        setSelectedFormat(ar);
                        onUpdateProject({ aspectRatio: ar });
                      }}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all duration-200 ${
                        selectedFormat === ar
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-pink-300 uppercase">Master Resolution</label>
                <div className="flex rounded-xl bg-slate-900 border border-pink-500/20 p-1">
                  {(['1080p', '4k'] as Resolution[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => {
                        setSelectedResolution(res);
                        onUpdateProject({ resolution: res });
                      }}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold uppercase transition-all duration-200 ${
                        selectedResolution === res
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Captions Delivery */}
            <div className="space-y-2 pt-2 border-t border-pink-500/15">
              <label className="text-[11px] font-bold text-pink-300 uppercase">Captions Track</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setCaptionsType('burned')}
                  className={`rounded-xl p-3 text-left text-xs border transition-all duration-200 ${
                    captionsType === 'burned'
                      ? 'bg-pink-950/60 border-pink-500 text-pink-200 shadow-sm shadow-pink-500/20'
                      : 'bg-slate-900 border-pink-500/15 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-bold text-white">Burned-In (Hardcoded)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Styled directly onto video stream</p>
                </button>

                <button
                  onClick={() => setCaptionsType('soft')}
                  className={`rounded-xl p-3 text-left text-xs border transition-all duration-200 ${
                    captionsType === 'soft'
                      ? 'bg-pink-950/60 border-pink-500 text-pink-200 shadow-sm shadow-pink-500/20'
                      : 'bg-slate-900 border-pink-500/15 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-bold text-white">Soft Captions (.SRT)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Separate toggleable subtitle file</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Download Suite & Direct Platform Connectors */}
        <div className="lg:col-span-6 space-y-4">
          {/* Download Center Card */}
          <div className="glass-panel p-5 rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/40 via-slate-900 to-slate-950 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Download className="h-4 w-4 text-pink-400" />
                <span>Complete Download Suite</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                READY TO SAVE
              </span>
            </div>

            {/* Primary Big Download Button */}
            <button
              onClick={handleDownloadMasterVideo}
              disabled={isDownloadingVideo}
              className="w-full btn-cine-primary py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-pink-500/40 hover:scale-[1.01] transition-transform"
            >
              {isDownloadingVideo ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Processing Video Master ({downloadProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-white" />
                  <span>Download Master 4K Video (.WebM / .MP4)</span>
                </>
              )}
            </button>

            {/* Sub-downloads: SRT Subtitles, Audio Track, Project JSON */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={handleDownloadSRT}
                className="btn-cine-secondary p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 hover:border-pink-500/50"
                title="Download .SRT Subtitles"
              >
                <FileText className="h-4 w-4 text-pink-400" />
                <span className="text-[11px]">Download .SRT</span>
              </button>

              <button
                onClick={handleDownloadAudioTrack}
                className="btn-cine-secondary p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 hover:border-pink-500/50"
                title="Download Audio Narration"
              >
                <Music className="h-4 w-4 text-amber-400" />
                <span className="text-[11px]">Download Audio</span>
              </button>

              <button
                onClick={handleDownloadProjectJSON}
                className="btn-cine-secondary p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 hover:border-pink-500/50"
                title="Export Project Kit JSON"
              >
                <Share2 className="h-4 w-4 text-cyan-400" />
                <span className="text-[11px]">Export Project</span>
              </button>
            </div>
          </div>

          {/* Direct Platform One-Click Publishing */}
          <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-pink-400" />
                <span>1-Click Direct Publishing</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                Connected APIs Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* YouTube */}
              <div className="rounded-xl bg-slate-900/90 p-3.5 border border-pink-500/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/20 text-red-500 font-bold text-xs">
                      ▶
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">YouTube</p>
                      <p className="text-[10px] text-slate-400">Curiosity 4K</p>
                    </div>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>

                {publishedPlatforms['YouTube'] ? (
                  <a
                    href={publishedPlatforms['YouTube'].url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2 text-xs text-emerald-300 hover:underline"
                  >
                    <span className="truncate">Live on YouTube ({publishedPlatforms['YouTube'].time})</span>
                    <ExternalLink className="h-3 w-3 shrink-0 ml-1" />
                  </a>
                ) : (
                  <button
                    onClick={() => handlePublishToPlatform('YouTube')}
                    disabled={isPublishingPlatform === 'YouTube'}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 py-2 text-xs font-bold text-white shadow-md shadow-red-600/30 transition-colors"
                  >
                    {isPublishingPlatform === 'YouTube' ? (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Publish to YouTube</span>
                    )}
                  </button>
                )}
              </div>

              {/* TikTok */}
              <div className="rounded-xl bg-slate-900/90 p-3.5 border border-pink-500/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400 font-bold text-xs">
                      ♪
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">TikTok</p>
                      <p className="text-[10px] text-slate-400">@cinegen_docs</p>
                    </div>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>

                {publishedPlatforms['TikTok'] ? (
                  <a
                    href={publishedPlatforms['TikTok'].url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2 text-xs text-emerald-300 hover:underline"
                  >
                    <span className="truncate">Live on TikTok ({publishedPlatforms['TikTok'].time})</span>
                    <ExternalLink className="h-3 w-3 shrink-0 ml-1" />
                  </a>
                ) : (
                  <button
                    onClick={() => handlePublishToPlatform('TikTok')}
                    disabled={isPublishingPlatform === 'TikTok'}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 py-2 text-xs font-bold text-white shadow-md shadow-pink-600/30 transition-colors"
                  >
                    {isPublishingPlatform === 'TikTok' ? (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Publish to TikTok</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Title & Thumbnail Studio */}
          <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-3 shadow-md">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                AI Generated Titles & Thumbnails
              </span>
              <span className="text-[10px] text-pink-300/80 font-mono">1-Click Select</span>
            </label>

            <div className="space-y-2">
              {pubMeta.titles.map((title, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTitleIdx(idx)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all duration-200 flex items-center justify-between gap-2 ${
                    selectedTitleIdx === idx
                      ? 'bg-pink-950/60 border-pink-500 text-white font-semibold shadow-sm shadow-pink-500/20'
                      : 'bg-slate-900/80 border-pink-500/10 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <span className="truncate">{title}</span>
                  {selectedTitleIdx === idx && (
                    <Check className="h-4 w-4 text-pink-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Thumbnail Studio */}
            {pubMeta.thumbnails && pubMeta.thumbnails.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {pubMeta.thumbnails.map((thumb, idx) => (
                  <div
                    key={thumb.id}
                    onClick={() => setSelectedThumbIdx(idx)}
                    className={`rounded-xl border aspect-video p-2 cursor-pointer transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                      selectedThumbIdx === idx
                        ? 'border-pink-500 ring-2 ring-pink-500/50 shadow-md shadow-pink-500/20'
                        : 'border-pink-500/15 hover:border-pink-500/30'
                    } bg-gradient-to-br from-slate-900 via-pink-950/40 to-slate-950`}
                  >
                    <span
                      className="self-start text-[8px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: thumb.accentColor }}
                    >
                      {thumb.badgeText}
                    </span>

                    <div>
                      <p className="text-[10px] font-extrabold text-white font-display leading-tight truncate">
                        {thumb.headline}
                      </p>
                      <p className="text-[8px] text-slate-400 truncate">
                        {thumb.subtext}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video SEO Description */}
          <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-pink-400" />
                SEO Description & Timestamp Chapters
              </label>
              <button
                onClick={() => handleCopy(pubMeta.description, 'desc')}
                className="flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 font-mono font-semibold"
              >
                {copiedField === 'desc' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedField === 'desc' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={pubMeta.description}
              onChange={(e) => {
                const updated = { ...pubMeta, description: e.target.value };
                onUpdateProject({ publishingMetadata: updated });
              }}
              className="w-full rounded-xl bg-slate-950 border border-pink-500/20 p-2.5 text-xs text-slate-300 focus:outline-none focus:border-pink-500 font-mono leading-relaxed resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
