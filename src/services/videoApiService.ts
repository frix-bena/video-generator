import { AspectRatio, Resolution } from '../types/cinegen';

export interface VideoModelInfo {
  id: string;
  name: string;
  provider: 'replicate' | 'minimax' | 'fal' | 'simulation';
  description: string;
  badge: string;
  isAvailable: boolean;
  maxDuration: number;
  supportedAspectRatios: string[];
}

export interface VideoModelsResponse {
  success: boolean;
  hasReplicateToken: boolean;
  hasMiniMaxKey?: boolean;
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
  waitForCompletion?: boolean;
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
   * Fetches supported AI video diffusion models and server API key status
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
        hasMiniMaxKey: false,
        hasFalKey: false,
        defaultModel: 'minimax/video-01',
        models: [
          {
            id: 'minimax/video-01',
            name: 'MiniMax Video-01',
            provider: 'replicate',
            description: 'Ultra-photorealistic cinematic motion & facial detail',
            badge: 'Recommended',
            isAvailable: true,
            maxDuration: 6,
            supportedAspectRatios: ['16:9', '9:16', '1:1'],
          },
          {
            id: 'kwaivgi/kling-v1.6-standard',
            name: 'Kling Video v1.6 Standard',
            provider: 'replicate',
            description: 'High temporal consistency and realistic fluid dynamics',
            badge: 'Next-Gen Kling',
            isAvailable: true,
            maxDuration: 5,
            supportedAspectRatios: ['16:9', '9:16', '1:1'],
          },
          {
            id: 'luma/ray',
            name: 'Luma Dream Machine (Ray)',
            provider: 'replicate',
            description: 'High-speed camera tracking & realistic depth',
            badge: 'High Action',
            isAvailable: true,
            maxDuration: 5,
            supportedAspectRatios: ['16:9', '9:16', '1:1'],
          },
          {
            id: 'wan-video/wan-2.1-t2v-720p',
            name: 'Wan 2.1 Diffusion (720p)',
            provider: 'replicate',
            description: 'Open-weights diffusion with high prompt adherence',
            badge: 'Wan 2.1',
            isAvailable: true,
            maxDuration: 5,
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
      body: JSON.stringify({
        ...request,
        waitForCompletion: request.waitForCompletion ?? true,
      }),
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
    const maxAttempts = 120; // ~4 minutes max polling window

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
          reject(new Error('Video generation timed out.'));
          return;
        }

        try {
          const statusRes = await this.checkStatus(taskId);
          onProgress(statusRes);

          if (statusRes.status === 'completed' && statusRes.videoUrl) {
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

  /**
   * High-level helper: starts generation and guarantees final .mp4 video URL
   */
  static async generateRealisticVideo(
    request: VideoGenerationRequest,
    onProgress?: (status: VideoTaskResponse) => void,
    signal?: AbortSignal
  ): Promise<VideoTaskResponse> {
    const initialResponse = await this.generateVideo({
      ...request,
      waitForCompletion: false,
    });

    if (initialResponse.status === 'completed' && initialResponse.videoUrl) {
      onProgress?.(initialResponse);
      return initialResponse;
    }

    if (onProgress) {
      onProgress(initialResponse);
    }

    return await this.pollVideoUntilComplete(
      initialResponse.taskId,
      (status) => {
        if (onProgress) onProgress(status);
      },
      signal,
      2000
    );
  }

  /**
   * Reloads / refreshes signed video stream URL if expired or decoding failed
   */
  static async reloadVideoUrl(params: {
    taskId?: string;
    videoUrl?: string | null;
    prompt?: string;
    model?: string;
  }): Promise<VideoTaskResponse> {
    try {
      const res = await fetch(`${API_BASE}/reload-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Stream reload failed with status ${res.status}`);
      }

      return data;
    } catch (err: unknown) {
      console.error('[VideoApiService] reloadVideoUrl error:', err);
      throw err;
    }
  }
}
