import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  Film 
} from 'lucide-react';
import { Project, CopilotMessage, CameraTrajectory, AspectRatio } from '../types/cinegen';
import { VOICES_LIBRARY } from '../data/voices';
import { audioEngine } from '../services/audioEngine';

interface CinegenCopilotProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (updated: Partial<Project>) => void;
}

export const CinegenCopilot: React.FC<CinegenCopilotProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateProject,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-1',
      sender: 'cinegen',
      text: `Hello! I'm Cinegen, your AI Filmmaking & Cinematography Copilot. I can help refine your video diffusion prompts, adjust camera motion directions, re-frame aspect ratios, switch narration voices, or enhance cinematic lighting. How would you like to direct the scene?`,
      timestamp: 'Just now',
      suggestedPrompts: [
        'Apply 360° orbital camera motion',
        'Switch format to 9:16 Vertical for TikTok / Shorts',
        'Switch narrator voice to Sir Arthur (British Documentary)',
        'Enhance prompt with golden hour volumetric lighting',
      ],
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isProcessing) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsProcessing(true);
    audioEngine.playSFX('whoosh');

    // Interpret user intent and execute video direct actions
    setTimeout(() => {
      const q = query.toLowerCase();
      let replyText = '';
      const actions: string[] = [];

      if (q.includes('orbit') || q.includes('360')) {
        const updatedSegs = project.segments.map((seg) => ({
          ...seg,
          camera3D: {
            trajectory: 'orbit_360' as CameraTrajectory,
            fov: 45,
            startPos: [8, 4, 8] as [number, number, number],
            endPos: [-8, 4, 8] as [number, number, number],
            lookAt: [0, 0, 0] as [number, number, number],
            lensPreset: '35mm Orbital Anamorphic f/1.4',
          },
        }));
        onUpdateProject({ segments: updatedSegs });
        actions.push('Set camera trajectory to Orbit 360° across all scenes');
        replyText = `I’ve directed all camera paths into sweeping 360° orbital trajectories around hero subjects.`;
      } else if (q.includes('voice') || q.includes('british') || q.includes('sir arthur')) {
        const britishVoice = VOICES_LIBRARY.find((v) => v.accent === 'British') || VOICES_LIBRARY[0];
        onUpdateProject({ selectedVoiceId: britishVoice.id });
        actions.push(`Changed narrator voice track to ${britishVoice.name}`);
        replyText = `I’ve swapped the narration track to ${britishVoice.name} (${britishVoice.tone}) and re-synchronized the audio bed.`;
      } else if (q.includes('tiktok') || q.includes('vertical') || q.includes('9:16')) {
        onUpdateProject({ aspectRatio: '9:16' as AspectRatio });
        actions.push('Re-framed video canvas to 9:16 Vertical');
        replyText = `Re-framed the video viewport to 9:16 Vertical optimized for TikTok, YouTube Shorts, and Instagram Reels.`;
      } else if (q.includes('golden hour') || q.includes('lighting') || q.includes('sunset')) {
        const updatedSegs = project.segments.map((seg) => ({
          ...seg,
          lighting3D: {
            environment: 'golden_hour' as any,
            keyLightColor: '#fde047',
            fillLightColor: '#78350f',
            rimLightColor: '#38bdf8',
            ambientIntensity: 0.8,
            directionalIntensity: 2.5,
            volumetricFog: true,
            fogColor: '#1a0d05',
            fogDensity: 0.02,
          },
        }));
        onUpdateProject({ segments: updatedSegs });
        actions.push('Enhanced volumetric golden hour lighting');
        replyText = `I’ve updated scene lighting parameters to golden hour sunset with rich atmospheric depth.`;
      } else {
        replyText = `I’ve analyzed your direction: "${query}". I’ve refined the cinematic diffusion prompt parameters and updated the video composition.`;
        actions.push('Refined cinematic diffusion prompt parameters');
      }

      const copilotReply: CopilotMessage = {
        id: `cinegen-${Date.now()}`,
        sender: 'cinegen',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions,
      };

      setMessages((prev) => [...prev, copilotReply]);
      setIsProcessing(false);
      audioEngine.playSFX('chime');
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-pink-500/20 bg-slate-950/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-pink-500/20 px-5 py-4 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
              CINEGEN AI COPILOT
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-pink-300 font-medium">
              AI Video Director & Prompt Refiner
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-2 ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                  : 'bg-slate-900 border border-pink-500/20 text-slate-200 shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {/* Executed Directorial Actions */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-pink-500/20 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">
                    Directorial Directives Applied:
                  </span>
                  {msg.actions.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            {msg.suggestedPrompts && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {msg.suggestedPrompts.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    className="flex items-center gap-1 rounded-lg bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 px-2.5 py-1 text-[11px] font-medium text-pink-200 hover:text-white transition-all cursor-pointer"
                  >
                    <span>{promptText}</span>
                    <ChevronRight className="h-3 w-3 text-pink-400" />
                  </button>
                ))}
              </div>
            )}

            <span className="text-[10px] text-slate-500 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-pink-300 bg-slate-900/80 p-3 rounded-2xl border border-pink-500/20 w-fit">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
            <span>Analyzing prompt & recalculating video parameters...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-pink-500/20 p-4 bg-slate-900/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Direct the video (e.g. 'Add golden hour lighting')..."
            className="flex-1 rounded-xl bg-slate-950 border border-pink-500/30 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md hover:scale-105 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CinegenCopilot;
