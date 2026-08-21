import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const execAsync = promisify(exec);

export interface TranscodeOptions {
  inputPath: string;
  outputPath: string;
  videoCodec?: string;
  audioCodec?: string;
  videoBitrate?: string;
  audioBitrate?: string;
  resolution?: string; // e.g. '1920x1080' or '1280x720'
  fps?: number;
  faststart?: boolean;
}

export interface HlsGenerationOptions {
  inputPath: string;
  outputDir: string;
  playlistName?: string; // e.g. 'master.m3u8'
  segmentDuration?: number; // default 4 seconds
}

export class VideoTranscoder {
  private static ffmpegPath: string | null = null;
  private static checkedFfmpeg = false;

  /**
   * Checks whether ffmpeg is available on the host system
   */
  public static async isFfmpegAvailable(): Promise<boolean> {
    if (this.checkedFfmpeg) {
      return this.ffmpegPath !== null;
    }

    try {
      const { stdout } = await execAsync('which ffmpeg || where ffmpeg');
      const foundPath = stdout.trim().split('\n')[0];
      if (foundPath && fs.existsSync(foundPath)) {
        this.ffmpegPath = foundPath;
        this.checkedFfmpeg = true;
        return true;
      }
    } catch {
      // ffmpeg not found in PATH
    }

    this.checkedFfmpeg = true;
    this.ffmpegPath = null;
    return false;
  }

  /**
   * Generates web-safe FFmpeg command line arguments ensuring:
   * 1. H.264 video codec (libx264, yuv420p, baseline/main profile) for 100% universal browser compatibility
   * 2. AAC audio codec (-c:a aac -b:a 128k)
   * 3. Web streaming fast-start moov atom at beginning (-movflags +faststart)
   */
  public static getWebSafeFfmpegArgs(options: TranscodeOptions): string[] {
    const args: string[] = [
      '-y', // Overwrite output file
      '-i', options.inputPath,
      // Video encoding settings
      '-c:v', options.videoCodec || 'libx264',
      '-pix_fmt', 'yuv420p',
      '-profile:v', 'main',
      '-level', '3.1',
      '-preset', 'medium',
      '-crf', '22',
      // Audio encoding settings
      '-c:a', options.audioCodec || 'aac',
      '-b:a', options.audioBitrate || '128k',
      '-ar', '44100',
      '-ac', '2',
    ];

    if (options.resolution) {
      args.push('-s', options.resolution);
    }

    if (options.fps) {
      args.push('-r', String(options.fps));
    }

    // Critical for HTML5 web playback: Place moov atom at beginning of file
    if (options.faststart !== false) {
      args.push('-movflags', '+faststart');
    }

    args.push(options.outputPath);
    return args;
  }

  /**
   * Transcodes an input video file to web-safe MP4 format with faststart
   */
  public static async transcodeToWebSafeMp4(options: TranscodeOptions): Promise<{ success: boolean; outputPath: string; error?: string }> {
    const hasFfmpeg = await this.isFfmpegAvailable();
    if (!hasFfmpeg) {
      return {
        success: false,
        outputPath: options.outputPath,
        error: 'FFmpeg binary is not installed on system. Cannot perform offline transcoding.',
      };
    }

    const args = this.getWebSafeFfmpegArgs(options);

    return new Promise((resolve) => {
      const ffmpeg = spawn(this.ffmpegPath || 'ffmpeg', args);
      let stderrLog = '';

      ffmpeg.stderr.on('data', (chunk) => {
        stderrLog += chunk.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0 && fs.existsSync(options.outputPath)) {
          resolve({
            success: true,
            outputPath: options.outputPath,
          });
        } else {
          resolve({
            success: false,
            outputPath: options.outputPath,
            error: `FFmpeg process exited with code ${code}: ${stderrLog.slice(-500)}`,
          });
        }
      });

      ffmpeg.on('error', (err) => {
        resolve({
          success: false,
          outputPath: options.outputPath,
          error: err.message,
        });
      });
    });
  }

  /**
   * Generates HLS streaming files (.m3u8 manifest and .ts segment chunks)
   */
  public static async generateHlsStream(options: HlsGenerationOptions): Promise<{ success: boolean; playlistPath: string; error?: string }> {
    const hasFfmpeg = await this.isFfmpegAvailable();
    const playlistName = options.playlistName || 'index.m3u8';
    const outputPlaylist = path.join(options.outputDir, playlistName);

    if (!hasFfmpeg) {
      return {
        success: false,
        playlistPath: outputPlaylist,
        error: 'FFmpeg binary is not installed on system. Cannot generate HLS segments.',
      };
    }

    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }

    const segmentDuration = options.segmentDuration || 4;
    const segmentPattern = path.join(options.outputDir, 'segment_%03d.ts');

    const args = [
      '-y',
      '-i', options.inputPath,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-f', 'hls',
      '-hls_time', String(segmentDuration),
      '-hls_list_size', '0',
      '-hls_segment_filename', segmentPattern,
      outputPlaylist,
    ];

    return new Promise((resolve) => {
      const ffmpeg = spawn(this.ffmpegPath || 'ffmpeg', args);
      let stderrLog = '';

      ffmpeg.stderr.on('data', (chunk) => {
        stderrLog += chunk.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPlaylist)) {
          resolve({
            success: true,
            playlistPath: outputPlaylist,
          });
        } else {
          resolve({
            success: false,
            playlistPath: outputPlaylist,
            error: `FFmpeg HLS generation exited with code ${code}: ${stderrLog.slice(-500)}`,
          });
        }
      });

      ffmpeg.on('error', (err) => {
        resolve({
          success: false,
          playlistPath: outputPlaylist,
          error: err.message,
        });
      });
    });
  }
}
