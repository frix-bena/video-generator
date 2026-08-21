import fs from 'node:fs';
import path from 'node:path';
import { type Request, type Response } from 'express';
import { Readable } from 'node:stream';

export class VideoStreamService {
  /**
   * Serves a local video file using HTTP 206 Partial Content range chunking
   * ensuring browser decoders never crash on large MP4/WebM files.
   */
  public static serveLocalVideoFile(
    filePath: string,
    req: Request,
    res: Response,
    defaultContentType = 'video/mp4'
  ): void {
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'Video file not found' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Detect content type from file extension
    let contentType = defaultContentType;
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.m3u8') {
      contentType = 'application/vnd.apple.mpegurl';
    } else if (ext === '.ts') {
      contentType = 'video/MP2T';
    } else if (ext === '.webm') {
      contentType = 'video/webm';
    } else if (ext === '.mp4') {
      contentType = 'video/mp4';
    }

    if (range) {
      // Parse Range Header, e.g. "bytes=0-1048575" or "bytes=1024-"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate byte range bounds
      if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`,
          'Accept-Ranges': 'bytes',
        }).end();
        return;
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, private',
      });

      fileStream.on('error', (streamErr) => {
        console.error('[VideoStreamService] File stream read error:', streamErr);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });

      fileStream.pipe(res);
    } else {
      // Full stream response (HTTP 200 OK) with Accept-Ranges declared
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, private',
      });

      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (streamErr) => {
        console.error('[VideoStreamService] File stream read error:', streamErr);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });

      fileStream.pipe(res);
    }
  }

  /**
   * Proxies a remote video stream with full HTTP 206 Range request forwarding,
   * adding CORS and streaming headers so browsers can seek seamlessly.
   */
  public static async proxyRemoteVideoStream(
    videoUrl: string,
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const upstreamResponse = await fetch(videoUrl, {
        method: 'GET',
        headers,
      });

      if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
        res.status(upstreamResponse.status).json({
          success: false,
          error: `Upstream video returned status ${upstreamResponse.status}`,
        });
        return;
      }

      // Extract upstream headers
      const status = upstreamResponse.status;
      const contentType = upstreamResponse.headers.get('content-type') || (videoUrl.includes('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp4');
      const contentLength = upstreamResponse.headers.get('content-length');
      const contentRange = upstreamResponse.headers.get('content-range');
      const acceptRanges = upstreamResponse.headers.get('accept-ranges') || 'bytes';

      const responseHeaders: Record<string, string> = {
        'Content-Type': contentType,
        'Accept-Ranges': acceptRanges,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      };

      if (contentLength) {
        responseHeaders['Content-Length'] = contentLength;
      }
      if (contentRange) {
        responseHeaders['Content-Range'] = contentRange;
      }

      res.writeHead(status, responseHeaders);

      if (upstreamResponse.body) {
        // Convert web ReadableStream to node Readable stream and pipe
        const nodeReadable = Readable.fromWeb(upstreamResponse.body as import('node:stream/web').ReadableStream<Uint8Array>);
        nodeReadable.pipe(res);
      } else {
        res.end();
      }
    } catch (err: unknown) {
      console.error('[VideoStreamService] Proxy stream error:', err);
      if (!res.headersSent) {
        const msg = err instanceof Error ? err.message : 'Video proxy stream error';
        res.status(502).json({ success: false, error: msg });
      }
    }
  }
}
