// The on-device face finder: Google's MediaPipe Face Landmarker, served from our
// own origin (public/face/, copied by `npm run face-model`). Loaded only when a
// grown-up makes a character from a photo or the camera; nothing is sent
// anywhere, and pictures are dropped as soon as they have been read.
//
// Following MediaPipe's web guidance: GPU first with a CPU fallback, one
// landmarker switched between IMAGE and VIDEO mode, blendshapes for the live
// mirror, frames only when the video has a new one, and close() when done.
import { FaceLandmarker, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { faceFromLandmarks, type PhotoLook, type Sampler } from './faceFromPhoto';

const BASE = `${import.meta.env.BASE_URL}face/`;
/** Big photos are scaled down first: faster, and plenty for a face. */
const MAX_SIDE = 1024;
/** Colours are read from a small copy of the camera picture. */
const SAMPLE_SIDE = 320;

type Mode = 'IMAGE' | 'VIDEO';

let guarded = false;
/**
 * MediaPipe 1.x has a usage logger that posts to a Google server (task, OS,
 * version, timings; no pictures) and no setting to turn it off. Pocket Town
 * sends nothing anywhere: the Content Security Policy already blocks it, and
 * this answers any request to another site locally, so it is never even tried.
 */
function keepRequestsAtHome(): void {
  if (guarded || typeof window === 'undefined') return;
  guarded = true;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let url: URL | null = null;
    try {
      const href =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      url = new URL(href, location.href);
    } catch {
      // Not a URL we understand: let the browser decide (and the CSP still applies).
    }
    // Only other web sites are answered here; our own files, data: and blob: pass.
    if (url && /^https?:$/.test(url.protocol) && url.origin !== location.origin)
      return Promise.resolve(new Response(null, { status: 204 }));
    return original(input, init);
  };
}
let finder: Promise<FaceLandmarker> | null = null;
let mode: Mode = 'IMAGE';

async function create(delegate: 'GPU' | 'CPU'): Promise<FaceLandmarker> {
  keepRequestsAtHome();
  return FaceLandmarker.createFromOptions(
    {
      wasmLoaderPath: `${BASE}vision_wasm_internal.js`,
      wasmBinaryPath: `${BASE}vision_wasm_internal.wasm`,
    },
    {
      baseOptions: { modelAssetPath: `${BASE}face_landmarker.task`, delegate },
      runningMode: 'IMAGE',
      numFaces: 1,
      outputFaceBlendshapes: true,
    },
  );
}

async function getFinder(want: Mode): Promise<FaceLandmarker> {
  finder ??= create('GPU')
    .catch(() => create('CPU'))
    .catch((e: unknown) => {
      finder = null; // try again next time
      throw e;
    });
  const f = await finder;
  if (mode !== want) {
    await f.setOptions({ runningMode: want });
    mode = want;
  }
  return f;
}

/** Free the face finder's memory (leaving the screen). */
export async function closeFinder(): Promise<void> {
  const f = finder;
  finder = null;
  mode = 'IMAGE';
  if (f) (await f.catch(() => null))?.close();
}

/** Average colour around a point of a picture's pixels. */
function samplerFor(pixels: ImageData): Sampler {
  return (x, y, r) => {
    const rr = Math.max(1, Math.round(r));
    const step = Math.max(1, Math.floor(rr / 3));
    let n = 0;
    let r0 = 0;
    let g0 = 0;
    let b0 = 0;
    for (let dy = -rr; dy <= rr; dy += step) {
      for (let dx = -rr; dx <= rr; dx += step) {
        const px = Math.round(x + dx);
        const py = Math.round(y + dy);
        if (px < 0 || py < 0 || px >= pixels.width || py >= pixels.height) continue;
        const o = (py * pixels.width + px) * 4;
        r0 += pixels.data[o] ?? 0;
        g0 += pixels.data[o + 1] ?? 0;
        b0 += pixels.data[o + 2] ?? 0;
        n++;
      }
    }
    return n === 0 ? null : [r0 / n, g0 / n, b0 / n];
  };
}

function lookFrom(result: FaceLandmarkerResult, w: number, h: number, pixels: ImageData) {
  const marks = result.faceLandmarks[0];
  if (!marks) return null;
  return faceFromLandmarks(
    marks.map((m) => ({ x: m.x * w, y: m.y * h })),
    samplerFor(pixels),
  );
}

export type PhotoResult =
  { kind: 'look'; look: PhotoLook } | { kind: 'noFace' } | { kind: 'unavailable' };

/** Get the face finder ready (downloads it from our own site the first time). */
export async function prepareFinder(): Promise<boolean> {
  try {
    await getFinder('IMAGE');
    return true;
  } catch {
    return false;
  }
}

/** Read a photo and suggest a face. Never throws: problems become a gentle result. */
export async function lookFromPhoto(file: Blob): Promise<PhotoResult> {
  let bitmap: ImageBitmap | null = null;
  const canvas = document.createElement('canvas');
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * k));
    canvas.height = Math.max(1, Math.round(bitmap.height * k));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { kind: 'unavailable' };
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let result: FaceLandmarkerResult;
    try {
      result = (await getFinder('IMAGE')).detect(canvas);
    } catch {
      return { kind: 'unavailable' };
    }
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const look = lookFrom(result, canvas.width, canvas.height, pixels);
    return look ? { kind: 'look', look } : { kind: 'noFace' };
  } catch {
    return { kind: 'noFace' };
  } finally {
    // Drop the photo: nothing of it is kept.
    bitmap?.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

export interface LiveFrame {
  look: PhotoLook | null;
  /** Blendshape scores by name (smile, blink, jaw open…), for the mirror. */
  scores: Map<string, number>;
  /** The face's points (0–1 across and down the picture), or null with no face. */
  points: { x: number; y: number }[] | null;
}

/**
 * Watch a playing <video> (the camera) and report each new frame's reading.
 * Returns a stop function. Frames are read only when the video has a new one.
 */
export async function watchVideo(
  video: HTMLVideoElement,
  onFrame: (frame: LiveFrame) => void,
): Promise<() => void> {
  const f = await getFinder('VIDEO');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let raf = 0;
  let lastTime = -1;
  let frame = 0;
  let stopped = false;
  let pixels: ImageData | null = null;
  const loop = () => {
    if (stopped) return;
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2 || video.currentTime === lastTime) return;
    lastTime = video.currentTime;
    let result: FaceLandmarkerResult;
    try {
      result = f.detectForVideo(video, performance.now());
    } catch {
      return; // a frame the finder could not read: skip it
    }
    // Colours change slowly: copy the picture every few frames only.
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (ctx && w > 0 && (frame++ % 4 === 0 || !pixels)) {
      const k = Math.min(1, SAMPLE_SIDE / Math.max(w, h));
      canvas.width = Math.round(w * k);
      canvas.height = Math.round(h * k);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    const scores = new Map<string, number>(
      (result.faceBlendshapes[0]?.categories ?? []).map((c) => [c.categoryName, c.score]),
    );
    const look = pixels ? lookFrom(result, canvas.width, canvas.height, pixels) : null;
    onFrame({ look, scores, points: result.faceLandmarks[0] ?? null });
  };
  raf = requestAnimationFrame(loop);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    canvas.width = 0;
    canvas.height = 0;
    pixels = null;
  };
}
