// Turning a video file into still frames, without uploading anything.
//
// Two routes. The browser's own decoder handles whatever it natively supports
// (MP4/H.264, WebM, MOV and friends) with no download and no setup, so it is
// always tried first. Everything else -- AVI, MPEG-1/2, MKV, odd codecs --
// falls back to ffmpeg.wasm, which is fetched on demand the first time it is
// actually needed rather than being paid for by every visitor.

/** Frames are grabbed at most this wide/tall; a GIF is never bigger in practice. */
const EXTRACT_CAP = 1280;

/** ffmpeg writes a whole window of frames into its virtual FS before we read them
 *  back, so the window is kept short to bound how much memory that costs. */
const FFMPEG_WINDOW_FRAMES = 60;

const FFMPEG_VERSION = '0.12.15';
const CORE_VERSION = '0.12.10';
// The ESM build specifically. The UMD wrapper always starts its worker as a
// module, but the UMD worker chunk only implements the classic-worker
// `importScripts` path -- webpack stubs out its dynamic-import fallback -- so
// that pairing can never load the core.
const LOCAL_ESM = 'vendor/ffmpeg/esm/';
const LOCAL_CORE = 'vendor/ffmpeg/core/';
const CDN_ESM = `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/esm/`;
const CDN_CORE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm/`;

/* -------------------------------------------------------------------------- */
/* shared helpers                                                              */
/* -------------------------------------------------------------------------- */

/** Largest size within EXTRACT_CAP that keeps the source aspect ratio. */
function capped(width, height) {
  const scale = Math.min(1, EXTRACT_CAP / Math.max(width, height));
  return {
    width: Math.max(2, Math.round(width * scale / 2) * 2),
    height: Math.max(2, Math.round(height * scale / 2) * 2),
  };
}

let blobType = null;
/** WebP keeps intermediate frames small; not every browser can encode it. */
function frameBlobType(canvas) {
  if (blobType === null) {
    blobType = canvas.toDataURL('image/webp').startsWith('data:image/webp')
      ? 'image/webp'
      : 'image/png';
  }
  return blobType;
}

function canvasToBlob(canvas) {
  const type = frameBlobType(canvas);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('could not read the frame off the canvas'))),
      type,
      type === 'image/webp' ? 0.92 : undefined,
    );
  });
}

function once(target, event, { timeout = 0, signal } = {}) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      target.removeEventListener(event, ok);
      target.removeEventListener('error', bad);
      clearTimeout(timer);
    };
    const ok = (e) => { cleanup(); resolve(e); };
    const bad = () => { cleanup(); reject(new Error(`${event} failed`)); };
    const timer = timeout
      ? setTimeout(() => { cleanup(); reject(new Error(`timed out waiting for ${event}`)); }, timeout)
      : 0;
    target.addEventListener(event, ok, { once: true });
    target.addEventListener('error', bad, { once: true });
    signal?.addEventListener('abort', () => { cleanup(); reject(signal.reason); }, { once: true });
  });
}

/* -------------------------------------------------------------------------- */
/* route 1: the browser's own decoder                                          */
/* -------------------------------------------------------------------------- */

/** Seeks and waits until the new frame is genuinely on screen. */
async function seekTo(video, time) {
  const target = Math.max(0, Math.min(time, Math.max(0, video.duration - 0.001)));
  // A seek to the position we are already at fires no event at all.
  if (Math.abs(video.currentTime - target) < 1e-4 && video.readyState >= 2) return;

  const seeked = once(video, 'seeked', { timeout: 15000 });
  video.currentTime = target;
  await seeked;

  // 'seeked' means the seek finished, not that the frame has been painted.
  // Where it exists, one video-frame callback is a much stronger guarantee.
  if (typeof video.requestVideoFrameCallback === 'function') {
    await new Promise((resolve) => {
      const id = video.requestVideoFrameCallback(() => resolve());
      setTimeout(() => { video.cancelVideoFrameCallback?.(id); resolve(); }, 80);
    });
  }
}

/**
 * Works out how long the video is.
 *
 * Some WebM files carry no duration in their header -- anything MediaRecorder
 * produced, and most live-streamed captures. Seeking far past the end makes the
 * browser scan for the real end and report it.
 */
async function resolveDuration(video) {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;

  await new Promise((resolve) => {
    const settle = () => {
      video.removeEventListener('durationchange', check);
      clearTimeout(timer);
      resolve();
    };
    const check = () => { if (Number.isFinite(video.duration)) settle(); };
    const timer = setTimeout(settle, 5000);
    video.addEventListener('durationchange', check);
    video.currentTime = 1e101;
  });

  video.currentTime = 0;
  return Number.isFinite(video.duration) ? video.duration : 0;
}

async function openNative(file) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  Object.assign(video, { preload: 'auto', muted: true, playsInline: true, src: url });
  video.setAttribute('playsinline', '');

  try {
    await once(video, 'loadedmetadata', { timeout: 20000 });
    if (!video.videoWidth || !video.videoHeight) {
      throw new Error('file has no decodable video track');
    }
    if ((await resolveDuration(video)) <= 0) {
      throw new Error('video duration could not be determined');
    }
    // Metadata can parse even when the codec itself is unsupported, so prove a
    // real frame can be decoded before committing to this route.
    await once(video, 'loadeddata', { timeout: 20000 });
    await seekTo(video, Math.min(0.05, video.duration / 2));
  } catch (err) {
    URL.revokeObjectURL(url);
    video.removeAttribute('src');
    video.load();
    throw err;
  }

  const duration = video.duration;
  const size = capped(video.videoWidth, video.videoHeight);
  const canvas = document.createElement('canvas');
  Object.assign(canvas, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  return {
    kind: 'native',
    decoder: 'browser',
    duration,
    width: video.videoWidth,
    height: video.videoHeight,
    ...size,
    element: video,

    async *extract({ fps, start, end, maxFrames }, { signal, onProgress } = {}) {
      const step = 1 / fps;
      const total = plannedCount({ fps, start, end, maxFrames });
      for (let i = 0; i < total; i++) {
        signal?.throwIfAborted();
        const time = start + i * step;
        await seekTo(video, time);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        onProgress?.(i + 1, total);
        yield { blob: await canvasToBlob(canvas), time, ...size };
      }
    },

    dispose() {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    },
  };
}

/* -------------------------------------------------------------------------- */
/* route 2: ffmpeg.wasm                                                        */
/* -------------------------------------------------------------------------- */

let ffmpegPromise = null;

async function exists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Works out where to load ffmpeg.wasm from.
 *
 * Its heavy lifting happens in a Worker, and a Worker script has to be
 * same-origin. Files vendored by scripts/fetch-ffmpeg.sh satisfy that outright.
 * Straight from a CDN they cannot, so the worker is turned into a blob -- which
 * does inherit this page's origin -- after rewriting its two relative imports to
 * absolute URLs, since a blob has no base to resolve them against.
 */
async function ffmpegSources(onStatus) {
  const absolute = (path) => new URL(path, location.href).href;

  if (await exists(`${LOCAL_ESM}worker.js`)) {
    onStatus?.('Starting the bundled decoder\u2026');
    return {
      module: absolute(`${LOCAL_ESM}index.js`),
      coreURL: absolute(`${LOCAL_CORE}ffmpeg-core.js`),
      wasmURL: absolute(`${LOCAL_CORE}ffmpeg-core.wasm`),
      // Same-origin, so the wrapper can resolve its own worker.
      classWorkerURL: null,
    };
  }

  onStatus?.('Fetching the extra decoder (about 32\u00a0MB, once per visit)\u2026');
  const res = await fetch(`${CDN_ESM}worker.js`);
  if (!res.ok) throw new Error(`could not fetch the ffmpeg worker (${res.status})`);
  const source = (await res.text())
    .replace(/(["'])\.\/(const|errors)\.js\1/g, `"${CDN_ESM}$2.js"`);

  return {
    module: `${CDN_ESM}index.js`,
    coreURL: `${CDN_CORE}ffmpeg-core.js`,
    wasmURL: `${CDN_CORE}ffmpeg-core.wasm`,
    classWorkerURL: URL.createObjectURL(new Blob([source], { type: 'text/javascript' })),
  };
}

/** Loads ffmpeg.wasm once and caches it. */
function loadFFmpeg(onStatus) {
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    const src = await ffmpegSources(onStatus);
    const { FFmpeg } = await import(/* @vite-ignore */ src.module);
    if (!FFmpeg) throw new Error('the ffmpeg wrapper did not export FFmpeg');

    const ffmpeg = new FFmpeg();
    const config = { coreURL: src.coreURL, wasmURL: src.wasmURL };
    if (src.classWorkerURL) config.classWorkerURL = src.classWorkerURL;

    if ((await ffmpeg.load(config)) === false) throw new Error('ffmpeg refused to start');
    return ffmpeg;
  })();

  // A failed load should not poison every later attempt.
  ffmpegPromise.catch(() => { ffmpegPromise = null; });
  return ffmpegPromise;
}

/** Reads what ffmpeg says about the file. It reports this while failing to
 *  produce an output, which is expected and not an error. */
async function probeWithFFmpeg(ffmpeg, name) {
  let log = '';
  const listen = ({ message }) => { log += message + '\n'; };
  ffmpeg.on('log', listen);
  try {
    await ffmpeg.exec(['-hide_banner', '-i', name]);
  } catch { /* probing always "fails"; the log is the point */ }
  ffmpeg.off('log', listen);

  const size = /,\s*(\d{2,5})x(\d{2,5})[\s,]/.exec(log);
  const time = /Duration:\s*(\d+):(\d\d):(\d\d\.\d+)/.exec(log);
  return {
    width: size ? +size[1] : 0,
    height: size ? +size[2] : 0,
    duration: time ? +time[1] * 3600 + +time[2] * 60 + +time[3] : 0,
    log,
  };
}

async function openFFmpeg(file, onStatus) {
  const ffmpeg = await loadFFmpeg(onStatus);
  onStatus?.('Reading the file…');

  // Keep the extension: ffmpeg uses it as a hint when probing the container.
  const ext = (file.name.match(/\.[a-z0-9]{1,5}$/i) || ['.bin'])[0].toLowerCase();
  const input = `in${ext}`;
  await ffmpeg.writeFile(input, new Uint8Array(await file.arrayBuffer()));

  const info = await probeWithFFmpeg(ffmpeg, input);
  if (!info.width || !info.height) {
    await ffmpeg.deleteFile(input).catch(() => {});
    throw new Error('ffmpeg could not find a video stream in this file');
  }
  const size = capped(info.width, info.height);

  return {
    kind: 'ffmpeg',
    decoder: 'ffmpeg.wasm',
    duration: info.duration,
    width: info.width,
    height: info.height,
    ...size,
    element: null,

    async *extract({ fps, start, end, maxFrames }, { signal, onProgress } = {}) {
      const total = plannedCount({ fps, start, end, maxFrames });
      let done = 0;

      // Decoding is done a window at a time so the virtual filesystem never
      // holds more than FFMPEG_WINDOW_FRAMES images at once.
      for (let first = 0; first < total; first += FFMPEG_WINDOW_FRAMES) {
        signal?.throwIfAborted();
        const count = Math.min(FFMPEG_WINDOW_FRAMES, total - first);
        const from = start + first / fps;

        await ffmpeg.exec([
          '-hide_banner',
          '-accurate_seek', '-ss', from.toFixed(3),
          '-i', input,
          '-frames:v', String(count),
          '-vf', `fps=${fps},scale=${size.width}:${size.height}:flags=lanczos`,
          '-c:v', 'png', '-compression_level', '1',
          '-f', 'image2', 'f%04d.png',
        ]);

        for (let i = 1; i <= count; i++) {
          signal?.throwIfAborted();
          const name = `f${String(i).padStart(4, '0')}.png`;
          let bytes;
          try {
            bytes = await ffmpeg.readFile(name);
          } catch {
            break; // the stream ended early; nothing more in this window
          }
          await ffmpeg.deleteFile(name).catch(() => {});
          done++;
          onProgress?.(done, total);
          yield {
            blob: new Blob([bytes], { type: 'image/png' }),
            time: from + (i - 1) / fps,
            ...size,
          };
        }
      }
    },

    dispose() {
      ffmpeg.deleteFile(input).catch(() => {});
    },
  };
}

/* -------------------------------------------------------------------------- */
/* public surface                                                              */
/* -------------------------------------------------------------------------- */

/** How many frames a given sampling request will actually produce. */
export function plannedCount({ fps, start, end, maxFrames }) {
  const span = Math.max(0, end - start);
  // A zero-length span still yields the single frame sitting at `start`.
  return Math.max(1, Math.min(maxFrames, Math.floor(span * fps + 1e-6) + 1));
}

/**
 * Opens a video for frame extraction, picking whichever decoder can read it.
 *
 * `onStatus` is called with progress messages while ffmpeg.wasm is downloading,
 * which is the one step slow enough that the user needs telling about it.
 */
export async function openVideo(file, { onStatus } = {}) {
  let nativeError;
  try {
    return await openNative(file);
  } catch (err) {
    nativeError = err;
  }

  try {
    return await openFFmpeg(file, onStatus);
  } catch (err) {
    throw new Error(
      `Neither decoder could read this file. The browser said "${nativeError.message}"; ` +
      `ffmpeg said "${err.message}".`,
    );
  }
}
