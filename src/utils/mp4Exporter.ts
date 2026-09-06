import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { PosterEngine } from '../engine/posterEngine';
import { PosterConfig } from '../types';

export interface Mp4ExportOptions {
  fps?: number;
  width?: number;
  height?: number;
  bitrate?: number;
  onProgress?: (progress: number, frame: number, totalFrames: number, statusText: string) => void;
}

/**
 * Checks if the browser environment supports WebCodecs VideoEncoder for MP4 export.
 */
export function isWebCodecsSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).VideoEncoder === 'function';
}

/**
 * Checks if MediaRecorder supports MP4 container.
 */
export function isMediaRecorderMp4Supported(): boolean {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return false;
  return (
    MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ||
    MediaRecorder.isTypeSupported('video/mp4')
  );
}

/**
 * Export high-definition MP4 directly in the browser.
 * Uses WebCodecs VideoEncoder + mp4-muxer for high-speed offline deterministic rendering.
 * Falls back to MediaRecorder if WebCodecs is unavailable.
 */
export async function exportPosterToMp4(
  config: PosterConfig,
  options: Mp4ExportOptions = {}
): Promise<Blob> {
  const fps = options.fps || 30;
  const width = options.width || PosterEngine.W || 1080;
  const height = options.height || PosterEngine.H || 1920;
  const bitrate = options.bitrate || 7_500_000;
  const onProgress = options.onProgress;

  // Create an offscreen export canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const renderer = PosterEngine.createRenderer(canvas, config);
  const duration = renderer.model?.T || 10;
  const totalFrames = Math.max(1, Math.ceil(duration * fps));

  // Wait for all built-in or custom images to be ready
  if (renderer.imagesReady) {
    onProgress?.(0, 0, totalFrames, '正在准备图文素材…');
    await renderer.imagesReady();
  }

  // Strategy 1: WebCodecs + mp4-muxer (Highest quality, fast offline rendering, accurate 1080x1920)
  if (isWebCodecsSupported()) {
    return await encodeWithWebCodecs(renderer, canvas, width, height, fps, bitrate, totalFrames, duration, onProgress);
  }

  // Strategy 2: MediaRecorder with native MP4 support
  if (isMediaRecorderMp4Supported()) {
    return await recordWithMediaRecorder(canvas, renderer, duration, onProgress);
  }

  // Strategy 3: Fallback error or WebM recording
  throw new Error('当前浏览器内核不支持 WebCodecs 或 MP4 MediaRecorder 录制，请使用最新版 Chrome、Edge 或 Safari 浏览器。');
}

async function encodeWithWebCodecs(
  renderer: any,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  fps: number,
  bitrate: number,
  totalFrames: number,
  duration: number,
  onProgress?: (progress: number, frame: number, totalFrames: number, statusText: string) => void
): Promise<Blob> {
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width,
      height,
      frameRate: fps,
    },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'strict',
  });

  let encoderError: Error | null = null;
  const videoEncoder = new (window as any).VideoEncoder({
    output: (chunk: any, meta: any) => {
      try {
        muxer.addVideoChunk(chunk, meta);
      } catch (err: any) {
        encoderError = err;
      }
    },
    error: (e: any) => {
      encoderError = e instanceof Error ? e : new Error(String(e));
    },
  });

  // H.264 profile: Main profile level 4.0 or baseline
  // avc1.640028 = High Profile, Level 4.0 (1080p compatible)
  // avc1.4d002a = Main Profile, Level 4.2
  // avc1.42001f = Baseline Profile, Level 3.1
  const candidateCodecs = ['avc1.640028', 'avc1.4d002a', 'avc1.42001f'];
  let selectedCodec = 'avc1.640028';

  for (const c of candidateCodecs) {
    try {
      const support = await (window as any).VideoEncoder.isConfigSupported({
        codec: c,
        width,
        height,
        bitrate,
        framerate: fps,
      });
      if (support.supported) {
        selectedCodec = c;
        break;
      }
    } catch {
      // Continue to next candidate
    }
  }

  videoEncoder.configure({
    codec: selectedCodec,
    width,
    height,
    bitrate,
    framerate: fps,
  });

  const frameDurationUs = Math.round(1_000_000 / fps);

  for (let i = 0; i < totalFrames; i++) {
    if (encoderError) {
      throw encoderError;
    }

    const t = Math.min((i / fps), duration - 0.001);
    renderer.draw(t);

    const timestampUs = i * frameDurationUs;
    const videoFrame = new (window as any).VideoFrame(canvas, {
      timestamp: timestampUs,
      duration: frameDurationUs,
    });

    const isKeyframe = i % (fps * 2) === 0; // Keyframe every 2 seconds
    videoEncoder.encode(videoFrame, { keyFrame: isKeyframe });
    videoFrame.close();

    // Prevent blocking the UI thread and allow progress feedback
    if (i % 6 === 0 || i === totalFrames - 1) {
      const progress = (i + 1) / totalFrames;
      onProgress?.(progress, i + 1, totalFrames, `正在逐帧渲染 MP4: ${Math.round(progress * 100)}% (${i + 1}/${totalFrames} 帧)`);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  onProgress?.(0.99, totalFrames, totalFrames, '正在封装 MP4 视频轨道…');
  await videoEncoder.flush();
  videoEncoder.close();

  if (encoderError) {
    throw encoderError;
  }

  muxer.finalize();
  const buffer = (muxer.target as ArrayBufferTarget).buffer;
  return new Blob([buffer], { type: 'video/mp4' });
}

async function recordWithMediaRecorder(
  canvas: HTMLCanvasElement,
  renderer: any,
  duration: number,
  onProgress?: (progress: number, frame: number, totalFrames: number, statusText: string) => void
): Promise<Blob> {
  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : 'video/mp4';

  const stream = (canvas as any).captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    recorder.onerror = (e) => reject(e);
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/mp4' }));
    };

    recorder.start(100);

    const startTime = performance.now();
    const timer = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      renderer.draw(Math.min(elapsed, duration - 0.001));
      const progress = Math.min(1, elapsed / duration);
      onProgress?.(progress, Math.round(elapsed * 30), Math.round(duration * 30), `实时录制中: ${elapsed.toFixed(1)}s / ${duration.toFixed(1)}s`);

      if (elapsed >= duration) {
        clearInterval(timer);
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }
    }, 1000 / 30);
  });
}

/**
 * Triggers a direct download for an exported MP4 Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 3000);
}
