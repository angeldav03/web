import init, { SnakeGame } from "./worm_pkg/wgame.js";

const State = { Ready: 0, Playing: 1, Paused: 2, LevelComplete: 3, GameOver: 4 };
const Event = { Eat: 1, LevelComplete: 2, GameOver: 4 };
const Dir = { Up: 0, Down: 1, Left: 2, Right: 3 };
const BEST_KEY = "wasm-worm-best-level";
const MUTE_KEY = "wasm-worm-muted";

const $ = (id) => document.getElementById(id);
const canvas = $("canvas");
const ctx = canvas.getContext("2d");
const overlay = $("overlay");

const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
};

let game = null;
let lastTime = 0;
let bestLevel = Number(storage.get(BEST_KEY)) || 1;
let muted = storage.get(MUTE_KEY) === "1";
let lastHud = "";
let lastOverlay = "";

// ---------- sound (tiny WebAudio blips, no assets) ----------
let audio = null;
function tone(freq, duration, type = "square", when = 0, volume = 0.06) {
  if (muted) return;
  audio ??= new (window.AudioContext || window.webkitAudioContext)();
  const t = audio.currentTime + when;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + duration);
}
const sounds = {
  eat: () => { tone(660, 0.08); tone(990, 0.08, "square", 0.05); },
  level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", i * 0.09, 0.08)),
  over: () => { tone(220, 0.25, "sawtooth"); tone(110, 0.4, "sawtooth", 0.15); },
};

// ---------- game setup ----------
function newGame() {
  game?.free();
  game = new SnakeGame(Date.now(), $("mode").value === "all");
  canvas.width = game.cols * 20;
  canvas.height = game.rows * 20;
}

function action() {
  if (!game) return;
  game.action();
}

// ---------- input ----------
// Matched against both `code` (layout independent) and `key` (incl. legacy "Up"/"Right" names).
const keyDirs = {
  ArrowUp: Dir.Up, Up: Dir.Up, KeyW: Dir.Up, w: Dir.Up,
  ArrowDown: Dir.Down, Down: Dir.Down, KeyS: Dir.Down, s: Dir.Down,
  ArrowLeft: Dir.Left, Left: Dir.Left, KeyA: Dir.Left, a: Dir.Left,
  ArrowRight: Dir.Right, Right: Dir.Right, KeyD: Dir.Right, d: Dir.Right,
};
const actionKeys = new Set(["Space", " ", "Spacebar", "Enter", "KeyP", "p"]);

window.addEventListener("keydown", (e) => {
  if (!game || e.target instanceof HTMLSelectElement) return;
  const dir = keyDirs[e.code] ?? keyDirs[e.key];
  if (dir !== undefined) {
    e.preventDefault();
    game.steer(dir);
  } else if (actionKeys.has(e.code) || actionKeys.has(e.key)) {
    e.preventDefault();
    // Avoid the button that has focus also receiving a synthetic click.
    if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
    action();
  }
});

let touchStart = null;
const board = document.querySelector(".board");
board.addEventListener("touchstart", (e) => {
  const t = e.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
board.addEventListener("touchend", (e) => {
  if (!game || !touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
    action(); // treat as a tap
  } else if (Math.abs(dx) > Math.abs(dy)) {
    game.steer(dx > 0 ? Dir.Right : Dir.Left);
  } else {
    game.steer(dy > 0 ? Dir.Down : Dir.Up);
  }
  e.preventDefault();
});
overlay.addEventListener("click", action);

$("btn-action").addEventListener("click", action);
$("btn-restart").addEventListener("click", newGame);
$("mode").addEventListener("change", () => { newGame(); $("mode").blur(); });
$("btn-mute").addEventListener("click", () => {
  muted = !muted;
  storage.set(MUTE_KEY, muted ? "1" : "0");
  renderMute();
});
function renderMute() {
  $("btn-mute").textContent = `Sound: ${muted ? "off" : "on"}`;
  $("btn-mute").setAttribute("aria-pressed", String(muted));
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) game?.pause();
});

// ---------- HUD / overlay ----------
function updateHud() {
  const eaten = game.fruits_eaten;
  const total = game.fruits_total;
  const speedMult = game.speed / game.base_speed;
  const hud = `${game.level}|${eaten}|${total}|${game.length}|${speedMult.toFixed(2)}|${bestLevel}`;
  if (hud === lastHud) return;
  lastHud = hud;
  $("hud-level").textContent = game.level;
  $("hud-eaten").textContent = eaten;
  $("hud-total").textContent = total;
  $("hud-bar").style.width = `${(100 * eaten) / total}%`;
  $("hud-length").textContent = game.length;
  $("hud-speed").textContent = `${speedMult.toFixed(2)}×`;
  $("hud-best").textContent = bestLevel;
}

function updateOverlay() {
  const s = game.state;
  const key = `${s}|${game.level}`;
  if (key === lastOverlay) return;
  lastOverlay = key;

  const set = (title, text, cls = "") => {
    $("overlay-title").textContent = title;
    $("overlay-text").innerHTML = text;
    overlay.className = `overlay ${cls}`;
    overlay.hidden = false;
  };
  switch (s) {
    case State.Playing:
      overlay.hidden = true;
      break;
    case State.Ready:
      set(`Level ${game.level}`,
        `Collect <b>${game.fruits_total}</b> fruits.<br>Press an arrow key, <kbd>Space</kbd> or tap to start.`);
      break;
    case State.Paused:
      set("Paused", "Press <kbd>Space</kbd> or tap to resume.");
      break;
    case State.LevelComplete:
      set(`Level ${game.level} cleared!`,
        `Next: level ${game.level + 1} with ${game.fruits_total + 1} fruits.<br>Press <kbd>Space</kbd> or tap to continue.`, "win");
      break;
    case State.GameOver:
      set("Game over",
        `You reached level ${game.level}. Back to level 1.<br>Press <kbd>Space</kbd> or tap to try again.`, "over");
      break;
  }
}

// ---------- main loop ----------
function frame(now) {
  const dt = lastTime ? now - lastTime : 0;
  lastTime = now;

  game.update(dt);

  const ev = game.take_events();
  if (ev & Event.Eat) sounds.eat();
  if (ev & Event.LevelComplete) {
    sounds.level();
    if (game.level + 1 > bestLevel) {
      bestLevel = game.level + 1;
      storage.set(BEST_KEY, String(bestLevel));
    }
  }
  if (ev & Event.GameOver) sounds.over();

  game.render(ctx, now);
  updateHud();
  updateOverlay();
  requestAnimationFrame(frame);
}

async function main() {
  try {
    await init();
  } catch (err) {
    console.error(err);
    $("overlay-title").textContent = "Could not load WebAssembly";
    $("overlay-text").innerHTML =
      "Build with <code>wasm-pack build --target web --out-dir www/pkg</code> " +
      "and serve the <code>www</code> folder over HTTP (e.g. <code>python serve.py</code>). " +
      "Opening the file directly (file://) does not work.";
    overlay.className = "overlay over";
    return;
  }
  renderMute();
  newGame();
  // Handle for testing from the devtools console, e.g. `wasmWorm.game.fruit_cells()`.
  window.wasmWorm = { get game() { return game; }, State, Dir };
  requestAnimationFrame(frame);
}

main();
