export type PipelineStage = 
  | 'prompt' 
  | 'variety'
  | 'voice' 
  | 'publish'
  | 'script' 
  | 'storyboard' 
  | 'generating' 
  | 'edit';

export type AspectRatio = '16:9' | '9:16' | '1:1';
export type Resolution = '1080p' | '4k';
export type CaptionStyle = 'mrbeast' | 'documentary' | 'netflix' | 'neon' | 'off';
export type Render3DMode = 'cinematic_pbr' | 'wireframe' | 'depth_map' | 'clay_model';
export type CameraTrajectory = 
  | 'orbit_360' 
  | 'macro_push' 
  | 'drone_flyover' 
  | 'crane_rise' 
  | 'fpv_flythrough' 
  | 'dutch_pan' 
  | 'spiral_reveal' 
  | 'cinematic_dolly';

export interface Camera3DConfig {
  trajectory: CameraTrajectory;
  fov: number; // e.g. 35, 45, 60
  startPos: [number, number, number];
  endPos: [number, number, number];
  lookAt: [number, number, number];
  lensPreset: string; // e.g. "50mm Anamorphic Prime f/1.2"
}

export interface Lighting3DConfig {
  environment: 
    | 'golden_hour' 
    | 'deep_space' 
    | 'cyberpunk_neon' 
    | 'underwater_abyss' 
    | 'studio_softbox' 
    | 'candlelit_tavern' 
    | 'desert_sunset'
    | 'highland_mist';
  keyLightColor: string;
  fillLightColor: string;
  rimLightColor: string;
  ambientIntensity: number;
  directionalIntensity: number;
  volumetricFog: boolean;
  fogColor: string;
  fogDensity: number;
}

export interface Particles3DConfig {
  type: 'dust' | 'steam' | 'embers' | 'sparks' | 'rain' | 'bubbles' | 'stardust' | 'sandstorm' | 'hologram' | 'none';
  count: number;
  color: string;
  speed: number;
  size: number;
}

export interface VideoVariation {
  id: string;
  title: string;
  styleName: string;
  tagline: string;
  description: string;
  visualTheme: string;
  tone: string;
  colorGrade: string;
  musicStyle: string;
  captionStyle: CaptionStyle;
  cameraStyle: string;
  lightingEnvironment: string;
  badge: string;
  accentColor: string;
  recommendedVoiceId: string;
  render3DMode?: Render3DMode;
  project: Project;
}

export interface SceneSegment {
  id: string;
  index: number;
  title: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  duration: number;  // in seconds
  narration: string;
  speaker: string;
  wordCount: number;
  shotType: string;
  setting: string;
  lighting: string;
  cameraMovement: string;
  continuityTag: string;
  lowerThirdText?: string;
  sfxCue?: string;
  visualMood: string;
  visualPrompt: string;
  visualTheme: string;
  visualKeywords: string[];
  brightnessAdjustment?: number; // -50 to +50
  pacingAdjustment?: number;     // 0.8 to 1.3
  isRegenerating?: boolean;
  
  // Realistic 3D Video Production Metadata
  is3D?: boolean;
  camera3D?: Camera3DConfig;
  lighting3D?: Lighting3DConfig;
  particles3D?: Particles3DConfig;
  mesh3dObjects?: string[];
}

export interface Voice {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Neutral';
  age: 'Young' | 'Mid-30s' | 'Mature' | 'Elder';
  accent: 'American' | 'British' | 'Australian' | 'International' | 'Nordic';
  tone: 'Documentary' | 'Cinematic' | 'Conversational' | 'Energetic' | 'Calm' | 'Historical';
  descriptor: string;
  sampleText: string;
  avatarGradient: string;
  waveform: number[];
  speed: number;
  pitch: number;
}

export interface ThumbnailOption {
  id: string;
  label: string;
  bgTheme: string;
  headline: string;
  subtext: string;
  badgeText: string;
  accentColor: string;
}

export interface PlatformConnection {
  youtube: { connected: boolean; channelName: string; privacy: 'public' | 'unlisted' | 'private'; category: string };
  tiktok: { connected: boolean; accountName: string; allowDuet: boolean };
  instagram: { connected: boolean; accountName: string; shareToFeed: boolean };
  x: { connected: boolean; handle: string };
}

export interface PublishHistoryItem {
  id: string;
  platform: 'YouTube' | 'TikTok' | 'Instagram' | 'X';
  publishedAt: string;
  title: string;
  liveUrl: string;
  views: number;
  status: 'published' | 'processing';
}

export interface PublishingMetadata {
  titles: string[];
  selectedTitleIndex: number;
  description: string;
  tags: string[];
  selectedThumbnailIndex: number;
  thumbnails: ThumbnailOption[];
  platformConnections: PlatformConnection;
  publishHistory: PublishHistoryItem[];
}

export interface ProjectVersion {
  versionId: string;
  label: string;
  timestamp: string;
  author: string;
  summary: string;
  segments: SceneSegment[];
  selectedVoiceId: string;
  musicStyle: string;
  captionStyle: CaptionStyle;
}

export interface Project {
  id: string;
  title: string;
  prompt: string;
  logline: string;
  tone: string;
  targetAudience: string;
  targetDurationSec: number; // roughly 360s = 6 mins
  aspectRatio: AspectRatio;
  resolution: Resolution;
  colorGrade: string;
  musicStyle: string;
  captionStyle: CaptionStyle;
  selectedVoiceId: string;
  characterVoices: Record<string, string>;
  segments: SceneSegment[];
  publishingMetadata: PublishingMetadata;
  versionHistory: ProjectVersion[];
  currentVersion: number;
  
  // Video Variety Candidates
  variations?: VideoVariation[];
  selectedVariationId?: string;
  
  // 3D Realistic Video Engine Settings
  is3D?: boolean;
  render3DMode?: Render3DMode;
  cameraMode?: 'directed' | 'interactive';
  
  // Pipeline & State
  renderProgress: number; // 0 to 100
  renderingSceneIndex: number;
  statusMessage: string;
  estimatedTimeSec: number;
  estimatedCost: string;
  createdAt: string;
  updatedAt: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'cinegen' | 'user';
  text: string;
  timestamp: string;
  actionsPerformed?: string[];
  suggestedPrompts?: string[];
}
