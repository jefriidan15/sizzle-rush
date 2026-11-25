// Sizzle Rush — main.js
// One job: boot the game — canvas setup, the frame loop, keyboard and
// mouse input, and the ?shot= staging used for screenshots.

import { VIEW_W, VIEW_H } from './data.js';
import { createAudio } from './audio.js';
import { createGame } from './game.js';
import { drawFrame } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const audio = createAudio();
const game = createGame(audio);

// Screenshot staging: ?shot=cover|rush|serve|title renders a frozen,
// deterministic scene from the game's own code.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) game.stageShot(shot);

// Test hook for the playtest driver: read state, advance time.
window.__sizzle = { game, audio };

// --- frame loop --------------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  drawFrame(ctx, game.state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- keyboard ------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
  if (!e.repeat) game.pressKey(e.code, true);
});
window.addEventListener('keyup', (e) => {
  game.pressKey(e.code, false);
});

// --- mouse / touch ---------------------------------------------------------------
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((e.clientY - rect.top) / rect.height) * VIEW_H,
  };
}
canvas.addEventListener('click', (e) => {
  const p = canvasPoint(e);
  game.clickAt(p.x, p.y);
});
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.touches[0];
  const p = canvasPoint(t);
  game.clickAt(p.x, p.y);
}, { passive: false });

// Keep audio unlocked after any first gesture.
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
