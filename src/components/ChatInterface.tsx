import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  Box, 
  Film, 
  Tv, 
  Smartphone, 
  Square, 
  Clock
} from 'lucide-react';
import { Project, AspectRatio } from '../types/cinegen';
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
  suggestedPrompts?: string[];
}

const INSPIRATION_PROMPTS = [
  {
    title: 'The Secret Origins of Coffee',
    desc: 'Mystical Ethiopian highlands to modern artisan roasting culture',
    prompt: 'Produce an epic cinematic documentary about the origins of coffee, from ancient Ethiopian highlands to third-wave espresso craft',
    icon: '☕',
  },
  {
    title: 'Descent into Saturn’s Moon Titan',
    desc: 'Atmospheric entry, methane rivers, and deep space exploration',
    prompt: 'Create a realistic sci-fi 3D documentary detailing human exploration and landing on Saturn’s giant frozen moon Titan',
    icon: '🚀',
  },
  {
    title: 'Cyberpunk Neo-Tokyo 2099',
    desc: 'Kinetic neon flythroughs, glowing holograms, and synthwave beats',
    prompt: 'Generate a high-speed cyberpunk video through rainy Neo-Tokyo skyscrapers with glowing neon volumetric lighting and 60 FPS motion',
    icon: '🤖',
  },
  {
    title: 'Mysteries of the Deep Sea Abyss',
    desc: 'Bioluminescent ocean trenches and unexplored marine life',
    prompt: 'An atmospheric documentary exploring the deepest trenches of the ocean with bioluminescent creatures and ambient aquatic soundscapes',
    icon: '🌊',
  },
];

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-msg',
      sender: 'agent',
      text: "👋 Welcome! I am your **AI Video Director**. Describe any video concept you'd like to create, and I'll generate a full cinematic video with realistic 3D visuals, motion, narrative script, and synchronized voiceover audio.\n\nOnce ready, you can easily change the narrator voice, direct adjustments, or download your master video.",
      timestamp: 'Just now',
      suggestedPrompts: [
        '☕ The Secret Origins of Coffee',
        '🚀 Descent into Saturn’s Moon Titan',
        '🤖 Cyberpunk Neo-Tokyo 2099',
        '🌊 Mysteries of the Deep Sea Abyss',
      ],
    },
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeAspectRatio, setActiveAspectRatio] = useState<AspectRatio>('16:9');
  const [activeDuration, setActiveDuration] = useState<number>(360);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Adjust textarea height dynamically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
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
        text: "🎬 Started a fresh conversation. What video would you like to create next?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: [
          '☕ The Secret Origins of Coffee',
          '🚀 Descent into Saturn’s Moon Titan',
          '🤖 Cyberpunk Neo-Tokyo 2099',
          '🌊 Mysteries of the Deep Sea Abyss',
        ],
      },
    ]);
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
    }

    audioEngine.playSFX('whoosh');

    // 1. Check if the user is asking to modify an existing video in the chat
    const latestVideoMsg = [...messages].reverse().find((m) => m.project);
    const lowerText = text.toLowerCase();

    // Check for voice change intent
    const matchingVoice = VOICES_LIBRARY.find((v) => 
      lowerText.includes(v.name.toLowerCase()) || 
      (lowerText.includes('voice') && lowerText.includes(v.accent.toLowerCase())) ||
      (lowerText.includes('voice') && lowerText.includes(v.gender.toLowerCase()))
    );

    if (matchingVoice && latestVideoMsg && latestVideoMsg.project) {
      handleUpdateMessageProject(latestVideoMsg.id, { selectedVoiceId: matchingVoice.id });
      audioEngine.playSFX('chime');

      const agentReply: ChatMessageItem = {
        id: `agent-voice-${Date.now()}`,
        sender: 'agent',
        text: `🎙️ I've updated the narrator voice to **${matchingVoice.name}** (${matchingVoice.accent} • ${matchingVoice.tone}). The video narration audio is now synchronized.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [`Swapped narrator voice to ${matchingVoice.name}`],
      };
      setMessages((prev) => [...prev, agentReply]);
      return;
    }

    // Check for aspect ratio change intent
    if ((lowerText.includes('9:16') || lowerText.includes('vertical') || lowerText.includes('tiktok') || lowerText.includes('shorts')) && latestVideoMsg && latestVideoMsg.project) {
      handleUpdateMessageProject(latestVideoMsg.id, { aspectRatio: '9:16' });
      audioEngine.playSFX('chime');

      const agentReply: ChatMessageItem = {
        id: `agent-format-${Date.now()}`,
        sender: 'agent',
        text: `📱 Re-framed the video canvas to **9:16 Vertical format** for TikTok, YouTube Shorts, and Instagram Reels.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentReply]);
      return;
    }

    if ((lowerText.includes('16:9') || lowerText.includes('widescreen') || lowerText.includes('horizontal') || lowerText.includes('landscape')) && latestVideoMsg && latestVideoMsg.project) {
      handleUpdateMessageProject(latestVideoMsg.id, { aspectRatio: '16:9' });
      audioEngine.playSFX('chime');

      const agentReply: ChatMessageItem = {
        id: `agent-format-${Date.now()}`,
        sender: 'agent',
        text: `🖥️ Re-framed the video canvas to **16:9 Widescreen format**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentReply]);
      return;
    }

    // Check for lighting / atmosphere modifications
    if (lowerText.includes('golden hour') || lowerText.includes('warmer') || lowerText.includes('sunset')) {
      if (latestVideoMsg && latestVideoMsg.project) {
        const updatedSegs: typeof latestVideoMsg.project.segments = latestVideoMsg.project.segments.map((seg) => ({
          ...seg,
          lighting3D: {
            environment: 'golden_hour',
            keyLightColor: '#fde047',
            fillLightColor: '#78350f',
            rimLightColor: '#38bdf8',
            ambientIntensity: 0.8,
            directionalIntensity: 2.4,
            volumetricFog: true,
            fogColor: '#1a0d05',
            fogDensity: 0.015,
          },
        }));
        handleUpdateMessageProject(latestVideoMsg.id, { segments: updatedSegs });
        audioEngine.playSFX('chime');

        const agentReply: ChatMessageItem = {
          id: `agent-light-${Date.now()}`,
          sender: 'agent',
          text: `✨ Adjusted 3D scene lighting to **Golden Hour Sunset** with warm amber fill and volumetric haze.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentReply]);
        return;
      }
    }

    // 2. Full AI Video Generation Pipeline
    setIsGenerating(true);
    const agentMsgId = `agent-gen-${Date.now()}`;

    // Add initial placeholder generating message
    setMessages((prev) => [
      ...prev,
      {
        id: agentMsgId,
        sender: 'agent',
        text: `Synthesizing your cinematic video for: "${text}"...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGenerating: true,
        generationProgress: {
          stage: 'script',
          percent: 15,
          message: 'Deconstructing prompt into 3D narrative arc & scenes...',
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
              text: `Here is your generated video: **${generatedProject.title}**!\n\nI've produced 8 scenes with cinematic camera trajectories, PBR materials, and synchronized voice narration. You can play the video, choose a different narrator voice, or download the master below.`,
              actions: [
                'Scripted 8 cinematic narrative scenes',
                'Compiled WebGL 3D camera spline motion',
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

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-pink-500/20 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-6 py-3 shadow-lg shrink-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 select-none">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600 p-0.5 shadow-lg shadow-pink-500/25">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Box className="h-5 w-5 text-pink-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-extrabold tracking-tight text-white">
                  CINEGEN <span className="text-pink-400">AI</span>
                </h1>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Agent Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Autonomous Video & Voice Creation Agent
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Mute/Unmute */}
            <button
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 border border-pink-500/20 hover:border-pink-500/40 transition-all"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-slate-500" /> : <Volume2 className="h-4 w-4 text-pink-400" />}
            </button>

            {/* New Conversation Button */}
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-pink-500/20 hover:border-pink-500/40 text-slate-200 hover:text-white transition-all"
              title="Start a new chat"
            >
              <PlusCircle className="h-3.5 w-3.5 text-pink-400" />
              <span className="hidden sm:inline">New Video</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Stream */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 custom-scrollbar">
        <div className="mx-auto max-w-4xl space-y-6 pb-28">
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
              <div className={`flex flex-col gap-2 max-w-3xl ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Text Card */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 transition-all text-sm leading-relaxed shadow-lg ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white font-medium shadow-pink-600/20 rounded-tr-sm max-w-2xl'
                      : 'bg-slate-900/90 border border-pink-500/25 text-slate-200 backdrop-blur-xl shadow-pink-500/5 rounded-tl-sm w-full'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">
                    {message.text}
                  </p>

                  {/* Generation In-Progress Animated Card */}
                  {message.isGenerating && message.generationProgress && (
                    <div className="mt-4 rounded-xl bg-slate-950/80 border border-pink-500/30 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-4 w-4 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
                          <span className="text-xs font-bold text-pink-300">
                            {message.generationProgress.stage.toUpperCase()} STAGE
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-300">
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

                  {/* Suggested Inspiration Prompts for Welcome message */}
                  {message.suggestedPrompts && (
                    <div className="mt-4 pt-3 border-t border-pink-500/15 space-y-2.5">
                      <span className="text-[11px] font-bold text-slate-400 block tracking-wide uppercase">
                        Inspiring Video Concepts to Try:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {INSPIRATION_PROMPTS.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(item.prompt)}
                            disabled={isGenerating}
                            className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-pink-950/50 border border-pink-500/20 hover:border-pink-500/50 text-left transition-all group flex items-start gap-2.5"
                          >
                            <span className="text-lg mt-0.5">{item.icon}</span>
                            <div>
                              <div className="font-semibold text-xs text-slate-200 group-hover:text-pink-300 transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {item.desc}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
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
      </main>

      {/* Floating Bottom Prompt Input Area */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-4 px-4 sm:px-6 pointer-events-none">
        <div className="mx-auto max-w-4xl pointer-events-auto">
          {/* Format & Option Selector Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-pink-500/20 shadow-md">
              <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
                <Film className="h-3 w-3 text-pink-400" />
                Aspect Ratio:
              </span>
              <button
                type="button"
                onClick={() => setActiveAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeAspectRatio === '16:9'
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="h-3 w-3" />
                16:9 Widescreen
              </button>
              <button
                type="button"
                onClick={() => setActiveAspectRatio('9:16')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeAspectRatio === '9:16'
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-3 w-3" />
                9:16 Shorts / TikTok
              </button>
              <button
                type="button"
                onClick={() => setActiveAspectRatio('1:1')}
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

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
              <Clock className="h-3 w-3 text-pink-400" />
              <span>Full ~6 Min 3D Master with synchronized audio</span>
            </div>
          </div>

          {/* Input Box Card */}
          <div className="relative rounded-2xl bg-slate-900/95 border border-pink-500/30 p-2 shadow-2xl shadow-pink-500/10 backdrop-blur-2xl focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500/50 transition-all">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Describe the video you want to create (e.g. 'An epic documentary about ancient Egyptian pyramids with dramatic orchestral music')..."
                disabled={isGenerating}
                rows={1}
                className="flex-1 max-h-36 min-h-[44px] bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none resize-none custom-scrollbar leading-relaxed"
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isGenerating}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 shrink-0"
              >
                {isGenerating ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Send className="h-4 w-4 ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
