import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  Layers, 
  ChevronRight,
  Box,
  Sliders,
  CheckCircle2,
  Flame,
  Film,
  Cpu,
  Zap
} from 'lucide-react';
import { SAMPLE_PROMPT_PRESETS } from '../data/defaultProjects';
import { AspectRatio } from '../types/cinegen';
import { AiGeneratorService } from '../services/aiGeneratorService';
import { VideoApiService, VideoModelInfo } from '../services/videoApiService';
import { audioEngine } from '../services/audioEngine';

interface PromptStageProps {
  onGenerate: (
    prompt: string, 
    options: { 
      duration: number; 
      aspectRatio: AspectRatio; 
      autonomous: boolean; 
      is3D: boolean;
      model?: string;
      generateDirectAiVideo?: boolean;
    }
  ) => void;
  isLoading: boolean;
}

const QUICK_STYLES = [
  { id: 'cinematic', label: '🎬 Cinematic 3D', cue: 'shot with anamorphic prime lenses, dramatic volumetric lighting, and sweeping 3D camera crane orbits' },
  { id: 'cyberpunk', label: '⚡ Cyberpunk Velocity', cue: 'high-speed FPV drone sweeps, neon cyan and magenta volumetric fog, and synthwave electronic pulse' },
  { id: 'natgeo', label: '🌿 NatGeo Nature', cue: 'intimate macro depth of field, naturalistic highland mist lighting, and contemplative documentary pacing' },
  { id: 'tech', label: '💡 Tech Explainer', cue: 'cleanroom studio lighting, 3D geometric framing, vibrant kinetic subtitles, and upbeat creator energy' },
  { id: 'historical', label: '🏛️ Historical Epic', cue: 'candlelit tavern atmosphere, antique brass textures, and rich historical narration gravitas' },
  { id: 'luxury', label: '✨ Luxury Aesthetic', cue: 'macro PBR liquid reflections, gold leaf specular highlights, and pristine broadcast color grading' },
];

