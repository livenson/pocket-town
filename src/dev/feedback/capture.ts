// What a piece of feedback carries besides the kid's words: a picture of the
// screen, what was under their finger, and the last few things they tapped.
import { getFontEmbedCSS, toPng } from 'html-to-image';
import { useUi } from '../../state/ui';

/** Marks the tool's own elements, so they are left out of screenshots and the trail. */
export const UI_ATTR = 'data-feedback-ui';

export interface TrailEntry {
  at: number;
  screen: string;
  label: string;
}

const trail: TrailEntry[] = [];

function labelOf(el: Element | null): string {
  const target = el?.closest('button, a, input, select, [role="button"], [aria-label]');
  if (!target) return '';
  const name = target.getAttribute('aria-label') ?? target.textContent ?? '';
  return name.replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** Remember what the kid taps (by accessible name), so Claude knows how they got here. */
export function recordTrail(): void {
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el || el.closest(`[${UI_ATTR}]`)) return;
      const label = labelOf(el);
      if (!label) return;
      trail.push({ at: Date.now(), screen: useUi.getState().nav.screen, label });
      if (trail.length > 30) trail.shift();
    },
    { capture: true },
  );
}

export const recentTrail = (): TrailEntry[] => [...trail];

function pathOf(el: Element): string {
  const parts: string[] = [];
  for (
    let e: Element | null = el;
    e && e !== document.body && parts.length < 4;
    e = e.parentElement
  ) {
    const cls = [...e.classList].find((c) => !c.startsWith('is-'));
    parts.unshift(cls ? `${e.tagName.toLowerCase()}.${cls}` : e.tagName.toLowerCase());
  }
  return parts.join(' > ');
}

/** What is at a point on the page, under the tool's own overlay. */
export function describePoint(x: number, y: number) {
  const el = document
    .elementsFromPoint(x, y)
    .find((e) => !e.closest(`[${UI_ATTR}]`) && e !== document.documentElement);
  return {
    x: Math.round(x),
    y: Math.round(y),
    label: el ? labelOf(el) || undefined : undefined,
    element: el ? pathOf(el) : undefined,
    onStage: !!el?.closest('.stage-host, .stage-targets'),
  };
}

let fontCss: Promise<string> | null = null;

/**
 * A PNG of the page as the kid sees it. The play stage is WebGL, which a DOM
 * snapshot cannot read, so its current frame is swapped in as a picture first.
 */
export async function captureScreen(): Promise<string | null> {
  const root = document.getElementById('root');
  if (!root) return null;
  const canvas = document.querySelector<HTMLCanvasElement>('.stage-host canvas');
  let swap: HTMLImageElement | null = null;
  try {
    if (canvas) {
      const { getStage } = await import('../../stage/stage');
      const stage = await getStage();
      // Read the frame in the same task as drawing it, before the browser clears it.
      stage.app.render();
      swap = document.createElement('img');
      swap.src = stage.app.canvas.toDataURL('image/png');
      swap.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      await swap.decode();
      canvas.before(swap);
      canvas.style.visibility = 'hidden';
    }
    const filter = (n: HTMLElement) => !(n instanceof Element && n.hasAttribute(UI_ATTR));
    fontCss ??= getFontEmbedCSS(root);
    return await toPng(root, {
      pixelRatio: 1,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      fontEmbedCSS: await fontCss,
      filter,
    });
  } catch {
    return null;
  } finally {
    swap?.remove();
    if (canvas) canvas.style.visibility = '';
  }
}

// --- Voice ------------------------------------------------------------------------

export const canRecord = (): boolean =>
  !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined' && isSecureContext;

const MIME = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'];

export interface Recording {
  stop: () => Promise<Blob>;
}

/** Start recording; `onLevel` gets the loudness (0..1) for a little meter. */
export async function startRecording(onLevel: (level: number) => void): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MIME.find((m) => MediaRecorder.isTypeSupported(m));
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.addEventListener('dataavailable', (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  });
  recorder.start(250);

  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let frame = 0;
  const meter = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const v of data) sum += ((v - 128) / 128) ** 2;
    onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
    frame = requestAnimationFrame(meter);
  };
  meter();

  return {
    stop: () =>
      new Promise((resolve) => {
        cancelAnimationFrame(frame);
        recorder.addEventListener('stop', () => {
          stream.getTracks().forEach((t) => t.stop());
          void ctx.close();
          resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
        });
        recorder.stop();
      }),
  };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.addEventListener('load', () =>
      resolve(typeof r.result === 'string' ? (r.result.split(',')[1] ?? '') : ''),
    );
    r.addEventListener('error', () => reject(r.error ?? new Error('read failed')));
    r.readAsDataURL(blob);
  });
}
