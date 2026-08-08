import React, { useState } from 'react';
import { 
  Share2, 
  Download, 
  Sparkles, 
  Check, 
  Copy, 
  ExternalLink, 
  FileText, 
  Tv, 
  UploadCloud,
  Video,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Project, AspectRatio, Resolution } from '../types/cinegen';
import { VideoPlayer } from './VideoPlayer';
import { audioEngine } from '../services/audioEngine';

interface PublishStageProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
}

export const PublishStage: React.FC<PublishStageProps> = ({
  project,
  onUpdateProject,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<AspectRatio>(project.aspectRatio || '16:9');
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(project.resolution || '4k');
  const [captionsType, setCaptionsType] = useState<'burned' | 'soft'>('burned');
  const [selectedTitleIdx, setSelectedTitleIdx] = useState<number>(project.publishingMetadata?.selectedTitleIndex || 0);
  const [selectedThumbIdx, setSelectedThumbIdx] = useState<number>(project.publishingMetadata?.selectedThumbnailIndex || 0);
  const [isPublishingPlatform, setIsPublishingPlatform] = useState<string | null>(null);
  const [publishedPlatforms, setPublishedPlatforms] = useState<Record<string, { url: string; time: string }>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }, 1800);
  };

  return (
    <div className="mx-auto max-w-6xl py-6 px-4 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
              STAGE 6 • FINALIZE & PUBLISH
            </span>
            <span className="text-xs text-slate-400">• Ready for Global Distribution</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            Export Master & Direct Publish
          </h2>
          <p className="text-xs text-slate-400">
            Export in 4K broadcast formats or publish directly to YouTube, TikTok, and Instagram with synchronized metadata.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSRT}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200"
            title="Download .SRT Subtitles"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            <span>Download .SRT</span>
          </button>

          <button
            onClick={handleDownloadProjectJSON}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200"
            title="Download Complete Cinegen Project JSON"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Export Project Kit</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Player on Left, Metadata & Publish Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player & Export Presets */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Tv className="h-4 w-4 text-indigo-400" />
                <span>Master Video Final Cut</span>
              </h3>
              <span className="font-mono text-xs text-amber-400">
                06:00 (360s) • 4K UHD
              </span>
            </div>

            <VideoPlayer
              project={project}
              currentSegmentIndex={0}
              onUpdateProject={onUpdateProject}
            />
          </div>

          {/* Delivery Formats & Resolution Presets */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-4">
            <h4 className="font-display text-sm font-bold text-white">
              Export Delivery Specifications
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase">Aspect Ratio</label>
                <div className="flex rounded-lg bg-slate-900 border border-white/10 p-1">
                  {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => {
                        setSelectedFormat(ar);
                        onUpdateProject({ aspectRatio: ar });
                      }}
                      className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                        selectedFormat === ar ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase">Master Resolution</label>
                <div className="flex rounded-lg bg-slate-900 border border-white/10 p-1">
                  {(['1080p', '4k'] as Resolution[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => {
                        setSelectedResolution(res);
                        onUpdateProject({ resolution: res });
                      }}
                      className={`flex-1 rounded py-1 text-xs font-medium uppercase transition-colors ${
                        selectedResolution === res ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Captions Delivery */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase">Captions Track</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCaptionsType('burned')}
                  className={`rounded-lg p-2 text-left text-xs border transition-all ${
                    captionsType === 'burned'
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-semibold text-white">Burned-In (Hardcoded)</p>
                  <p className="text-[10px] text-slate-400">Styled directly on video stream</p>
                </button>

                <button
                  onClick={() => setCaptionsType('soft')}
                  className={`rounded-lg p-2 text-left text-xs border transition-all ${
                    captionsType === 'soft'
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-semibold text-white">Soft Captions (.SRT)</p>
                  <p className="text-[10px] text-slate-400">Separate toggleable subtitle file</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Publishing Kit & Direct Platform Connectors */}
        <div className="lg:col-span-6 space-y-4">
          {/* Direct Platform One-Click Publishing */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-indigo-400" />
                <span>One-Click Direct Publishing</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">
                Connected APIs Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* YouTube */}
              <div className="rounded-xl bg-slate-900/80 p-3.5 border border-white/5 space-y-3">
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
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 py-1.5 text-xs font-semibold text-white transition-colors"
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
              <div className="rounded-xl bg-slate-900/80 p-3.5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs">
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
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 py-1.5 text-xs font-semibold text-white transition-colors"
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

          {/* AI Title Variants */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                AI Generated Title Variants
              </span>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Select</span>
            </label>

            <div className="space-y-2">
              {pubMeta.titles.map((title, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTitleIdx(idx)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    selectedTitleIdx === idx
                      ? 'bg-indigo-950/60 border-indigo-500 text-white font-medium shadow-sm'
                      : 'bg-slate-900/80 border-white/5 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <span className="truncate">{title}</span>
                  {selectedTitleIdx === idx && (
                    <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Thumbnail Studio */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-indigo-400" />
              AI Thumbnail Studio (3 Variants)
            </h4>

            <div className="grid grid-cols-3 gap-2.5">
              {pubMeta.thumbnails.map((thumb, idx) => (
                <div
                  key={thumb.id}
                  onClick={() => setSelectedThumbIdx(idx)}
                  className={`rounded-xl border aspect-video p-2 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                    selectedThumbIdx === idx
                      ? 'border-amber-500 ring-2 ring-amber-500/50 shadow-md'
                      : 'border-white/10 hover:border-white/30'
                  } bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-950`}
                >
                  <span
                    className="self-start text-[8px] font-bold px-1 py-0.5 rounded text-white"
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
          </div>

          {/* Video Description & Tags */}
          <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                SEO Description & Timestamp Chapters
              </label>
              <button
                onClick={() => handleCopy(pubMeta.description, 'desc')}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-mono"
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
              className="w-full rounded-lg bg-slate-950 border border-white/10 p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-none"
            />

            {/* Hashtag Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {pubMeta.tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-indigo-300 border border-white/5"
                >
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
