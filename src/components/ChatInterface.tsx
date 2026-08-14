import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  Film, 
  Tv, 
  Smartphone, 
  Square, 
  Video, 
  Wand2, 
  SlidersHorizontal,
  X,
  ArrowRight
} from 'lucide-react';
import { Project, AspectRatio, CameraTrajectory } from '../types/cinegen';
import { VOICES_LIBRARY } from '../data/voices';
import { AiGeneratorService, GenerationProgress } from '../services/aiGeneratorService';
import { audioEngine } from '../services/audioEngine';
import { ChatVideoCard } from './ChatVideoCard';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  project?: Project;
  isGenerating?: boolean;
  generationProgress?: GenerationProgress;
  actions?: string[];
}

const STARTER_PROMPTS = [
  {
    icon: '🐆',
    title: 'Himalayan Snow Leopard',
    prompt: 'A snow leopard leaping across snowy Himalayan cliffs at golden hour in 4K with dramatic 35mm anamorphic camera and cinematic orchestral score',
    tag: '4K • 35mm Prime',
  },
  {
    icon: '🏙️',
    title: 'Cyberpunk Neo-Tokyo',
    prompt: 'Futuristic Neo-Tokyo street in pouring rain with volumetric neon lighting, 360° orbit camera, and reflections on wet asphalt',
    tag: 'Neon • 360° Orbit',
  },
  {
    icon: '🌊',
    title: 'Deep Ocean Trench',
    prompt: 'Bioluminescent deep sea creatures gliding through an underwater abyss with macro push-in camera and atmospheric blue lighting',
    tag: 'Macro Push • Volumetric',
  },
  {
    icon: '🏜️',
    title: 'FPV Desert Canyon Drone',
    prompt: 'High-speed FPV aerial drone flythrough through ancient sandstone canyon arches at sunset with cinematic 60 FPS motion',
    tag: 'FPV Drone • 60 FPS',
  },
];

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-msg',
      sender: 'agent',
      text: "👋 **Welcome! What video would you like to create today?**\n\nDescribe your concept below to generate a cinematic video with realistic 3D camera motion, PBR lighting, and synchronized voice narration.",
      timestamp: 'Just now',
    },
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeAspectRatio, setActiveAspectRatio] = useState<AspectRatio>('16:9');
  const [activeDuration, setActiveDuration] = useState<number>(360);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showDirectorTools, setShowDirectorTools] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const heroTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasUserMessages = messages.some((m) => m.sender === 'user');

  // Auto-scroll to latest message
  useEffect(() => {
    if (hasUserMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, hasUserMessages]);

  // Adjust textarea height dynamically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(Math.max(target.scrollHeight, 52), 180)}px`;
  };

  // Append Director Tag to Prompt
  const handleAppendDirectorTag = (tag: string) => {
    audioEngine.playSFX('click');
    setInputText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.toLowerCase().includes(tag.toLowerCase())) return trimmed;
      return `${trimmed}, ${tag}`;
    });
    const ref = hasUserMessages ? textareaRef.current : heroTextareaRef.current;
    if (ref) {
      ref.focus();
    }
  };

  // Toggle Audio Sound Effects
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMute(next);
    if (!next) audioEngine.playSFX('click');
  };

  // Clear conversation / Start fresh
  const handleNewConversation = () => {
    audioEngine.playSFX('click');
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'agent',
        text: "👋 **Started a fresh video session!**\n\nWhat video would you like to create next? Describe any theme, scene, or cinematic style below.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputText('');
    if (heroTextareaRef.current) {
      heroTextareaRef.current.style.height = 'auto';
      heroTextareaRef.current.focus();
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Helper to update project inside a specific message or latest project
  const handleUpdateMessageProject = (msgId: string, updatedFields: Partial<Project>) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.project) {
          return {
            ...msg,
            project: {
              ...msg.project,
              ...updatedFields,
              updatedAt: new Date().toISOString(),
            },
          };
        }
        return msg;
      })
    );
  };

  // Handle User Input Submission
  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputText).trim();
    if (!text || isGenerating) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessageItem = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) {
      setInputText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      if (heroTextareaRef.current) heroTextareaRef.current.style.height = 'auto';
    }

    audioEngine.playSFX('whoosh');

    // 1. Check if the user is asking to modify an existing video in the chat (Conversational Video-to-Video)
    const latestVideoMsg = [...messages].reverse().find((m) => m.project);
    const lowerText = text.toLowerCase();

    // Check for voice change intent
    const matchingVoice = VOICES_LIBRARY.find((v) => 
      lowerText.includes(v.name.toLowerCase()) || 
      (lowerText.includes('voice') && lowerText.includes(v.accent.toLowerCase())) ||
      (lowerText.includes('voice') && lowerText.includes(v.gender.toLowerCase()))
    );

    if (matchingVoice && latestVideoMsg && latestVideoMsg.project && (lowerText.includes('voice') || lowerText.includes('narrat') || lowerText.includes('change') || lowerText.includes('switch') || lowerText.includes('use '))) {
      handleUpdateMessageProject(latestVideoMsg.id, { selectedVoiceId: matchingVoice.id });
      audioEngine.playSFX('chime');

      const agentReply: ChatMessageItem = {
        id: `agent-voice-${Date.now()}`,
        sender: 'agent',
        text: `🎙️ **Narrator Voice Updated**: Switched to **${matchingVoice.name}** (${matchingVoice.accent} • ${matchingVoice.tone}). Spoken narration audio and subtitles are re-synchronized.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [`Swapped narrator voice to ${matchingVoice.name}`],
      };
      setMessages((prev) => [...prev, agentReply]);
      return;
    }

    // Check for aspect ratio change intent
    if ((lowerText.includes('9:16') || lowerText.includes('vertical') || lowerText.includes('tiktok') || lowerText.includes('shorts') || lowerText.includes('reels')) && latestVideoMsg && latestVideoMsg.project && (lowerText.includes('convert') || lowerText.includes('change') || lowerText.includes('switch') || lowerText.includes('format') || lowerText.includes('aspect') || lowerText.length < 30)) {
      handleUpdateMessageProject(latestVideoMsg.id, { aspectRatio: '9:16' });
      setActiveAspectRatio('9:16');
      audioEngine.playSFX('chime');

      const agentReply: ChatMessageItem = {
        id: `agent-format-${Date.now()}`,
        sender: 'agent',
        text: `📱 **Aspect Ratio Re-framed**: Canvas converted to **9:16 Vertical format** optimized for TikTok, YouTube Shorts, and Instagram Reels with dynamic smart framing.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentReply]);
      return;
    }

    if ((lowerText.includes('16:9') || lowerText.includes('widescreen') || lowerText.includes('horizontal') || lowerText.includes('landscape') || lowerText.includes('cinema')) && latestVideoMsg && latestVideoMsg.project && (lowerText.includes('convert') || lowerText.includes('change') || lowerText.includes('switch') || lowerText.includes('format') || lowerText.includes('aspect') || lowerText.length < 30)) {
      handleUpdateMessageProject(latestVideoMsg.id, { aspectRatio: '16:9' });
      setActiveAspectRatio('16:9');
      audioEngine.playSFX('chime');

      const agentReply: ChatMessageItem = {
        id: `agent-format-${Date.now()}`,
        sender: 'agent',
        text: `🖥️ **Aspect Ratio Re-framed**: Canvas converted to **16:9 Widescreen Cinema format** for standard broadcast and desktop playback.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentReply]);
      return;
    }

    // Check for camera trajectory modification intent
    const isCameraDirective = lowerText.includes('camera') || lowerText.includes('orbit') || lowerText.includes('drone') || lowerText.includes('fpv') || lowerText.includes('crane') || lowerText.includes('macro') || lowerText.includes('dolly');
    if (isCameraDirective && latestVideoMsg && latestVideoMsg.project && (lowerText.includes('change') || lowerText.includes('switch') || lowerText.includes('make') || lowerText.includes('trajectory') || lowerText.length < 40)) {
      let targetTrajectory: CameraTrajectory = 'orbit_360';
      let trajName = '360° Orbital Trajectory';
      if (lowerText.includes('drone') || lowerText.includes('aerial')) {
        targetTrajectory = 'drone_flyover';
        trajName = 'Aerial Drone Flyover';
      } else if (lowerText.includes('fpv') || lowerText.includes('flythrough')) {
        targetTrajectory = 'fpv_flythrough';
        trajName = 'FPV Kinetic Flythrough';
      } else if (lowerText.includes('macro') || lowerText.includes('close')) {
        targetTrajectory = 'macro_push';
        trajName = 'Macro Push-In Close-Up';
      } else if (lowerText.includes('crane') || lowerText.includes('boom')) {
        targetTrajectory = 'crane_rise';
        trajName = 'Crane Rise & Reveal';
      } else if (lowerText.includes('dolly')) {
        targetTrajectory = 'cinematic_dolly';
        trajName = 'Cinematic Dolly Track';
      }

      const updatedSegs = latestVideoMsg.project.segments.map((s) => ({
        ...s,
        camera3D: {
          ...(s.camera3D || { fov: 45, startPos: [6, 4, 8] as [number, number, number], endPos: [-6, 2, 6] as [number, number, number], lookAt: [0, 0, 0] as [number, number, number], lensPreset: '35mm Prime' }),
          trajectory: targetTrajectory,
        }
      }));

      handleUpdateMessageProject(latestVideoMsg.id, { segments: updatedSegs });
      audioEngine.playSFX('chime');

      const agentReply: ChatMessageItem = {
        id: `agent-cam-${Date.now()}`,
        sender: 'agent',
        text: `🎥 **Camera Directive Applied**: Re-calculated 3D spline camera trajectories to **${trajName}** across all scenes. Motion coherence updated to 60 FPS.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentReply]);
      return;
    }

    // Check for lighting / atmosphere modifications
    if ((lowerText.includes('golden hour') || lowerText.includes('warmer') || lowerText.includes('sunset') || lowerText.includes('neon') || lowerText.includes('cyberpunk') || lowerText.includes('fog') || lowerText.includes('lighting')) && latestVideoMsg && latestVideoMsg.project && (lowerText.includes('make') || lowerText.includes('change') || lowerText.includes('switch') || lowerText.includes('adjust') || lowerText.length < 40)) {
      let env: 'golden_hour' | 'cyberpunk_neon' | 'highland_mist' | 'desert_sunset' = 'golden_hour';
      let envLabel = 'Golden Hour Sunset';
      let keyColor = '#fde047';
      let fillColor = '#78350f';
      let rimColor = '#38bdf8';

      if (lowerText.includes('neon') || lowerText.includes('cyberpunk')) {
        env = 'cyberpunk_neon';
        envLabel = 'Cyberpunk Volumetric Neon';
        keyColor = '#06b6d4';
        fillColor = '#f43f5e';
        rimColor = '#a855f7';
      } else if (lowerText.includes('fog') || lowerText.includes('mist')) {
        env = 'highland_mist';
        envLabel = 'Atmospheric Volumetric Mist';
        keyColor = '#ffffff';
        fillColor = '#334155';
        rimColor = '#fde047';
      }

      const updatedSegs = latestVideoMsg.project.segments.map((seg) => ({
        ...seg,
        lighting3D: {
          environment: env,
          keyLightColor: keyColor,
          fillLightColor: fillColor,
          rimLightColor: rimColor,
          ambientIntensity: 0.8,
          directionalIntensity: 2.5,
          volumetricFog: true,
          fogColor: env === 'cyberpunk_neon' ? '#080518' : '#1a0d05',
          fogDensity: 0.018,
        },
      }));

      handleUpdateMessageProject(latestVideoMsg.id, { segments: updatedSegs });
      audioEngine.playSFX('chime');

      const agentReply: ChatMessageItem = {
        id: `agent-light-${Date.now()}`,
        sender: 'agent',
        text: `✨ **Lighting Model Re-rendered**: Adjusted PBR scene lighting shaders to **${envLabel}** with volumetric scattering and dynamic rim highlights.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentReply]);
      return;
    }

    // 2. Full Google Veo AI Video Generation Pipeline
    setIsGenerating(true);
    const agentMsgId = `agent-gen-${Date.now()}`;

    // Add initial placeholder generating message
    setMessages((prev) => [
      ...prev,
      {
        id: agentMsgId,
        sender: 'agent',
        text: `Synthesizing Google Veo video for: "${text}"...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGenerating: true,
        generationProgress: {
          stage: 'script',
          percent: 15,
          message: 'Deconstructing prompt into 3D cinematic camera paths & narrative arc...',
        },
      },
    ]);

    try {
      // Execute AI generation with progress callbacks
      const generatedProject = await AiGeneratorService.generateProjectFromPrompt(
        text,
        (progress) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === agentMsgId) {
                return {
                  ...m,
                  generationProgress: progress,
                };
              }
              return m;
            })
          );
        }
      );

      // Apply selected user options
      generatedProject.aspectRatio = activeAspectRatio;
      generatedProject.targetDurationSec = activeDuration;

      // Finalize Agent Message with Video Player
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === agentMsgId) {
            return {
              ...m,
              isGenerating: false,
              project: generatedProject,
              text: `🎬 Here is your generated video: **${generatedProject.title}**!\n\nI've produced 8 scenes with 60 FPS temporal camera motion, PBR volumetric lighting, and synchronized voice narration. You can play the video, switch narrator voices, adjust camera & lighting directives, or download the master video below.`,
              actions: [
                'Scripted 8 cinematic narrative scenes',
                'Compiled 60 FPS 3D camera spline motion',
                'Synchronized voiceover audio narration',
                'Mastered audio score and subtitles',
              ],
            };
          }
          return m;
        })
      );

      audioEngine.playSFX('chime');
    } catch (err) {
      console.error('[ChatInterface] Video generation failed:', err);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === agentMsgId) {
            return {
              ...m,
              isGenerating: false,
              text: `⚠️ I encountered an issue generating your video. Please try again or refine your prompt.`,
            };
          }
          return m;
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard shortcut: Enter to submit, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Switch Aspect Ratio and apply to latest project if present
  const handleSelectAspectRatio = (ratio: AspectRatio) => {
    setActiveAspectRatio(ratio);
    audioEngine.playSFX('click');
    const latestVideoMsg = [...messages].reverse().find((m) => m.project);
    if (latestVideoMsg && latestVideoMsg.project) {
      handleUpdateMessageProject(latestVideoMsg.id, { aspectRatio: ratio });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Google Veo Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-pink-500/20 bg-slate-950/95 backdrop-blur-2xl px-4 sm:px-6 py-3 shadow-lg shrink-0">
        <div className="mx-auto flex max-w-4xl lg:max-w-5xl items-center justify-between gap-4">
          {/* Logo & Google Veo Title */}
          <div className="flex items-center gap-3 select-none">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600 p-0.5 shadow-lg shadow-pink-500/25">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Video className="h-5 w-5 text-pink-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  GOOGLE <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-fuchsia-400">VEO</span>
                </h1>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  <Sparkles className="h-2.5 w-2.5 text-pink-400" />
                  Veo 2 Engine
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  1080p 60 FPS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Autonomous AI Video & Voice Director
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Mute/Unmute */}
            <button
              type="button"
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 border border-pink-500/20 hover:border-pink-500/40 transition-all hover:scale-105 active:scale-95"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-slate-500" /> : <Volume2 className="h-4 w-4 text-pink-400" />}
            </button>

            {/* Toggle Director Toolbar */}
            <button
              type="button"
              onClick={() => {
                setShowDirectorTools(!showDirectorTools);
                audioEngine.playSFX('click');
              }}
              title="Toggle Director Tools Toolbar"
              className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                showDirectorTools
                  ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-sm shadow-pink-500/20'
                  : 'bg-slate-900/80 border-pink-500/20 text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            {/* New Video Chat Button */}
            <button
              type="button"
              onClick={handleNewConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-pink-500/20 hover:border-pink-500/40 text-slate-200 hover:text-white transition-all hover:scale-105 active:scale-95"
              title="Start a new video session"
            >
              <PlusCircle className="h-3.5 w-3.5 text-pink-400" />
              <span className="hidden sm:inline">New Video</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 custom-scrollbar flex flex-col">
        {!hasUserMessages ? (
          /* =========================================================================
             CENTERED HERO CHAT & PROMPT WRITING INTERFACE (Initial Landing State)
             ========================================================================= */
          <div className="w-full max-w-3xl lg:max-w-4xl mx-auto my-auto py-8 sm:py-12 flex flex-col items-center justify-center space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Veo Centered Glowing Branding */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600 p-0.5 shadow-2xl shadow-pink-500/30">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                  <Video className="h-7 w-7 sm:h-8 sm:w-8 text-pink-400" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold shadow-inner">
                <Sparkles className="h-3.5 w-3.5 text-pink-400 animate-spin-slow" />
                Google Veo 2 Cinematic Engine
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
                What video would you like to create?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                Describe your concept below to generate a photorealistic 1080p 60 FPS video with dynamic 3D camera motion, PBR lighting, and synchronized voice narration.
              </p>
            </div>

            {/* Centered Prompt Writing Box */}
            <div className="w-full space-y-3">
              {/* Director Toolbar in Centered View */}
              {showDirectorTools && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                  {/* Aspect Ratio Selector */}
                  <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-pink-500/20 shadow-md">
                    <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
                      <Film className="h-3 w-3 text-pink-400" />
                      Aspect:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectAspectRatio('16:9')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                        activeAspectRatio === '16:9'
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Tv className="h-3 w-3" />
                      16:9 Cinema
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAspectRatio('9:16')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                        activeAspectRatio === '9:16'
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="h-3 w-3" />
                      9:16 Shorts/TikTok
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAspectRatio('1:1')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                        activeAspectRatio === '1:1'
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Square className="h-3 w-3" />
                      1:1 Square
                    </button>
                  </div>

                  {/* Directives Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5 custom-scrollbar">
                    <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline px-1 flex items-center gap-1">
                      <Wand2 className="h-3 w-3 text-pink-400" />
                      Directives:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAppendDirectorTag('360° orbit camera')}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                    >
                      🎥 Orbit 360°
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAppendDirectorTag('FPV aerial drone flyover')}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                    >
                      🚁 FPV Drone
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAppendDirectorTag('golden hour sunset lighting')}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                    >
                      🌅 Golden Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAppendDirectorTag('volumetric cyberpunk neon')}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                    >
                      ✨ Cyber Neon
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAppendDirectorTag('35mm anamorphic prime lens f/1.4')}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                    >
                      🔍 35mm Prime
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAppendDirectorTag('60 FPS cinematic motion')}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                    >
                      ⚡ 60 FPS
                    </button>
                  </div>
                </div>
              )}

              {/* Main Centered Input Card */}
              <div className="relative rounded-2xl bg-slate-900/90 border border-pink-500/35 p-3 sm:p-4 shadow-2xl shadow-pink-500/15 backdrop-blur-2xl focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/40 transition-all">
                <div className="flex items-end gap-3">
                  <textarea
                    ref={heroTextareaRef}
                    value={inputText}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the video you want to create (e.g. 'A snow leopard leaping across snowy Himalayan cliffs at golden hour in 4K with dramatic 35mm camera')..."
                    disabled={isGenerating}
                    rows={2}
                    autoFocus
                    className="flex-1 max-h-48 min-h-[60px] bg-transparent px-2 py-1.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                  />

                  {/* Clear Button */}
                  {inputText.trim() && !isGenerating && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputText('');
                        if (heroTextareaRef.current) {
                          heroTextareaRef.current.style.height = 'auto';
                          heroTextareaRef.current.focus();
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0 mb-1"
                      title="Clear text"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isGenerating}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 shrink-0 mb-0.5 cursor-pointer"
                    title="Generate Video (Enter)"
                  >
                    {isGenerating ? (
                      <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <Send className="h-5 w-5 ml-0.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Helper footnote */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 font-medium">
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">Enter</kbd> to generate, <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">Shift + Enter</kbd> for new line</span>
                <span className="hidden sm:inline font-mono text-[10px] text-pink-400/80">Veo 2 Engine • 1080p 60 FPS</span>
              </div>
            </div>

            {/* Quick Starter Inspiration Cards */}
            <div className="w-full pt-2">
              <div className="text-left mb-3">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                  Quick Inspiration Prompts:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STARTER_PROMPTS.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setInputText(item.prompt);
                      if (heroTextareaRef.current) {
                        heroTextareaRef.current.focus();
                      }
                      audioEngine.playSFX('click');
                    }}
                    className="group relative rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-pink-500/20 hover:border-pink-500/50 p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-pink-500/10 hover:-translate-y-0.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item.icon}</span>
                          <h3 className="font-bold text-white text-sm group-hover:text-pink-300 transition-colors">
                            {item.title}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        "{item.prompt}"
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-pink-500/10 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
                        Click to write into prompt
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendMessage(item.prompt);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-400 hover:text-pink-300 group-hover:translate-x-0.5 transition-all"
                      >
                        <span>Generate</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             ACTIVE CONVERSATION & VIDEO STREAM
             ========================================================================= */
          <div className="mx-auto w-full max-w-3xl lg:max-w-4xl space-y-6 py-6 flex-1">
            {/* Messages Feed */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3.5 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Agent Avatar */}
                {message.sender === 'agent' && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20 shrink-0 mt-0.5 border border-pink-400/30">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className={`flex flex-col gap-2 max-w-full sm:max-w-2xl lg:max-w-3xl ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Text Card */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 transition-all text-sm leading-relaxed shadow-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white font-medium shadow-pink-600/20 rounded-tr-sm'
                        : 'bg-slate-900/90 border border-pink-500/25 text-slate-200 backdrop-blur-xl shadow-pink-500/5 rounded-tl-sm w-full'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">
                      {message.text}
                    </p>

                    {/* Generation In-Progress Animated Card */}
                    {message.isGenerating && message.generationProgress && (
                      <div className="mt-4 rounded-xl bg-slate-950/90 border border-pink-500/30 p-4 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-4 w-4 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
                            <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">
                              GOOGLE VEO • {message.generationProgress.stage.toUpperCase()} STAGE
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-200 bg-pink-500/20 px-2 py-0.5 rounded border border-pink-500/30">
                            {message.generationProgress.percent}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 transition-all duration-300 rounded-full"
                            style={{ width: `${message.generationProgress.percent}%` }}
                          />
                        </div>

                        <p className="text-xs text-slate-300 italic flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                          {message.generationProgress.message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Embedded Video Card (When project is generated) */}
                  {message.project && (
                    <div className="w-full mt-1">
                      <ChatVideoCard
                        project={message.project}
                        onUpdateProject={(updated) => handleUpdateMessageProject(message.id, updated)}
                        onQuickAction={(directive) => handleSendMessage(directive)}
                      />
                    </div>
                  )}

                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-400 font-mono px-1">
                    {message.timestamp}
                  </span>
                </div>

                {/* User Avatar */}
                {message.sender === 'user' && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 shadow-md shrink-0 mt-0.5 border border-slate-700">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* =========================================================================
         BOTTOM PROMPT INPUT AREA (Visible during active conversation)
         ========================================================================= */}
      {hasUserMessages && (
        <footer className="shrink-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-950/30 backdrop-blur-xl pt-3 pb-4 px-4 sm:px-6 border-t border-pink-500/15 z-30">
          <div className="mx-auto w-full max-w-3xl lg:max-w-4xl space-y-2.5">
            
            {/* Format & Veo Director Toolbar */}
            {showDirectorTools && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs animate-in fade-in slide-in-from-bottom-1 duration-200">
                {/* Aspect Ratio Selector */}
                <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-pink-500/20 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
                    <Film className="h-3 w-3 text-pink-400" />
                    Aspect:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectAspectRatio('16:9')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      activeAspectRatio === '16:9'
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Tv className="h-3 w-3" />
                    16:9 Cinema
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAspectRatio('9:16')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      activeAspectRatio === '9:16'
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="h-3 w-3" />
                    9:16 Shorts/TikTok
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAspectRatio('1:1')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      activeAspectRatio === '1:1'
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Square className="h-3 w-3" />
                    1:1 Square
                  </button>
                </div>

                {/* Quick Director Keyword Attachment Pills */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 custom-scrollbar">
                  <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline px-1 flex items-center gap-1">
                    <Wand2 className="h-3 w-3 text-pink-400" />
                    Directives:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAppendDirectorTag('360° orbit camera')}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                  >
                    🎥 Orbit 360°
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendDirectorTag('FPV aerial drone flyover')}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                  >
                    🚁 FPV Drone
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendDirectorTag('golden hour sunset lighting')}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                  >
                    🌅 Golden Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendDirectorTag('volumetric cyberpunk neon')}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                  >
                    ✨ Cyber Neon
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendDirectorTag('35mm anamorphic prime lens f/1.4')}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                  >
                    🔍 35mm Prime
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendDirectorTag('60 FPS cinematic motion')}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 hover:bg-pink-950/60 border border-pink-500/20 text-slate-300 hover:text-pink-200 transition-all whitespace-nowrap"
                  >
                    ⚡ 60 FPS
                  </button>
                </div>
              </div>
            )}

            {/* User Prompt Input Box */}
            <div className="relative rounded-2xl bg-slate-900/95 border border-pink-500/30 p-2.5 shadow-2xl shadow-pink-500/10 backdrop-blur-2xl focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/40 transition-all">
              <div className="flex items-end gap-2.5">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe modifications or write your next video prompt..."
                  disabled={isGenerating}
                  rows={1}
                  className="flex-1 max-h-44 min-h-[52px] bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                />

                {/* Clear Text Button */}
                {inputText.trim() && !isGenerating && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputText('');
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                        textareaRef.current.focus();
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0 mb-1"
                    title="Clear text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isGenerating}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 shrink-0 mb-0.5 cursor-pointer"
                  title="Generate Video (Enter)"
                >
                  {isGenerating ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 ml-0.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Typing helper footnote */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 font-medium">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">Shift + Enter</kbd> for new line</span>
              <span className="hidden sm:inline font-mono text-[10px] text-pink-400/80">Veo 2 Engine • 1080p 60 FPS</span>
            </div>

          </div>
        </footer>
      )}
    </div>
  );
};

export default ChatInterface;
