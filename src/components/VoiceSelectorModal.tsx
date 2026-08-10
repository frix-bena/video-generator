import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Check, 
  Volume2, 
  Sparkles,
  Mic,
  SlidersHorizontal
} from 'lucide-react';
import { Voice } from '../types/cinegen';
import { VOICES_LIBRARY } from '../data/voices';
import { audioEngine } from '../services/audioEngine';

interface VoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
}

export const VoiceSelectorModal: React.FC<VoiceSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice,
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [toneFilter, setToneFilter] = useState<string>('All');

  if (!isOpen) return null;

  const filteredVoices = VOICES_LIBRARY.filter((v) => {
    if (genderFilter !== 'All' && v.gender !== genderFilter) return false;
    if (toneFilter !== 'All' && v.tone !== toneFilter) return false;
    return true;
  });

  const handlePlaySample = (voice: Voice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingVoiceId === voice.id) {
      audioEngine.stopSpeaking();
      setPlayingVoiceId(null);
    } else {
      audioEngine.stopSpeaking();
      setPlayingVoiceId(voice.id);
      audioEngine.playSFX('whoosh');
      audioEngine.speakNarration(voice.sampleText, voice, () => {
        setPlayingVoiceId(null);
      });
    }
  };

  const handleSelect = (voiceId: string) => {
    audioEngine.stopSpeaking();
    setPlayingVoiceId(null);
    audioEngine.playSFX('chime');
    onSelectVoice(voiceId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Card */}
      <div 
        className="w-full max-w-3xl max-h-[90vh] bg-slate-900/95 border border-pink-500/30 rounded-2xl shadow-2xl shadow-pink-500/10 flex flex-col overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-pink-500/20 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-md">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Choose Narrator Voice
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  {VOICES_LIBRARY.length} AI Voices
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Audition voice samples and select a narrator to immediately re-sync your video audio.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.stopSpeaking();
              setPlayingVoiceId(null);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="px-5 py-3 border-b border-pink-500/15 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* Gender Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-pink-500/20">
            {(['All', 'Male', 'Female'] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => setGenderFilter(gender)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  genderFilter === gender
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>

          {/* Tone Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3 text-pink-400" />
              Tone:
            </span>
            {['All', 'Documentary', 'Cinematic', 'Conversational', 'Energetic', 'Calm', 'Historical'].map((tone) => (
              <button
                key={tone}
                onClick={() => setToneFilter(tone)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
                  toneFilter === tone
                    ? 'bg-pink-500/25 border-pink-500/50 text-pink-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-pink-500/30'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 custom-scrollbar">
          {filteredVoices.map((voice) => {
            const isSelected = voice.id === selectedVoiceId;
            const isPlaying = playingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                onClick={() => handleSelect(voice.id)}
                className={`relative group rounded-2xl p-4 transition-all duration-200 cursor-pointer border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-pink-950/40 border-pink-500 shadow-lg shadow-pink-500/15 ring-1 ring-pink-500/50'
                    : 'bg-slate-900/60 border-pink-500/15 hover:border-pink-500/40 hover:bg-slate-850/80'
                }`}
              >
                <div>
                  {/* Top Bar: Avatar, Info & Selection Indicator */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${voice.avatarGradient} flex items-center justify-center text-white font-bold text-base shadow-md shrink-0 border border-white/20`}>
                        {voice.name.charAt(0)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm group-hover:text-pink-200 transition-colors">
                            {voice.name}
                          </h3>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500 text-white shadow-sm">
                              <Check className="h-2.5 w-2.5" />
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span>{voice.accent}</span>
                          <span>•</span>
                          <span className="text-pink-300 font-medium">{voice.tone}</span>
                          <span>•</span>
                          <span>{voice.age}</span>
                        </div>
                      </div>
                    </div>

                    {/* Audition Button */}
                    <button
                      type="button"
                      onClick={(e) => handlePlaySample(voice, e)}
                      title={isPlaying ? 'Stop voice sample' : 'Audition voice sample'}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/40'
                          : 'bg-pink-500/20 text-pink-300 hover:bg-pink-500 hover:text-white border border-pink-500/30'
                      }`}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </button>
                  </div>

                  {/* Descriptor */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {voice.descriptor}
                  </p>

                  {/* Sample Quote */}
                  <div className="rounded-xl bg-slate-950/60 p-2.5 border border-pink-500/10 text-[11px] text-slate-400 italic">
                    "{voice.sampleText}"
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-3.5 pt-3 border-t border-pink-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Volume2 className="h-3 w-3 text-pink-400" />
                    <span>{isPlaying ? 'Playing audition...' : 'Click to select'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(voice.id);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      isSelected
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-pink-500/30 text-slate-200 hover:text-white border border-pink-500/20'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Use Voice'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-pink-500/20 bg-slate-950/80 flex items-center justify-between">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            Changing the narrator updates dialogue speech synthesis instantly in the video player.
          </p>

          <button
            onClick={() => {
              audioEngine.stopSpeaking();
              setPlayingVoiceId(null);
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
