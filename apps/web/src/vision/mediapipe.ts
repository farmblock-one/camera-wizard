import { FilesetResolver, ImageEmbedder, PoseLandmarker } from '@mediapipe/tasks-vision';

// Everything is served from our own origin (see scripts/prepare-assets.mjs),
// so it works offline and in places where Google's CDN is blocked.
const BASE = import.meta.env.BASE_URL;
const WASM_PATH = `${BASE}mediapipe`;
const POSE_MODEL = `${BASE}models/pose_landmarker_full.task`;
const EMBED_MODEL = `${BASE}models/mobilenet_v3_small.tflite`;

let filesetP: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;
let poseP: Promise<PoseLandmarker> | null = null;
let embedP: Promise<ImageEmbedder> | null = null;

function fileset() {
  return (filesetP ??= FilesetResolver.forVisionTasks(WASM_PATH));
}

function retryable<T>(make: () => Promise<T>, reset: () => void): Promise<T> {
  return make().catch((e) => {
    reset();
    throw e;
  });
}

/** Pose landmarker for still images; returns up to 4 people with segmentation masks. */
export function getPoseLandmarker(): Promise<PoseLandmarker> {
  return (poseP ??= retryable(
    async () =>
      PoseLandmarker.createFromOptions(await fileset(), {
        // CPU keeps results identical across devices and avoids WebGL issues on iOS.
        baseOptions: { modelAssetPath: POSE_MODEL, delegate: 'CPU' },
        runningMode: 'IMAGE',
        numPoses: 4,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        outputSegmentationMasks: true,
      }),
    () => (poseP = null),
  ));
}

export function getImageEmbedder(): Promise<ImageEmbedder> {
  return (embedP ??= retryable(
    async () =>
      ImageEmbedder.createFromOptions(await fileset(), {
        baseOptions: { modelAssetPath: EMBED_MODEL, delegate: 'CPU' },
        runningMode: 'IMAGE',
        l2Normalize: true,
        quantize: false,
      }),
    () => (embedP = null),
  ));
}

/** Drop cached tasks (e.g. after a wasm crash) so the next call creates fresh ones. */
export function resetVision() {
  poseP = null;
  embedP = null;
}

export const POSE_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS;
