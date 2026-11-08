// Copies the on-device face finder for "make a character from a photo" into
// public/face/, so the app serves it itself and never fetches from Google at run
// time. Run with `npm run face-model` after changing the MediaPipe version; the
// output is committed. MediaPipe Tasks (runtime and Face Landmarker model):
// Apache License 2.0, Copyright Google LLC (docs/THIRD_PARTY.md).
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}public/face/`;
const wasm = `${root}node_modules/@mediapipe/tasks-vision/wasm/`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

await mkdir(out, { recursive: true });
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) {
  await copyFile(wasm + f, out + f);
  console.log(`copied ${f} (${(await stat(out + f)).size} bytes)`);
}
const res = await fetch(MODEL_URL);
if (!res.ok) throw new Error(`model download failed: ${res.status}`);
const model = Buffer.from(await res.arrayBuffer());
await writeFile(`${out}face_landmarker.task`, model);
const sha = createHash('sha256').update(model).digest('hex');
console.log(`face_landmarker.task: ${model.length} bytes, sha256 ${sha}`);
const version = JSON.parse(
  await readFile(`${root}node_modules/@mediapipe/tasks-vision/package.json`, 'utf8'),
).version;
await writeFile(
  `${out}VERSION.txt`,
  `@mediapipe/tasks-vision ${version}\nface_landmarker.task sha256 ${sha}\n`,
);
