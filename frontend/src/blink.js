import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const CLOSE = 0.5;       // skor >= ini  -> mata dianggap tertutup
const OPEN = 0.3;        // skor <= ini  -> mata dianggap terbuka lagi
const WINDOW_MS = 1800;  // 2 kedip harus terjadi dalam waktu ini

async function buatLandmarker(delegate) {
  const fileset = await FilesetResolver.forVisionTasks(WASM);
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1,
  });
}

export async function startBlinkDetection(video, { onBlink, onDouble, onFace }) {
  let landmarker;
  try {
    landmarker = await buatLandmarker("GPU");
  } catch {
    landmarker = await buatLandmarker("CPU"); // cadangan kalau GPU tidak didukung
  }

  let raf = 0;
  let lastTime = -1;
  let closed = false;
  let blinks = [];
  let pause = 0; // jeda setelah terdeteksi

  function loop() {
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2 || video.currentTime === lastTime) return;
    lastTime = video.currentTime;

    const res = landmarker.detectForVideo(video, performance.now());
    const cats = res.faceBlendshapes?.[0]?.categories;
    onFace(Boolean(cats));
    if (!cats) return;

    const skor = (n) => cats.find((c) => c.categoryName === n)?.score ?? 0;
    const mata = (skor("eyeBlinkLeft") + skor("eyeBlinkRight")) / 2;
    const now = performance.now();
    if (now < pause) return;

    if (!closed && mata > CLOSE) {
      closed = true;
    } else if (closed && mata < OPEN) {
      closed = false; // mata terbuka lagi = 1 kedip selesai
      blinks = blinks.filter((t) => now - t < WINDOW_MS);
      blinks.push(now);
      onBlink(blinks.length);
      if (blinks.length >= 2) {
        blinks = [];
        pause = now + 1500;
        onDouble();
      }
    }
  }
  loop();

  return {
    reset() {
      blinks = [];
      closed = false;
      pause = performance.now() + 800;
    },
    stop() {
      cancelAnimationFrame(raf);
      landmarker.close();
    },
  };
}
