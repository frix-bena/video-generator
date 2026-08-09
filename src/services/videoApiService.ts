import { AspectRatio, Resolution } from '../types/cinegen';

export interface VideoModelInfo {
  id: string;
  name: string;
  provider: 'replicate' | 'fal' | 'simulation';
  description: string;
  badge: string;
  isAvailable: boolean;
  maxDuration: number;
  supportedAspectRatios: string[];
}

export interface VideoModelsResponse {
  success: boolean;
  hasReplicateToken: boolean;
  hasFalKey: boolean;
  defaultModel: string;
  models: VideoModelInfo[];
}

export interface VideoGenerationRequest {
  prompt: string;
  model?: string;
  aspectRatio?: AspectRatio;
  duration?: number;
  resolution?: Resolution;
}

export interface VideoTaskResponse {
  success: boolean;
  taskId: string;
  remoteId?: string;
  provider?: string;
  model: string;
  status: 'starting' | 'processing' | 'completed' | 'failed' | 'canceled';
  progress: number;
  message: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  estimatedTimeSec?: number;
  prompt?: string;
  error?: string;
  elapsedSec?: number;
  completedAt?: number;
}

const API_BASE = '/api';

export class VideoApiService {
  /**
   * Fetches supported AI video models and server API key status
   */
  static async getModels(): Promise<VideoModelsResponse> {
    try {
      const res = await fetch(`${API_BASE}/models`);
      if (!res.ok) {
        throw new Error(`Failed to load models: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('[VideoApiService] getModels failed, returning offline defaults:', err);
      return {
        success: true,
        hasReplicateToken: false,
        hasFalKey: false,
        defaultModel: 'minimax/video-01',
        models: [
          {
            id: 'minimax/video-01',
            name: 'Minimax Video-01',
            provider: 'replicate',
            description: 'Ultra-photorealistic cinematic motion & facial detail',
            badge: 'Recommended',
            isAvailable: true,
            maxDuration: 6,
            supportedAspectRatios: ['16:9', '9:16', '1:1'],
          },
          {
            id: 'luma/ray',
            name: 'Luma Dream Machine',
            provider: 'replicate',
            description: 'High-speed camera tracking & realistic depth',
            badge: 'High Action',
            isAvailable: true,
            maxDuration: 5,
            supportedAspectRatios: ['16:9', '9:16', '1:1'],
          },
          {
            id: 'fal-ai/minimax-video',
            name: 'Fal.ai Minimax',
            provider: 'fal',
            description: 'Serverless inference queue with high motion coherence',
            badge: 'Fast Queue',
            isAvailable: true,
            maxDuration: 6,
            supportedAspectRatios: ['16:9', '9:16', '1:1'],
          }
        ]
      };
    }
  }

  /**
   * Submits prompt to backend /api/generate-video
   */
  static async generateVideo(request: VideoGenerationRequest): Promise<VideoTaskResponse> {
    const res = await fetch(`${API_BASE}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Generation request failed with status ${res.status}`);
    }

    return data;
  }

  /**
   * Checks status of a video generation task
   */
  static async checkStatus(taskId: string): Promise<VideoTaskResponse> {
    const res = await fetch(`${API_BASE}/video-status/${taskId}`);
    const data = await res.json();
    if (!res.ok && !data.success) {
      throw new Error(data.error || `Status check failed with status ${res.status}`);
    }
    return data;
  }

  /**
   * Cancels a running video generation task
   */
  static async cancelTask(taskId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/cancel-video/${taskId}`, {
        method: 'POST',
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  /**
   * Polls task status until completion or failure
   */
  static async pollVideoUntilComplete(
    taskId: string,
    onProgress: (status: VideoTaskResponse) => void,
    signal?: AbortSignal,
    intervalMs: number = 2000
  ): Promise<VideoTaskResponse> {
    let attempts = 0;
    const maxAttempts = 90; // ~3 minutes max polling window

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        if (signal?.aborted) {
          clearInterval(interval);
          this.cancelTask(taskId).catch(() => {});
          reject(new Error('Video generation was canceled.'));
          return;
        }

        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(interval);
          reject(new Error('Video generation timed out after 3 minutes.'));
          return;
        }

        try {
          const statusRes = await this.checkStatus(taskId);
          onProgress(statusRes);

          if (statusRes.status === 'completed') {
            clearInterval(interval);
            resolve(statusRes);
          } else if (statusRes.status === 'failed') {
            clearInterval(interval);
            reject(new Error(statusRes.error || 'Video rendering failed.'));
          } else if (statusRes.status === 'canceled') {
            clearInterval(interval);
            reject(new Error('Task was canceled.'));
          }
        } catch (pollErr) {
          console.warn('[VideoApiService] Polling tick error (retrying):', pollErr);
        }
      }, intervalMs);
    });
  }
}
