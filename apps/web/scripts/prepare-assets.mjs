// Copies MediaPipe wasm files and downloads the AI models into public/,
// so the app serves them itself (no Google CDN, which is blocked in China)
// and the service worker can cache them for offline use.
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const WASM_FILES = ['vision_wasm_internal.js', 'vision_wasm_internal.wasm'];
const MODELS = [
  {
    file: 'pose_landmarker_full.task',
    url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
  },
  {
    file: 'mobilenet_v3_small.tflite',
    url: 'https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite',
  },
];

async function exists(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  const tmp = `${dest}.part`;
  try {
    execFileSync('curl', ['-fsSL', '--retry', '3', '-o', tmp, url], { stdio: 'inherit' });
  } catch {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
    await writeFile(tmp, Buffer.from(await res.arrayBuffer()));
  }
  await rename(tmp, dest);
}

const wasmDir = join(pub, 'mediapipe');
await mkdir(wasmDir, { recursive: true });
for (const f of WASM_FILES) {
  await copyFile(join(root, 'node_modules/@mediapipe/tasks-vision/wasm', f), join(wasmDir, f));
}

const modelDir = join(pub, 'models');
await mkdir(modelDir, { recursive: true });
for (const m of MODELS) {
  const dest = join(modelDir, m.file);
  if (await exists(dest)) continue;
  console.log(`Downloading ${m.file}…`);
  await download(m.url, dest);
}
console.log('Assets ready.');
