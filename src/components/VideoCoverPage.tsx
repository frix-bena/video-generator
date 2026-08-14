import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Download, 
  Image as ImageIcon, 
  Palette, 
  Tv, 
  Film, 
  Clock, 
  Volume2, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import { Project, CoverStyle } from '../types/cinegen';
import { CoverPageService, CoverTopicInfo } from '../services/coverPageService';
import { VOICES_LIBRARY } from '../data/voices';
import { audioEngine } from '../services/audioEngine';

export interface VideoCoverPageProps {
  project?: Project;
  onPlay: () => void;
  onUpdateProject?: (updated: Partial<Project>) => void;
  className?: string;
}

export const VideoCoverPage: React.FC<VideoCoverPageProps> = ({
  project,
  onPlay,
  onUpdateProject,
  className = '',
}) => {
  const [selectedStyle, setSelectedStyle] = useState<CoverStyle>(project?.coverStyle || 'cinematic');
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);

  // Topic classification from prompt & title
  const topicInfo: CoverTopicInfo = CoverPageService.detectCoverTopic(
    project?.prompt,
    project?.title,
    project?.colorGrade,
    project?.segments?.flatMap((s) => s.visualKeywords || [])
  );

  const allImages = [
    project?.coverUrl || topicInfo.coverImageUrl,
    ...topicInfo.alternateImageUrls,
  ].filter(Boolean);

  const activeImageUrl = allImages[currentImageIndex % allImages.length] || topicInfo.coverImageUrl;
  const selectedVoice = VOICES_LIBRARY.find((v) => v.id === project?.selectedVoiceId) || VOICES_LIBRARY[0];
  const durationSec = project?.targetDurationSec || 360;
  const mins = Math.floor(durationSec / 60);
  const secs = Math.floor(durationSec % 60);
  const formattedDuration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playSFX('whoosh');
    onPlay();
  };

  const handleCycleImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playSFX('click');
    const nextIdx = (currentImageIndex + 1) % allImages.length;
    setCurrentImageIndex(nextIdx);
    onUpdateProject?.({ coverUrl: allImages[nextIdx] });
  };

  const handleSelectStyle = (style: CoverStyle, e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playSFX('click');
    setSelectedStyle(style);
    onUpdateProject?.({ coverStyle: style });
    setShowStyleMenu(false);
  };

  const handleDownloadPoster = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!project) return;
    setIsDownloading(true);
    audioEngine.playSFX('whoosh');
    try {
      await CoverPageService.downloadCoverImage(
        {
          ...project,
          coverUrl: activeImageUrl,
          coverStyle: selectedStyle,
        },
        selectedStyle
      );
      audioEngine.playSFX('chime');
    } catch (err) {
      console.warn('Cover download warning:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      onClick={handlePlayClick}
      className={`absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 cursor-pointer select-none overflow-hidden transition-all duration-500 group/cover ${className}`}
    >
      {/* Background Image with Ambient Zoom & Parallax */}
      <div className="absolute inset-0 overflow-hidden -z-10 bg-slate-950">
        <img
          src={activeImageUrl}
          alt={project?.title || 'Video Cover Page'}
          className="w-full h-full object-cover transform scale-105 group-hover/cover:scale-110 transition-transform duration-700 ease-out filter brightness-[0.85] contrast-[1.05]"
          loading="eager"
        />

        {/* Dynamic Thematic Gradient Overlays & Scrim */}
        <div className={`absolute inset-0 bg-gradient-to-t ${topicInfo.gradientOverlay} opacity-85 transition-opacity duration-300 group-hover/cover:opacity-75`} />
        
        {/* Radial Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/90 pointer-events-none" />
      </div>

      {/* Top Header Bar: Badges, Resolution, Aspect Ratio, Cover Controls */}
      <div className="flex items-center justify-between gap-2 z-10">
        {/* Topic / Genre Tag Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-pink-500/40 text-pink-200 text-xs font-bold shadow-lg shadow-pink-500/15">
            <Sparkles className="h-3.5 w-3.5 text-pink-400 animate-pulse" />
            <span>{project?.coverBadge || topicInfo.badge}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 text-[11px] font-mono">
            <span>1080p 60 FPS</span>
          </div>
        </div>

        {/* Right Action Tools: Alternate Art & Style Switcher & Duration */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Duration Pill */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-slate-200 text-xs font-mono">
            <Clock className="h-3 w-3 text-pink-400" />
            <span>{formattedDuration}</span>
          </div>

          {/* Cycle Alternate Cover Art Button */}
          {allImages.length > 1 && (
            <button
              type="button"
              onClick={handleCycleImage}
              title="Switch to alternate topic cover artwork"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 hover:bg-slate-800 backdrop-blur-md border border-pink-500/30 text-slate-200 text-xs font-medium transition-colors hover:text-white"
            >
              <RefreshCw className="h-3 w-3 text-pink-400" />
              <span className="hidden md:inline">Artwork</span>
            </button>
          )}

          {/* Cover Style Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStyleMenu((prev) => !prev)}
              title="Change Cover Page Aesthetic Style"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 hover:bg-slate-800 backdrop-blur-md border border-pink-500/30 text-slate-200 text-xs font-medium transition-colors hover:text-white"
            >
              <Palette className="h-3 w-3 text-pink-400" />
              <span className="capitalize hidden md:inline">{selectedStyle}</span>
            </button>

            {showStyleMenu && (
              <div 
                className="absolute right-0 top-full mt-1.5 flex flex-col rounded-xl bg-slate-900/95 border border-pink-500/30 p-1 shadow-2xl z-30 min-w-[140px] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowStyleMenu(false)}
              >
                {(['cinematic', 'documentary', 'neon', 'minimal', 'vintage'] as CoverStyle[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={(e) => handleSelectStyle(style, e)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs capitalize text-left transition-colors ${
                      selectedStyle === style ? 'bg-pink-600 text-white font-bold' : 'text-slate-300 hover:bg-pink-950/60 hover:text-white'
                    }`}
                  >
                    <span>{style}</span>
                    {selectedStyle === style && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download Cover Art Button */}
          <button
            type="button"
            onClick={handleDownloadPoster}
            disabled={isDownloading}
            title="Download High-Resolution Cover Poster (.PNG)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/20 hover:bg-pink-500/30 backdrop-blur-md border border-pink-500/40 text-pink-200 text-xs font-semibold transition-all hover:scale-105"
          >
            <Download className="h-3 w-3 text-pink-300" />
            <span className="hidden sm:inline">{isDownloading ? 'Exporting...' : 'Poster'}</span>
          </button>
        </div>
      </div>

      {/* Center Hero Play Button */}
      <div className="flex flex-col items-center justify-center my-auto py-4 text-center z-10 pointer-events-none">
        <div 
          className="relative flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 text-white shadow-2xl shadow-pink-500/60 group-hover/cover:scale-110 transition-transform duration-300 ring-4 ring-pink-500/30 animate-pulse"
        >
          {/* Animated Glow Halo */}
          <div className="absolute inset-0 rounded-full bg-pink-400 blur-xl opacity-50 group-hover/cover:opacity-80 transition-opacity" />
          
          <Play className="h-9 w-9 sm:h-11 sm:w-11 translate-x-0.5 fill-white relative z-10 drop-shadow-md" />
        </div>

        <div className="mt-3.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold tracking-wider uppercase shadow-lg group-hover/cover:border-pink-500/40 group-hover/cover:text-pink-300 transition-colors">
          ▶ Click to Play Video
        </div>
      </div>

      {/* Bottom Title Card & Film Metadata */}
      <div className="z-10 space-y-2.5 pt-2">
        <div>
          {/* Stylized Category Hook */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold font-mono tracking-widest uppercase text-pink-400 drop-shadow-sm">
              {topicInfo.category}
            </span>
          </div>

          {/* Main Title */}
          <h2 className={`font-black text-white leading-tight tracking-tight drop-shadow-lg text-lg sm:text-2xl md:text-3xl max-w-2xl ${
            selectedStyle === 'neon' 
              ? 'text-pink-300 font-mono drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]' 
              : selectedStyle === 'documentary' 
              ? 'font-serif text-slate-100' 
              : selectedStyle === 'minimal' 
              ? 'font-light tracking-wide text-white' 
              : 'font-extrabold text-white font-display'
          }`}>
            {project?.title || 'Cinematic 3D Video Masterpiece'}
          </h2>

          {/* Logline / Narrative summary */}
          <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-2 max-w-2xl mt-1 drop-shadow font-medium">
            {project?.logline || topicInfo.tagline}
          </p>
        </div>

        {/* Lower Production Credits Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-300 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-pink-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Narrator: {selectedVoice.name}</span>
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-400">
              {project?.musicStyle?.split(' ')[0] || 'Orchestral'} Score
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] text-pink-300 font-bold">
              CINEGEN 3D STUDIO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCoverPage;