export const PromptStage: React.FC<PromptStageProps> = ({ onGenerate, isLoading }) => {
  const [promptText, setPromptText] = useState<string>(
    'A 30-year-old woman drinking coffee in a dimly lit rustic cafe by a rain-streaked window, shot on ARRI Alexa 65, 85mm lens, f/1.4, cinematic bokeh, 8k photorealistic'
  );
  const [selectedDuration, setSelectedDuration] = useState<number>(360); // 60s, 180s, 360s
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('16:9');
  const [is3DModeActive, setIs3DModeActive] = useState<boolean>(true);
  const [selectedStyleTag, setSelectedStyleTag] = useState<string | null>('cinematic');
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('minimax/video-01');
  const [models, setModels] = useState<VideoModelInfo[]>([]);
  const [hasReplicate, setHasReplicate] = useState<boolean>(false);
  const [hasFal, setHasFal] = useState<boolean>(false);

  // Load available models and API status
  useEffect(() => {
    VideoApiService.getModels().then((data) => {
      if (data.models && data.models.length > 0) {
        setModels(data.models);
        setSelectedModel(data.defaultModel || data.models[0].id);
      }
      setHasReplicate(data.hasReplicateToken);
      setHasFal(data.hasFalKey);
    });
  }, []);

  const handleGenerateDirectAiVideo = () => {
    if (!promptText.trim() || isLoading) return;
    audioEngine.playSFX('whoosh');
    onGenerate(promptText, {
      duration: selectedDuration,
      aspectRatio: selectedAspectRatio,
      autonomous: true,
      is3D: is3DModeActive,
      model: selectedModel,
      generateDirectAiVideo: true,
    });
  };

  const handleGenerateVariety = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim() || isLoading) return;
    audioEngine.playSFX('whoosh');
    onGenerate(promptText, {
      duration: selectedDuration,
      aspectRatio: selectedAspectRatio,
      autonomous: true,
      is3D: is3DModeActive,
      model: selectedModel,
      generateDirectAiVideo: false,
    });
  };

  const handleSelectPreset = (presetPrompt: string) => {
    setPromptText(presetPrompt);
    audioEngine.playSFX('click');
  };

  const handleApplyStyle = (style: typeof QUICK_STYLES[0]) => {
    setSelectedStyleTag(style.id);
    audioEngine.playSFX('click');
    if (!promptText.includes(style.cue)) {
      setPromptText((prev) => {
        const cleaned = prev.trim();
        return `${cleaned}, ${style.cue}`;
      });
    }
  };

  const handleMagicEnhance = () => {
    if (!promptText.trim()) return;
    setIsEnhancing(true);
    audioEngine.playSFX('chime');
    setTimeout(() => {
      const enhanced = AiGeneratorService.enhancePrompt(promptText);
      setPromptText(enhanced);
      setIsEnhancing(false);
    }, 450);
  };

  return (
    <div className="mx-auto max-w-5xl py-4 sm:py-6 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/15 px-4 py-1.5 text-xs font-semibold text-pink-300 border border-pink-500/30 shadow-sm">
          <Zap className="h-3.5 w-3.5 text-pink-400 animate-pulse" />
          <span>VisionaryAI Cinematic Studio • Replicate & Fal.ai Video API</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Describe How You Want <span className="text-gradient-pink">Your Video To Be</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Translate your creative vision into ultra-photorealistic video prompts rendered with <strong>Minimax Video-01, Luma Dream Machine, or Runway Gen-3</strong>.
        </p>
      </div>

      {/* 4-Step Visual Workflow Pill Bar */}
      <div className="glass-panel p-3.5 rounded-2xl border border-pink-500/20 bg-slate-900/60 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-200 font-bold shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-[10px] text-white">1</span>
            <span>Write Prompt</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-pink-500/10 text-slate-300 font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-300">2</span>
            <span>Choose Video Variety</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-pink-500/10 text-slate-300 font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-300">3</span>
            <span>Select Voice Track</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-pink-500/10 text-slate-300 font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-300">4</span>
            <span>Download Master</span>
          </div>
        </div>
      </div>

      {/* Main Single Prompt Bar Card */}
      <div className="glass-panel-glow p-6 sm:p-8 rounded-2xl border border-pink-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pink-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />

        <form onSubmit={handleGenerateVariety} className="space-y-4 relative z-10">
          {/* Prompt Writing Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-300 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                <span>What kind of video do you want to direct?</span>
              </label>

              <div className="flex items-center gap-2">
                {/* Live Backend Connection Indicator */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-pink-500/20 text-[11px] font-mono">
                  <span className={`h-2 w-2 rounded-full ${hasReplicate || hasFal ? 'bg-emerald-400 animate-pulse' : 'bg-pink-400'}`} />
                  <span className="text-slate-300">
                    {hasReplicate ? 'Replicate Live' : hasFal ? 'Fal.ai Live' : 'Autonomous Engine'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleMagicEnhance}
                  disabled={isEnhancing || !promptText.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 px-3 py-1 text-xs font-semibold text-pink-300 transition-all shadow-sm hover:scale-[1.02]"
                  title="Automatically expand prompt with professional cinematography, camera moves, and lighting keywords"
                >
                  <Wand2 className={`h-3.5 w-3.5 text-pink-400 ${isEnhancing ? 'animate-spin' : ''}`} />
                  <span>{isEnhancing ? 'Enhancing...' : '✨ VisionaryAI Enhance'}</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g. A 30-year-old woman drinking coffee by a rain-streaked window, shot on ARRI Alexa 65, 85mm lens, f/1.4, cinematic bokeh..."
                className="w-full rounded-xl bg-slate-950/90 border border-pink-500/25 px-4 py-3.5 text-base sm:text-lg text-white placeholder-slate-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30 focus:outline-none resize-none transition-all shadow-inner leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-xs text-pink-300/70 font-mono">
                {promptText.length} chars
              </div>
            </div>
          </div>

          {/* Quick Aesthetic Styles Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-3 w-3 text-pink-400" />
              <span>Directorial Aesthetic & Cinematic Mood:</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_STYLES.map((style) => {
                const isActive = selectedStyleTag === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => handleApplyStyle(style)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-all duration-200 ${
                      isActive
                        ? 'bg-pink-500/25 text-pink-200 border-pink-500/60 shadow-sm shadow-pink-500/20 font-semibold'
                        : 'bg-slate-900/80 text-slate-300 border-pink-500/15 hover:border-pink-500/40 hover:bg-slate-850'
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Model Selection & Configuration Controls */}
          <div className="space-y-3 pt-3 border-t border-pink-500/15">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* AI Video Model Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-pink-300 uppercase flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5 text-pink-400" /> Model:
                </span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="rounded-xl bg-slate-900 border border-pink-500/30 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500 cursor-pointer shadow-sm"
                >
                  {models.length > 0 ? (
                    models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.badge})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="minimax/video-01">Minimax Video-01 (Replicate)</option>
                      <option value="luma/ray">Luma Dream Machine (Ray)</option>
                      <option value="fal-ai/minimax-video">Fal.ai Minimax Video</option>
                      <option value="fal-ai/luma-dream-machine">Fal.ai Luma Dream Machine</option>
                      <option value="runway/gen-3">Runway Gen-3 Alpha</option>
                    </>
                  )}
                </select>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="flex items-center rounded-xl bg-slate-900 border border-pink-500/20 p-1">
                {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setSelectedAspectRatio(ar)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                      selectedAspectRatio === ar
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ar === '16:9' ? '16:9 (Landscape)' : ar === '9:16' ? '9:16 (Shorts / Reels)' : '1:1 (Square)'}
                  </button>
                ))}
              </div>

              {/* Duration Options */}
              <div className="flex items-center rounded-xl bg-slate-900 border border-pink-500/20 p-1">
                {[
                  { sec: 60, label: '~1:00 min' },
                  { sec: 180, label: '~3:00 min' },
                  { sec: 360, label: '~6:00 min' },
                ].map((dur) => (
                  <button
                    key={dur.sec}
                    type="button"
                    onClick={() => setSelectedDuration(dur.sec)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                      selectedDuration === dur.sec
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dur.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Generate Real AI Video vs 3D Variations */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              {/* Generate AI Video Button (Calls backend /api/generate-video) */}
              <button
                type="button"
                onClick={handleGenerateDirectAiVideo}
                disabled={isLoading || !promptText.trim()}
                className="btn-cine-primary flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-xl shadow-pink-500/40 disabled:opacity-50 hover:scale-[1.02] transition-transform"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Rendering AI Video...</span>
                  </>
                ) : (
                  <>
                    <Film className="h-4 w-4 text-white" />
                    <span>Generate AI Video ({selectedModel.split('/')[1]?.toUpperCase() || 'MINIMAX'})</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Generate 3D Variety (4 Cuts) */}
              <button
                type="button"
                onClick={handleGenerateVariety}
                disabled={isLoading || !promptText.trim()}
                className="btn-cine-secondary flex items-center gap-2 rounded-xl px-5 py-3 text-xs sm:text-sm font-bold hover:border-pink-500/60"
              >
                <Layers className="h-4 w-4 text-pink-300" />
                <span>Synthesize 4 Video Variations</span>
              </button>
            </div>
          </div>
        </form>

        {/* Variety Generation Benefit Note */}
        <div className="mt-4 pt-3 border-t border-pink-500/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-pink-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-pink-400" />
            <span>Asynchronous video synthesis with live progress percentage & HTML5 MP4 player integration.</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">Set keys in .env</span>
        </div>
      </div>

      {/* Preset Inspiration Prompts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-pink-400" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-200">
              Photorealistic Prompt Presets
            </h3>
          </div>
          <span className="text-xs text-pink-400 font-mono">1-Click Load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {SAMPLE_PROMPT_PRESETS.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectPreset(preset.prompt)}
              className="glass-card p-4 rounded-xl cursor-pointer group hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{preset.icon}</span>
                    <span className="text-xs font-semibold text-pink-300 bg-pink-500/15 px-2 py-0.5 rounded-md border border-pink-500/25">
                      {preset.category}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{preset.duration}</span>
                </div>
                <h4 className="font-display text-sm font-bold text-white group-hover:text-pink-300 transition-colors mb-1.5">
                  {preset.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.prompt}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-pink-500/10 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] italic text-slate-400">{preset.tone}</span>
                <span className="flex items-center gap-1 font-semibold text-pink-400 group-hover:translate-x-1 transition-transform">
                  Load Prompt <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromptStage;
