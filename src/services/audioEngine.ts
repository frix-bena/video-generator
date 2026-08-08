import { Voice } from '../types/cinegen';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private musicOscillators: (OscillatorNode | AudioNode)[] = [];
  private isMusicPlaying: boolean = false;

  constructor() {
    // Initialized on first user interaction to comply with browser autoplay policies
  }

  private initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      this.musicGain = this.audioCtx.createGain();
      this.musicGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.audioCtx.createGain();
      this.sfxGain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.audioCtx.currentTime);
    }
    if (muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Speaks narration text tailored to a selected Voice profile
   */
  public speakNarration(text: string, voice: Voice, onEnd?: () => void) {
    if (this.isMuted || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voice.speed || 0.95;
      utterance.pitch = voice.pitch || 0.9;

      // Try to find matching system voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (voice.accent === 'British') {
          const ukVoice = voices.find((v) => v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('British') || v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('Arthur'));
          if (ukVoice) utterance.voice = ukVoice;
        } else if (voice.gender === 'Female') {
          const femaleVoice = voices.find((v) => (v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Victoria') || v.name.includes('Female')) && v.lang.includes('en'));
          if (femaleVoice) utterance.voice = femaleVoice;
        } else {
          const maleVoice = voices.find((v) => (v.name.includes('David') || v.name.includes('Alex') || v.name.includes('George') || v.name.includes('Male')) && v.lang.includes('en'));
          if (maleVoice) utterance.voice = maleVoice;
        }
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      this.currentUtterance = utterance;
      this.isSpeaking = true;
      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  /**
   * Procedural Sound Effects Synthesis (Whoosh, Sub Bass, Steam, Vinyl, Chime)
   */
  public playSFX(type: 'whoosh' | 'sub_impact' | 'steam_hiss' | 'chime' | 'laser_drill' | 'rewind' | 'click') {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.audioCtx || !this.sfxGain) return;

    const now = this.audioCtx.currentTime;

    if (type === 'whoosh') {
      // Noise buffer filtered sweep
      const bufferSize = this.audioCtx.sampleRate * 0.4;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      whiteNoise.start(now);
      whiteNoise.stop(now + 0.4);
    } else if (type === 'sub_impact') {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === 'steam_hiss') {
      const bufferSize = this.audioCtx.sampleRate * 0.5;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3500, now);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.5);
    } else if (type === 'chime') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        if (!this.audioCtx || !this.sfxGain) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } else if (type === 'click') {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  }

  /**
   * Starts ambient background score synth
   */
  public startMusic(style: string) {
    if (this.isMusicPlaying || this.isMuted) return;
    this.initAudio();
    if (!this.audioCtx || !this.musicGain) return;

    this.stopMusic();
    this.isMusicPlaying = true;

    const baseChord = style.toLowerCase().includes('scifi') || style.toLowerCase().includes('cyber')
      ? [110, 164.81, 220, 329.63] // Am9
      : style.toLowerCase().includes('lo-fi')
      ? [130.81, 196, 246.94, 293.66] // Cmaj7
      : [146.83, 220, 293.66, 369.99]; // Dmaj (Cinematic Warm)

    baseChord.forEach((freq, i) => {
      if (!this.audioCtx || !this.musicGain) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = i === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start();
      this.musicOscillators.push(osc);
    });
  }

  public stopMusic() {
    this.musicOscillators.forEach((osc) => {
      try {
        (osc as OscillatorNode).stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    this.musicOscillators = [];
    this.isMusicPlaying = false;
  }
}

export const audioEngine = new AudioEngine();
