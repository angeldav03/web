// The ordered list of frames, and the strip of thumbnails that edits it.
//
// A frame always holds its pixels as an *encoded* blob (the original file for a
// dropped image, a WebP or PNG still for a grabbed video frame) rather than raw
// RGBA. A minute of 720p video is gigabytes as RGBA and tens of megabytes this
// way, and the Rust side has to decode it either way.

let nextId = 1;

export class Timeline {
  #frames = [];
  #selected = null;
  #dragFrom = null;

  /**
   * @param {HTMLOListElement} listEl
   * @param {{onChange?: () => void}} hooks
   */
  constructor(listEl, { onChange } = {}) {
    this.el = listEl;
    this.onChange = onChange ?? (() => {});
    this.defaultDelayMs = 100;

    this.el.addEventListener('click', (e) => this.#onClick(e));
    this.el.addEventListener('input', (e) => this.#onDelayInput(e));
    this.el.addEventListener('keydown', (e) => this.#onKeyDown(e));
    this.el.addEventListener('dragstart', (e) => this.#onDragStart(e));
    this.el.addEventListener('dragover', (e) => this.#onDragOver(e));
    this.el.addEventListener('drop', (e) => this.#onDrop(e));
    this.el.addEventListener('dragend', () => this.#onDragEnd());
  }

  get frames() { return this.#frames; }
  get length() { return this.#frames.length; }

  /** @param {{name: string, blob: Blob, width: number, height: number,
   *           format: string, thumbUrl: string, origin: 'file'|'video'}} frame */
  add(frame) {
    this.#frames.push({ id: `f${nextId++}`, delayMs: null, ...frame });
  }

  remove(id) {
    const at = this.#frames.findIndex((f) => f.id === id);
    if (at < 0) return;
    URL.revokeObjectURL(this.#frames[at].thumbUrl);
    this.#frames.splice(at, 1);
    if (this.#selected === id) {
      this.#selected = this.#frames[Math.min(at, this.#frames.length - 1)]?.id ?? null;
    }
    this.render();
  }

  clear() {
    for (const f of this.#frames) URL.revokeObjectURL(f.thumbUrl);
    this.#frames = [];
    this.#selected = null;
    this.render();
  }

  /** Reorders in place; `how` is 'name', 'reverse' or 'shuffle'. */
  reorder(how) {
    if (how === 'name') {
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      this.#frames.sort((a, b) => collator.compare(a.name, b.name));
    } else if (how === 'reverse') {
      this.#frames.reverse();
    } else if (how === 'shuffle') {
      for (let i = this.#frames.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.#frames[i], this.#frames[j]] = [this.#frames[j], this.#frames[i]];
      }
    }
    this.render();
  }

  move(from, to) {
    if (from === to || from < 0 || from >= this.#frames.length) return;
    const [frame] = this.#frames.splice(from, 1);
    this.#frames.splice(Math.max(0, Math.min(to, this.#frames.length)), 0, frame);
    this.render();
  }

  /** Total run time in ms, honouring per-frame overrides. */
  totalMs(defaultDelayMs = this.defaultDelayMs) {
    return this.#frames.reduce((sum, f) => sum + (f.delayMs ?? defaultDelayMs), 0);
  }

  render() {
    const previous = new Map(
      [...this.el.children].map((li) => [li.dataset.id, li]),
    );
    this.el.replaceChildren(
      ...this.#frames.map((frame, i) => {
        const li = previous.get(frame.id) ?? this.#build(frame);
        li.querySelector('.idx').textContent = i + 1;
        li.classList.toggle('selected', frame.id === this.#selected);
        const delay = li.querySelector('.delay');
        delay.placeholder = Math.round(this.defaultDelayMs);
        delay.classList.toggle('custom', frame.delayMs !== null);
        return li;
      }),
    );
    this.onChange();
  }

  #build(frame) {
    const li = document.createElement('li');
    li.className = 'frame';
    li.dataset.id = frame.id;
    li.draggable = true;
    li.tabIndex = 0;
    li.innerHTML = `
      <img class="thumb" alt="" loading="lazy">
      <span class="idx"></span>
      <button type="button" class="kill" title="Remove this frame" aria-label="Remove frame">&times;</button>
      <span class="meta">
        <span class="name"></span>
        <input class="delay" type="number" min="10" max="65000" step="10"
               title="Delay for this frame in milliseconds (blank follows the global rate)"
               aria-label="Frame delay in milliseconds">
      </span>`;
    const img = li.querySelector('.thumb');
    img.src = frame.thumbUrl;
    const name = li.querySelector('.name');
    name.textContent = frame.name;
    name.title = `${frame.name} — ${frame.width}×${frame.height} ${frame.format}`;
    li.querySelector('.delay').value = frame.delayMs ?? '';
    return li;
  }

  #frameIdAt(node) {
    return node.closest?.('.frame')?.dataset.id ?? null;
  }

  #indexOf(id) {
    return this.#frames.findIndex((f) => f.id === id);
  }

  #onClick(e) {
    const id = this.#frameIdAt(e.target);
    if (!id) return;
    if (e.target.closest('.kill')) {
      this.remove(id);
      return;
    }
    this.#selected = id;
    this.render();
  }

  #onDelayInput(e) {
    if (!e.target.classList.contains('delay')) return;
    const id = this.#frameIdAt(e.target);
    const frame = this.#frames[this.#indexOf(id)];
    if (!frame) return;
    const raw = e.target.value.trim();
    frame.delayMs = raw === '' ? null : Math.max(10, Number(raw) || 0);
    e.target.classList.toggle('custom', frame.delayMs !== null);
    this.onChange();
  }

  #onKeyDown(e) {
    const id = this.#frameIdAt(e.target);
    if (!id || e.target.classList.contains('delay')) return;
    const at = this.#indexOf(id);

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.remove(id);
      this.el.children[Math.min(at, this.el.children.length - 1)]?.focus();
      return;
    }
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();

    if (e.altKey) {
      this.move(at, at + step);
      this.el.querySelector(`[data-id="${id}"]`)?.focus();
    } else {
      const next = this.#frames[at + step];
      if (!next) return;
      this.#selected = next.id;
      this.render();
      this.el.querySelector(`[data-id="${next.id}"]`)?.focus();
    }
  }

  #onDragStart(e) {
    const id = this.#frameIdAt(e.target);
    if (!id) return;
    this.#dragFrom = this.#indexOf(id);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox will not start a drag unless some data is set.
    e.dataTransfer.setData('text/plain', id);
    e.target.closest('.frame').classList.add('dragging');
  }

  #onDragOver(e) {
    if (this.#dragFrom === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const over = e.target.closest?.('.frame');
    for (const li of this.el.children) li.classList.remove('drop-before', 'drop-after');
    if (!over) return;
    const box = over.getBoundingClientRect();
    over.classList.add(e.clientX < box.left + box.width / 2 ? 'drop-before' : 'drop-after');
  }

  #onDrop(e) {
    if (this.#dragFrom === null) return;
    e.preventDefault();
    const over = e.target.closest?.('.frame');
    let to = this.#frames.length;
    if (over) {
      const box = over.getBoundingClientRect();
      to = this.#indexOf(over.dataset.id) + (e.clientX < box.left + box.width / 2 ? 0 : 1);
    }
    // Removing the dragged frame first shifts everything after it down by one.
    if (to > this.#dragFrom) to--;
    this.move(this.#dragFrom, to);
    this.#onDragEnd();
  }

  #onDragEnd() {
    this.#dragFrom = null;
    for (const li of this.el.children) {
      li.classList.remove('dragging', 'drop-before', 'drop-after');
    }
  }
}
