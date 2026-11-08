// The on-device body finder for the camera mirror: Google's MediaPipe Pose
// Landmarker (lite model), served from our own origin (public/face/, copied by
// `npm run face-model`). Loaded only while the camera mirror runs, beside the face
// finder; it reads the same <video>, keeps nothing and sends nothing anywhere.
//
// Cost on tablets: the lite model, GPU first with a CPU fallback, and it reads
// every second camera frame (fewer when a reading is slow); the mirror smooths
// between readings.
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import { keepRequestsAtHome } from './faceFinder';
import type { BodyPoint } from './liveBody';

const BASE = `${import.meta.env.BASE_URL}face/`;
/**
 * Each reading's cost (ms, averaged) buys this much: the finder reads every
 * second frame when it is quick, and up to every sixth on a slow device, so the
 * face mirror and taps keep their time.
 */
const MS_PER_FRAME = 12;

let finder: Promise<PoseLandmarker> | null = null;
/** The finder once it is ready, so frames can be read without waiting. */
let ready: PoseLandmarker | null = null;
let frame = 0;
let cost = 0;
let lastStamp = 0;

async function create(delegate: 'GPU' | 'CPU'): Promise<PoseLandmarker> {
  keepRequestsAtHome();
  return PoseLandmarker.createFromOptions(
    {
      wasmLoaderPath: `${BASE}vision_wasm_internal.js`,
      wasmBinaryPath: `${BASE}vision_wasm_internal.wasm`,
    },
    {
      baseOptions: { modelAssetPath: `${BASE}pose_landmarker_lite.task`, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    },
  );
}

/** Get the body finder ready; false when it cannot load (the face mirror still works). */
export async function prepareBody(): Promise<boolean> {
  finder ??= create('GPU')
    .catch(() => create('CPU'))
    .catch((e: unknown) => {
      finder = null; // try again next time
      throw e;
    });
  const mine = finder;
  try {
    const f = await mine;
    // Closed while it was loading: do not bring it back.
    if (finder !== mine) return false;
    ready = f;
    frame = 0;
    cost = 0;
    return true;
  } catch {
    return false;
  }
}

/** Free the body finder's memory (leaving the screen). */
export async function closeBody(): Promise<void> {
  const f = finder;
  finder = null;
  ready = null;
  if (f) (await f.catch(() => null))?.close();
}

export interface BodyFrame {
  /** The body's points, or null when no one is seen. */
  points: BodyPoint[] | null;
  /** The picture's width / height. */
  aspect: number;
}

/**
 * Read the body in the video's current frame, or skip this frame (undefined) to
 * leave time for the face finder and the page. Call once per new video frame.
 */
export function readBody(video: HTMLVideoElement): BodyFrame | undefined {
  const f = ready;
  if (!f || video.videoWidth === 0) return undefined;
  const every = Math.min(6, Math.max(2, Math.ceil(cost / MS_PER_FRAME)));
  if (frame++ % every !== 0) return undefined;
  // Timestamps must always grow, even if two frames share a millisecond.
  const stamp = Math.max(performance.now(), lastStamp + 1);
  lastStamp = stamp;
  const t0 = performance.now();
  try {
    const result = f.detectForVideo(video, stamp);
    cost += (performance.now() - t0 - cost) * 0.2;
    return { points: result.landmarks[0] ?? null, aspect: video.videoWidth / video.videoHeight };
  } catch {
    return undefined; // a frame the finder could not read: skip it
  }
}
