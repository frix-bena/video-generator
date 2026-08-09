import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  Box
} from 'lucide-react';
import { Project, CopilotMessage, Render3DMode, CameraTrajectory, AspectRatio } from '../types/cinegen';
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
      text: `Hello! I'm Cinegen, your 3D Filmmaking & Cinematography AI. I’ve rendered your ~6-minute realistic 3D video using Three.js WebGL with 8 dynamic scenes, PBR materials, and camera trajectories. You can direct me to adjust 3D camera angles, change volumetric lighting, switch 3D shaders, or edit dialogue. How would you like to direct the scene?`,
      timestamp: 'Just now',
      suggestedPrompts: [
        'Switch 3D camera to 360° Orbit trajectory',
        'Toggle Wireframe 3D blueprint mode',
        'Add glowing 3D embers atmosphere',
        'Switch format to 9:16 Vertical for TikTok',
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

    // Interpret user intent and execute 3D direct actions
    setTimeout(() => {
      const q = query.toLowerCase();
      let replyText = '';
      const actions: string[] = [];

      if (q.includes('wireframe') || q.includes('blueprint')) {
        onUpdateProject({ render3DMode: 'wireframe' as Render3DMode });
        actions.push('Switched WebGL 3D shading to Wireframe Vector Blueprint');
        replyText = `I’ve switched the 3D scene render mode to Wireframe Blueprint for a high-tech VFX breakdown.`;
      } else if (q.includes('pbr') || q.includes('realistic') || q.includes('clay')) {
        const mode: Render3DMode = q.includes('clay') ? 'clay_model' : 'cinematic_pbr';
        onUpdateProject({ render3DMode: mode });
        actions.push(`Updated 3D shading mode to ${mode}`);
        replyText = `I’ve set the 3D WebGL renderer to ${mode} mode with physically-based lighting.`;
      } else if (q.includes('orbit') || q.includes('360')) {
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
        actions.push('Set 3D camera trajectory to Orbit 360° across all scenes');
        replyText = `I’ve directed all 3D camera paths into sweeping 360° orbital trajectories around hero subjects.`;
      } else if (q.includes('ember') || q.includes('steam') || q.includes('dust') || q.includes('rain') || q.includes('particle')) {
        const pType = q.includes('ember') ? 'embers' : q.includes('steam') ? 'steam' : q.includes('rain') ? 'rain' : 'dust';
        const updatedSegs = project.segments.map((seg) => ({
          ...seg,
          particles3D: {
            type: pType as any,
            count: 450,
            color: pType === 'embers' ? '#f43f5e' : pType === 'steam' ? '#ffffff' : '#ec4899',
            speed: 1.2,
            size: 0.1,
          },
        }));
        onUpdateProject({ segments: updatedSegs });
        actions.push(`Injected 3D volumetric ${pType} particles into active scene`);
        replyText = `I’ve populated the 3D space with dynamic ${pType} particle simulation.`;
      } else if (q.includes('voice') || q.includes('british') || q.includes('sir arthur')) {
        const britishVoice = VOICES_LIBRARY.find((v) => v.accent === 'British') || VOICES_LIBRARY[0];
        onUpdateProject({ selectedVoiceId: britishVoice.id });
        actions.push(`Changed narrator voice track to ${britishVoice.name}`);
        replyText = `I’ve swapped the narration track to ${britishVoice.name} (${britishVoice.tone}) and re-synchronized the 3D audio bed.`;
      } else if (q.includes('tiktok') || q.includes('vertical') || q.includes('9:16')) {
        onUpdateProject({ aspectRatio: '9:16' as AspectRatio });
        actions.push('Re-framed 3D WebGL camera canvas to 9:16 Vertical');
        replyText = `Re-framed the 3D camera viewport to 9:16 Vertical for TikTok, YouTube Shorts, and Instagram Reels.`;
      } else {
        replyText = `I’ve analyzed your 3D direction: "${query}". I’ve re-calibrated the 3D camera exposure, depth-of-field focal plane, and balanced the background music bed.`;
        actions.push('Calibrated 3D WebGL exposure and camera focal plane');
      }

      const botMsg: CopilotMessage = {
        id: `cinegen-${Date.now()}`,
        sender: 'cinegen',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionsPerformed: actions,
        suggestedPrompts: [
          'Switch 3D shading to PBR Realistic',
          'Make scene lighting warmer (Golden Hour)',
          'Export 3D Master Video',
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsProcessing(false);
      audioEngine.playSFX('chime');
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-950/95 backdrop-blur-2xl border-l border-pink-500/25 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-pink-500/20 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-md">
            <Box className="h-4 w-4 text-pink-400" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
              <span>Cinegen 3D Copilot</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-pink-300 font-medium">Autonomous 3D Video Director</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-none shadow-md shadow-pink-500/20'
                  : 'glass-card bg-slate-900/90 border-pink-500/20 text-slate-200 rounded-bl-none shadow-md'
              }`}
            >
              <p>{msg.text}</p>

              {/* Actions Performed Badge */}
              {msg.actionsPerformed && msg.actionsPerformed.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-pink-500/15 space-y-1">
                  {msg.actionsPerformed.map((act, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">
              {msg.timestamp}
            </span>

            {/* Quick Action Suggestion Chips */}
            {msg.suggestedPrompts && (
              <div className="mt-2 space-y-1.5 w-full">
                {msg.suggestedPrompts.map((sPrompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sPrompt)}
                    className="w-full text-left rounded-xl bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/15 hover:border-pink-500/40 px-3 py-2 text-[11px] text-pink-300 transition-all duration-200 flex items-center justify-between group shadow-sm"
                  >
                    <span className="truncate">{sPrompt}</span>
                    <ChevronRight className="h-3 w-3 text-slate-500 group-hover:text-pink-300 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs font-mono text-pink-400 font-semibold">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
            <span>Cinegen is compiling 3D scene updates...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-pink-500/20 bg-slate-900/90">
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
            placeholder="Direct 3D scene (e.g. 'Make camera orbit 360°')..."
            className="flex-1 rounded-xl bg-slate-950 border border-pink-500/25 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="btn-cine-primary flex h-9 w-9 items-center justify-center rounded-xl text-white disabled:opacity-40 transition-colors shadow-md shadow-pink-500/30"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
