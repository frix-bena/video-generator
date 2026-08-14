import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Check, 
  Users, 
  ArrowRight, 
  RefreshCw,
  Sliders,
  Tv,
  ArrowLeft,
  Volume2
} from 'lucide-react';
import { Project, Voice } from '../types/cinegen';
import { VOICES_LIBRARY } from '../data/voices';
import { audioEngine } from '../services/audioEngine';
import { VideoPlayer } from './VideoPlayer';

interface VoicePickerStageProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
  onProceed: () => void;
  onBackToVariety?: () => void;
}

export const VoicePickerStage: React.FC<VoicePickerStageProps> = ({
  project,
  onUpdateProject,
  onProceed,
  onBackToVariety,
}) => {
  const [playingSampleVoiceId, setPlayingSampleVoiceId] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(project.selectedVoiceId || VOICES_LIBRARY[0].id);
  const [activeGenderFilter, setActiveGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [activeToneFilter, setActiveToneFilter] = useState<string>('All');
  const [isReRenderingAudio, setIsReRenderingAudio] = useState<boolean>(false);
  const [isMultiSpeakerOpen, setIsMultiSpeakerOpen] = useState<boolean>(false);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [voicePitch, setVoicePitch] = useState<number>(1.0);

  const filteredVoices = VOICES_LIBRARY.filter((v) => {
    if (activeGenderFilter !== 'All' && v.gender !== activeGenderFilter) return false;
    if (activeToneFilter !== 'All' && v.tone !== activeToneFilter) return false;
    return true;
  });

  const selectedVoice = VOICES_LIBRARY.find((v) => v.id === selectedVoiceId) || VOICES_LIBRARY[0];

  const handlePlaySample = (voice: Voice) => {
    if (playingSampleVoiceId === voice.id) {
      audioEngine.stopSpeaking();
      setPlayingSampleVoiceId(null);
    } else {
      audioEngine.stopSpeaking();
      setPlayingSampleVoiceId(voice.id);
      const customVoice: Voice = {
        ...voice,
        speed: (voice.speed || 1.0) * voiceSpeed,
        pitch: (voice.pitch || 1.0) * voicePitch,
      };
      audioEngine.speakNarration(voice.sampleText, customVoice, () => {
        setPlayingSampleVoiceId(null);
      });
    }
  };

  const handleTestOnVideoScene = (voice: Voice) => {
    const activeNarration = project.segments[0]?.narration || voice.sampleText;
    setPlayingSampleVoiceId(voice.id);
    const customVoice: Voice = {
      ...voice,
      speed: (voice.speed || 1.0) * voiceSpeed,
      pitch: (voice.pitch || 1.0) * voicePitch,
    };
    audioEngine.playSFX('whoosh');
    audioEngine.speakNarration(activeNarration, customVoice, () => {
      setPlayingSampleVoiceId(null);
    });
  };

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    setIsReRenderingAudio(true);
    audioEngine.playSFX('whoosh');

    // Scoped audio layer re-render without full visual rebuild
    setTimeout(() => {
      onUpdateProject({ selectedVoiceId: voiceId });
      setIsReRenderingAudio(false);
      audioEngine.playSFX('chime');
    }, 500);
  };

  const handleAssignCharacterVoice = (characterName: string, voiceId: string) => {
    const updated = {
      ...project.characterVoices,
      [characterName]: voiceId,
    };
    onUpdateProject({ characterVoices: updated });
  };

  const uniqueSpeakers = Array.from(new Set(project.segments.map((s) => s.speaker || 'Narrator')));

  return (
    <div className="mx-auto max-w-7xl py-4 sm:py-6 space-y-6">
      {/* Voice Stage Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-pink-500/25 bg-pink-950/20 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-md bg-pink-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-pink-300 border border-pink-500/30">
              STEP 3 • CHOOSE VOICE & NARRATION
            </span>
            <span className="text-xs text-pink-300 font-semibold">• Real-Time Speech Synthesis</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Choose Your Narration Voice
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-0.5 leading-relaxed">
            Audition and select a voice actor. The selected voice is synchronized directly with your chosen video track before downloading.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {onBackToVariety && (
            <button
              onClick={onBackToVariety}
              className="btn-cine-secondary flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold"
              title="Return to Video Variety selection"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-pink-400" />
              <span>Change Video Variety</span>
            </button>
          )}

          <button
            onClick={() => setIsMultiSpeakerOpen(!isMultiSpeakerOpen)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all duration-200 ${
              isMultiSpeakerOpen
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400 shadow-md shadow-pink-500/30'
                : 'btn-cine-secondary'
            }`}
          >
            <Users className="h-4 w-4 text-pink-400" />
            <span>Multi-Speaker Cast ({uniqueSpeakers.length})</span>
          </button>

          <button
            onClick={onProceed}
            className="btn-cine-primary flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition-transform"
          >
            <span>Proceed to Download</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Multi-Speaker Assignment Drawer */}
      {isMultiSpeakerOpen && (
        <div className="glass-panel p-5 rounded-2xl border border-pink-500/30 bg-slate-900/95 space-y-3 shadow-xl">
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-pink-400" />
            <span>Multi-Character Voice Assignment</span>
          </h3>
          <p className="text-xs text-slate-300">
            Assign unique voice actors to different narrative roles in this video.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {uniqueSpeakers.map((speaker) => {
              return (
                <div key={speaker} className="rounded-xl bg-slate-950 p-3 border border-pink-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{speaker}</span>
                    <span className="text-[10px] text-pink-400 font-mono">Role</span>
                  </div>
                  <select
                    value={project.characterVoices?.[speaker] || selectedVoiceId}
                    onChange={(e) => handleAssignCharacterVoice(speaker, e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-pink-500/20 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
                  >
                    {VOICES_LIBRARY.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.accent} {v.tone})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Video Player on Left, Voice Casting Studio on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Chosen Video Player Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Tv className="h-4 w-4 text-pink-400" />
              <span>Chosen Video Master</span>
            </h3>
            <span className="text-xs font-mono text-pink-300 font-bold truncate max-w-[180px]">
              Active Voice: {selectedVoice.name}
            </span>
          </div>

          <VideoPlayer
            project={project}
            videoUrl={project.videoUrl}
            currentSegmentIndex={0}
            onUpdateProject={onUpdateProject}
            autoPlay={false}
          />

          {/* Active Voice Specs Card */}
          <div className="glass-panel p-4 rounded-2xl border border-pink-500/20 bg-slate-950/90 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold text-sm shadow-md">
                  {selectedVoice.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-white">
                    {selectedVoice.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {selectedVoice.accent} • {selectedVoice.tone}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE NARRATOR
              </span>
            </div>

            <p className="text-xs text-slate-300 italic border-l-2 border-pink-500/50 pl-2.5 py-0.5">
              &ldquo;{selectedVoice.sampleText}&rdquo;
            </p>

            {/* Voice Fine-Tuning Sliders */}
            <div className="pt-2 border-t border-pink-500/15 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Sliders className="h-3 w-3 text-pink-400" /> Voice Pacing ({voiceSpeed}x)
                </span>
                <input
                  type="range"
                  min={0.8}
                  max={1.3}
                  step={0.05}
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-28 accent-pink-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Volume2 className="h-3 w-3 text-pink-400" /> Voice Pitch ({voicePitch}x)
                </span>
                <input
                  type="range"
                  min={0.8}
                  max={1.25}
                  step={0.05}
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-28 accent-pink-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Voice Library Grid */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Gender Filter */}
              <div className="flex items-center rounded-xl bg-slate-900 border border-pink-500/20 p-1">
                {(['All', 'Male', 'Female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGenderFilter(g)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                      activeGenderFilter === g
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Tone Filter */}
              <select
                value={activeToneFilter}
                onChange={(e) => setActiveToneFilter(e.target.value)}
                className="rounded-xl bg-slate-900 border border-pink-500/20 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                <option value="All">All Tones</option>
                <option value="Documentary">Documentary</option>
                <option value="Cinematic">Cinematic</option>
                <option value="Conversational">Conversational</option>
                <option value="Energetic">Energetic</option>
                <option value="Historical">Historical</option>
                <option value="Calm">Calm</option>
              </select>
            </div>

            {/* Audio Re-render Status */}
            {isReRenderingAudio && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-pink-400 animate-pulse font-semibold">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Syncing audio track...</span>
              </div>
            )}
          </div>

          {/* Voice Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredVoices.map((voice) => {
              const isSelected = selectedVoiceId === voice.id;
              const isPlayingThis = playingSampleVoiceId === voice.id;

              return (
                <div
                  key={voice.id}
                  onClick={() => handleSelectVoice(voice.id)}
                  className={`glass-card rounded-2xl p-4 border cursor-pointer transition-all duration-200 flex flex-col justify-between group relative overflow-hidden ${
                    isSelected
                      ? 'border-pink-500 bg-pink-950/40 shadow-xl shadow-pink-500/20 ring-2 ring-pink-500'
                      : 'border-pink-500/15 hover:border-pink-500/40 hover:bg-slate-900/80'
                  }`}
                >
                  <div>
                    {/* Avatar & Header */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold text-sm shadow-md">
                          {voice.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                            {voice.name}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {voice.accent} • {voice.age}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-white shadow-sm shadow-pink-600">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    {/* Tone Pill & Descriptor */}
                    <div className="mb-2.5">
                      <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-pink-300 border border-pink-500/20 mb-1">
                        {voice.tone}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {voice.descriptor}
                      </p>
                    </div>

                    {/* Waveform Visualization */}
                    <div className="h-7 flex items-center gap-0.5 px-2 py-1 bg-slate-950/70 rounded-xl mb-3 border border-pink-500/10">
                      {voice.waveform.map((height, wIdx) => (
                        <div
                          key={wIdx}
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            isPlayingThis ? 'bg-pink-400 wave-bar-anim' : isSelected ? 'bg-pink-500' : 'bg-slate-700'
                          }`}
                          style={{
                            height: `${isPlayingThis ? Math.max(20, (height + Math.sin(wIdx) * 30) % 100) : height * 0.7}%`,
                            animationDelay: `${wIdx * 0.05}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sample Preview & Test on Video Buttons */}
                  <div className="pt-2 border-t border-pink-500/10 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySample(voice);
                      }}
                      className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        isPlayingThis
                          ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                          : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-pink-500/20'
                      }`}
                    >
                      {isPlayingThis ? <Pause className="h-3 w-3 fill-white" /> : <Play className="h-3 w-3 fill-current text-pink-400" />}
                      <span>{isPlayingThis ? 'Stop' : 'Audition'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestOnVideoScene(voice);
                      }}
                      className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-pink-300 hover:text-white hover:bg-pink-950/40 border border-pink-500/20 transition-colors"
                      title="Speak the chosen video's first scene narration"
                    >
                      <span>Test on Scene 1</span>
                    </button>

                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {isSelected ? 'ACTIVE' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-pink-500/25 bg-pink-950/30 flex items-center justify-between gap-3 shadow-md">
            <div>
              <p className="text-xs font-bold text-white">
                Voice selected: <span className="text-pink-300 font-display">{selectedVoice.name}</span> ({selectedVoice.tone})
              </p>
              <p className="text-[11px] text-slate-300">
                Ready to preview your complete video master and download.
              </p>
            </div>
            <button
              onClick={onProceed}
              className="btn-cine-primary flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition-transform shrink-0"
            >
              <span>Download Video</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
