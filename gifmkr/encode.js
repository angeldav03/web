// Driving the WebAssembly encoder.
//
// Frames are fed in one at a time and written straight out to the GIF stream, so
// peak memory is one decoded frame plus the output, not the whole animation.

import init, { GifEncoder, Options, probe, decode_preview } from './pkg/gifsmith.js';

let wasmReady = null;

/** Loads the wasm module once. Safe to call repeatedly. */
export function ready() {
  wasmReady ??= init();
  return wasmReady;
}

export { probe, decode_preview };

/** Gives the browser a chance to paint. Called between frames, but only when
 *  enough time has passed to be worth the round trip. */
const YIELD_EVERY_MS = 40;
let lastYield = 0;
async function breathe() {
  const now = performance.now();
  if (now - lastYield < YIELD_EVERY_MS) return;
  lastYield = now;
  if (typeof scheduler?.yield === 'function') {
    await scheduler.yield();
  } else {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function toOptions(settings) {
  const opts = new Options();
  opts.width = settings.width;
  opts.height = settings.height;
  opts.fit = settings.fit;
  opts.resample = settings.resample;
  opts.background = settings.background;
  opts.loops = settings.loops;
  opts.max_colors = settings.maxColors;
  opts.speed = settings.speed;
  opts.dither = settings.dither;
  opts.optimize = settings.optimize;
  opts.diff_tolerance = settings.diffTolerance;
  opts.keep_alpha = settings.keepAlpha;
  return opts;
}

/**
 * Expands the timeline into the sequence actually written.
 *
 * Bounce replays the middle of the animation backwards; the first and last
 * frames are left out of the return leg so they are not held twice as long.
 */
export function sequence(frames, { bounce }) {
  if (!bounce || frames.length < 3) return frames;
  return [...frames, ...frames.slice(1, -1).reverse()];
}

/**
 * Encodes frames into a GIF.
 *
 * @param {Array<{blob: Blob, delayMs: number|null}>} frames
 * @param {object} settings
 * @param {{onProgress?: (done: number, total: number) => void, signal?: AbortSignal}} hooks
 * @returns {Promise<{blob: Blob, frames: number, durationMs: number, elapsedMs: number}>}
 */
export async function encodeGif(frames, settings, { onProgress, signal } = {}) {
  await ready();
  const ordered = sequence(frames, settings);
  if (ordered.length === 0) throw new Error('There are no frames to encode.');

  const startedAt = performance.now();
  const opts = toOptions(settings);
  let encoder;
  let finished = false;
  let durationMs = 0;

  try {
    encoder = new GifEncoder(opts);
    for (let i = 0; i < ordered.length; i++) {
      signal?.throwIfAborted();
      const frame = ordered[i];
      const delay = Math.round(frame.delayMs ?? settings.defaultDelayMs);
      const bytes = new Uint8Array(await frame.blob.arrayBuffer());
      try {
        encoder.addFile(bytes, delay);
      } catch (err) {
        throw new Error(`Frame ${i + 1} (${frame.name ?? 'untitled'}): ${err.message ?? err}`);
      }
      durationMs += delay;
      onProgress?.(i + 1, ordered.length);
      await breathe();
    }

    const bytes = encoder.finish();
    finished = true;
    return {
      blob: new Blob([bytes], { type: 'image/gif' }),
      frames: ordered.length,
      durationMs,
      elapsedMs: performance.now() - startedAt,
    };
  } finally {
    opts.free();
    // finish() consumes the encoder on the Rust side; freeing it again would
    // be a double free.
    if (encoder && !finished) encoder.free();
  }
}
