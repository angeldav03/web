// Wiring: file intake, the settings form, and the encode run.

import { Timeline } from './frames.js';
import { encodeGif, ready, probe, decode_preview, sequence } from './encode.js';
import { openVideo, plannedCount } from './video.js';

const $ = (id) => document.getElementById(id);

/** Formats the browser will happily put in an <img>; anything else is decoded
 *  by the wasm module to build a thumbnail. */
const DISPLAYABLE = new Set(['png', 'jpeg', 'gif', 'webp', 'bmp', 'avif']);

const timeline = new Timeline($('timeline'), { onChange: refreshDerived });
let resultUrl = null;
let encodeRun = null;
/** Cleared once the user edits the size themselves, so we stop auto-fitting. */
let sizeIsAutomatic = true;
let lockedAspect = 16 / 9;

/* -------------------------------------------------------------------------- */
/* chrome                                                                      */
/* -------------------------------------------------------------------------- */

function toast(message, { kind = '', title = '', ms = 7000 } = {}) {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  if (title) el.appendChild(Object.assign(document.createElement('b'), { textContent: title }));
  el.appendChild(document.createTextNode(message));
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), ms);
  return el;
}

const bytes = (n) =>
  n < 1024 ? `${n} B`
  : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB`
  : `${(n / 1024 ** 2).toFixed(2)} MB`;

const seconds = (ms) => (ms >= 10_000 ? `${(ms / 1000).toFixed(1)} s` : `${(ms / 1000).toFixed(2)} s`);

/* -------------------------------------------------------------------------- */
/* settings                                                                    */
/* -------------------------------------------------------------------------- */

function readSettings() {
  const perSecond = $('rate-mode').value === 'fps';
  const rate = Math.max(0.1, Number($('rate-value').value) || 10);
  const hex = $('bg-color').value.slice(1);

  return {
    width: Math.max(1, Math.round(Number($('out-width').value) || 1)),
    height: Math.max(1, Math.round(Number($('out-height').value) || 1)),
    fit: Number($('fit-mode').value),
    resample: Number($('resample').value),
    // Rust reads this as 0xRRGGBBAA; the picker cannot express alpha.
    background: ((parseInt(hex, 16) << 8) | 0xff) >>> 0,
    loops: $('loop-mode').value === '0' ? 0 : Math.max(1, Number($('loop-count').value) || 1),
    maxColors: Number($('colors').value),
    speed: Number($('effort').value),
    dither: $('dither').checked,
    optimize: $('optimize').checked,
    diffTolerance: Number($('tolerance').value),
    keepAlpha: $('keep-alpha').checked,
    bounce: $('pingpong').checked,
    defaultDelayMs: perSecond ? 1000 / rate : rate,
  };
}

/** Recomputes everything that is derived from the frames or the form. */
function refreshDerived() {
  const settings = readSettings();
  timeline.defaultDelayMs = settings.defaultDelayMs;

  const count = timeline.length;
  $('frame-count').textContent = count;
  $('timeline-wrap').hidden = count === 0;
  $('encode').disabled = count === 0 || !$('encode').dataset.wasmReady;

  if (sizeIsAutomatic && count > 0) applyFirstFrameSize();

  // Effort and colour sliders read as bare numbers otherwise.
  $('colors-out').textContent = settings.maxColors;
  $('effort-out').textContent =
    settings.speed <= 3 ? 'best' : settings.speed <= 12 ? 'balanced' : 'fastest';
  $('tolerance-out').textContent = settings.diffTolerance;
  $('tolerance-field').hidden = !settings.optimize;
  // Source transparency is only reachable with frame diffing switched off,
  // because that feature claims the transparent palette slot for itself.
  $('alpha-field').hidden = settings.optimize;

  $('loop-count-field').hidden = $('loop-mode').value === '0';
  $('rate-label').textContent = $('rate-mode').value === 'fps' ? 'fps' : 'ms';

  const note = $('rate-note');
  const delay = settings.defaultDelayMs;
  if (delay < 20) {
    note.hidden = false;
    note.textContent =
      `Most viewers clamp delays under 20 ms to 100 ms, so this will likely play far ` +
      `slower than ${Math.round(1000 / delay)} fps. Around 20–50 fps is the practical ceiling.`;
  } else {
    note.hidden = true;
  }
}

function applyFirstFrameSize(force = false) {
  const first = timeline.frames[0];
  if (!first) return;
  // Very large sources make for enormous GIFs; start somewhere sensible.
  const cap = force ? Math.max(first.width, first.height) : 480;
  const scale = Math.min(1, cap / Math.max(first.width, first.height));
  const w = Math.max(1, Math.round(first.width * scale));
  const h = Math.max(1, Math.round(first.height * scale));
  $('out-width').value = w;
  $('out-height').value = h;
  lockedAspect = w / h;
}

/* -------------------------------------------------------------------------- */
/* intake                                                                      */
/* -------------------------------------------------------------------------- */

const isVideo = (file) =>
  file.type.startsWith('video/') || /\.(mp4|m4v|mov|webm|avi|mkv|mpe?g|mpe|wmv|flv|ogv|3gp|ts)$/i.test(file.name);

async function thumbnailFor(blob, format) {
  if (DISPLAYABLE.has(format)) return URL.createObjectURL(blob);

  // TIFF and ICO decode in Rust but will not render in an <img>, so repaint
  // them into a PNG the browser does understand.
  const buffer = decode_preview(new Uint8Array(await blob.arrayBuffer()), 320);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = buffer.width;
    canvas.height = buffer.height;
    const pixels = new ImageData(new Uint8ClampedArray(buffer.data), canvas.width, canvas.height);
    canvas.getContext('2d').putImageData(pixels, 0, 0);
    return await new Promise((resolve) =>
      canvas.toBlob((png) => resolve(URL.createObjectURL(png)), 'image/png'));
  } finally {
    buffer.free();
  }
}

async function addImage(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  let info;
  try {
    info = probe(data);
  } catch (err) {
    throw new Error(`${file.name}: ${err.message ?? err}`);
  }
  const { width, height, format } = info;
  info.free();

  timeline.add({
    name: file.name,
    blob: file,
    width,
    height,
    format,
    origin: 'file',
    thumbUrl: await thumbnailFor(file, format),
  });
}

async function handleFiles(fileList) {
  const files = [...fileList];
  if (files.length === 0) return;

  const images = files.filter((f) => !isVideo(f));
  const videos = files.filter(isVideo);

  // Dropping a folder of stills should keep the order the OS listed them in.
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  images.sort((a, b) => collator.compare(a.name, b.name));

  const failures = [];
  for (const file of images) {
    try {
      await addImage(file);
    } catch (err) {
      failures.push(err.message ?? String(err));
    }
  }
  timeline.render();

  if (failures.length) {
    toast(failures.slice(0, 3).join('; ') + (failures.length > 3 ? ` (+${failures.length - 3} more)` : ''),
      { kind: 'bad', title: 'Some files could not be read' });
  }
  for (const file of videos) addVideoCard(file);
}

/* -------------------------------------------------------------------------- */
/* video cards                                                                 */
/* -------------------------------------------------------------------------- */

function addVideoCard(file) {
  const card = document.createElement('div');
  card.className = 'panel video-card';
  card.innerHTML = `
    <div class="vhead">
      <span class="vname"></span>
      <span class="badge b-decoder">opening…</span>
      <span class="badge b-size"></span>
      <button type="button" class="kill danger" style="margin-left:auto">Remove</button>
    </div>
    <p class="note status"></p>
    <div class="body" hidden>
      <div class="grid3">
        <label class="field">Sample rate (fps)
          <input class="i-fps" type="number" min="0.1" max="60" step="0.5" value="10"></label>
        <label class="field">Start (s)
          <input class="i-start" type="number" min="0" step="0.1" value="0"></label>
        <label class="field">End (s)
          <input class="i-end" type="number" min="0" step="0.1"></label>
        <label class="field">Frame limit
          <input class="i-max" type="number" min="1" max="2000" step="1" value="200"></label>
      </div>
      <p class="note plan"></p>
      <button type="button" class="primary wide go">Add frames</button>
      <div class="progress" hidden>
        <div class="progress-bar"></div><span class="progress-text"></span>
      </div>
    </div>`;
  card.querySelector('.vname').textContent = file.name;
  $('video-cards').appendChild(card);

  const status = card.querySelector('.status');
  const body = card.querySelector('.body');
  let source = null;
  let aborter = null;

  const cleanup = () => { aborter?.abort(); source?.dispose(); card.remove(); };
  card.querySelector('.kill').addEventListener('click', cleanup);

  (async () => {
    try {
      source = await openVideo(file, { onStatus: (m) => { status.textContent = m; } });
    } catch (err) {
      card.querySelector('.b-decoder').textContent = 'unreadable';
      status.textContent = err.message ?? String(err);
      return;
    }

    card.querySelector('.b-decoder').textContent = source.decoder;
    card.querySelector('.b-size').textContent =
      `${source.width}×${source.height} · ${source.duration.toFixed(1)}s`;
    status.textContent = source.kind === 'ffmpeg'
      ? 'Your browser cannot decode this format, so ffmpeg.wasm is handling it. No preview, but extraction works.'
      : '';
    status.hidden = !status.textContent;

    if (source.element) {
      source.element.controls = true;
      card.insertBefore(source.element, body);
    }

    const fps = card.querySelector('.i-fps');
    const start = card.querySelector('.i-start');
    const end = card.querySelector('.i-end');
    const max = card.querySelector('.i-max');
    const plan = card.querySelector('.plan');
    end.value = source.duration.toFixed(2);
    end.max = source.duration.toFixed(2);
    start.max = source.duration.toFixed(2);
    body.hidden = false;

    const request = () => ({
      fps: Math.max(0.1, Number(fps.value) || 10),
      start: Math.max(0, Number(start.value) || 0),
      end: Math.min(source.duration, Number(end.value) || source.duration),
      maxFrames: Math.max(1, Number(max.value) || 200),
    });
    const replan = () => {
      const req = request();
      const n = plannedCount(req);
      const span = Math.max(0, req.end - req.start);
      plan.textContent =
        `${n} frame${n === 1 ? '' : 's'} from ${span.toFixed(1)}s of video` +
        (n >= req.maxFrames && span * req.fps + 1 > req.maxFrames ? ' (capped by the frame limit)' : '');
    };
    body.addEventListener('input', replan);
    replan();

    card.querySelector('.go').addEventListener('click', async (e) => {
      const button = e.currentTarget;
      const wrap = card.querySelector('.progress');
      const bar = card.querySelector('.progress-bar');
      const text = card.querySelector('.progress-text');
      button.disabled = true;
      wrap.hidden = false;
      aborter = new AbortController();

      let added = 0;
      try {
        const req = request();
        for await (const frame of source.extract(req, {
          signal: aborter.signal,
          onProgress: (done, total) => {
            bar.style.width = `${(done / total) * 100}%`;
            text.textContent = `frame ${done} of ${total}`;
          },
        })) {
          timeline.add({
            name: `${file.name} @ ${frame.time.toFixed(2)}s`,
            blob: frame.blob,
            width: frame.width,
            height: frame.height,
            format: frame.blob.type.replace('image/', ''),
            origin: 'video',
            thumbUrl: URL.createObjectURL(frame.blob),
          });
          added++;
          if (added % 8 === 0) timeline.render();
        }
        timeline.render();
        toast(`Added ${added} frame${added === 1 ? '' : 's'} from ${file.name}.`, { kind: 'good' });
        cleanup();
      } catch (err) {
        timeline.render();
        if (err?.name !== 'AbortError') {
          toast(err.message ?? String(err), { kind: 'bad', title: 'Frame extraction failed' });
        }
        button.disabled = false;
        wrap.hidden = true;
      }
    });
  })();
}

/* -------------------------------------------------------------------------- */
/* encoding                                                                    */
/* -------------------------------------------------------------------------- */

async function runEncode(event) {
  event.preventDefault();
  if (encodeRun) return;

  const settings = readSettings();
  const frames = timeline.frames;
  if (frames.length === 0) return;

  const aborter = new AbortController();
  encodeRun = aborter;
  $('encode').disabled = true;
  $('cancel').hidden = false;
  $('progress-wrap').hidden = false;
  $('result').hidden = true;

  const total = sequence(frames, settings).length;
  try {
    const result = await encodeGif(frames, settings, {
      signal: aborter.signal,
      onProgress: (done) => {
        $('progress-bar').style.width = `${(done / total) * 100}%`;
        $('progress-text').textContent = `encoding frame ${done} of ${total}`;
      },
    });

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(result.blob);
    $('result-img').src = resultUrl;
    $('download').href = resultUrl;
    $('stat-size').textContent = bytes(result.blob.size);
    $('stat-frames').textContent = result.frames;
    $('stat-duration').textContent = seconds(result.durationMs);
    $('stat-time').textContent = seconds(result.elapsedMs);
    $('result').hidden = false;
    $('result').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } catch (err) {
    if (err?.name !== 'AbortError') {
      toast(err.message ?? String(err), { kind: 'bad', title: 'Encoding failed' });
    }
  } finally {
    encodeRun = null;
    $('cancel').hidden = true;
    $('progress-wrap').hidden = true;
    $('progress-bar').style.width = '0';
    refreshDerived();
  }
}

/* -------------------------------------------------------------------------- */
/* events                                                                      */
/* -------------------------------------------------------------------------- */

const dropzone = $('dropzone');
dropzone.addEventListener('click', (e) => {
  if (!e.target.closest('button') || e.target.id === 'browse') $('file-input').click();
});
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('file-input').click(); }
});
$('file-input').addEventListener('change', (e) => {
  handleFiles(e.target.files);
  e.target.value = '';
});

for (const type of ['dragenter', 'dragover']) {
  dropzone.addEventListener(type, (e) => { e.preventDefault(); dropzone.classList.add('over'); });
}
for (const type of ['dragleave', 'drop']) {
  dropzone.addEventListener(type, () => dropzone.classList.remove('over'));
}
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
});
// Anywhere else on the page, a stray drop would navigate away from the app.
for (const type of ['dragover', 'drop']) {
  window.addEventListener(type, (e) => {
    if (!dropzone.contains(e.target)) e.preventDefault();
  });
}

$('settings').addEventListener('input', (e) => {
  if (e.target.id === 'out-width' || e.target.id === 'out-height') {
    sizeIsAutomatic = false;
    if ($('lock-aspect').checked) {
      const w = $('out-width');
      const h = $('out-height');
      if (e.target === w) h.value = Math.max(1, Math.round((Number(w.value) || 1) / lockedAspect));
      else w.value = Math.max(1, Math.round((Number(h.value) || 1) * lockedAspect));
    }
  }
  refreshDerived();
});
$('settings').addEventListener('change', (e) => {
  if (e.target.id === 'lock-aspect' && e.target.checked) {
    lockedAspect = (Number($('out-width').value) || 16) / (Number($('out-height').value) || 9);
  }
});
$('settings').addEventListener('submit', runEncode);
$('cancel').addEventListener('click', () => encodeRun?.abort());

$('fit-first').addEventListener('click', () => {
  if (timeline.length === 0) {
    toast('Add a frame first, then this will match its size.');
    return;
  }
  sizeIsAutomatic = false;
  applyFirstFrameSize(true);
  refreshDerived();
});

$('clear-frames').addEventListener('click', () => timeline.clear());
for (const button of document.querySelectorAll('[data-order]')) {
  button.addEventListener('click', () => timeline.reorder(button.dataset.order));
}

/* -------------------------------------------------------------------------- */
/* boot                                                                        */
/* -------------------------------------------------------------------------- */

ready().then(
  () => {
    const pill = $('wasm-status');
    pill.textContent = 'encoder ready · offline';
    pill.className = 'pill pill-ok';
    $('encode').dataset.wasmReady = '1';
    refreshDerived();
  },
  (err) => {
    const pill = $('wasm-status');
    pill.textContent = 'encoder failed to load';
    pill.className = 'pill pill-bad';
    toast(`${err.message ?? err}. Run ./build.sh, then serve the www/ directory over HTTP.`,
      { kind: 'bad', title: 'Could not start the WebAssembly module', ms: 30000 });
  },
);

refreshDerived();
