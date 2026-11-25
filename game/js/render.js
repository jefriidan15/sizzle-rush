// Sizzle Rush — render.js
// One job: draw everything on the canvas — the kitchen, the food, the chef,
// the order board and the screens. It never changes game state.

import { VIEW_W, VIEW_H, HUD_H, STATIONS, INGREDIENTS, recipeById } from './data.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- Food ------------------------------------------------------------------

export function drawIngredient(ctx, kind, prep, x, y, r) {
  const ing = INGREDIENTS[kind];
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  const burnt = prep === 'burnt';
  if (burnt) {
    ctx.fillStyle = '#1c1410';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2c22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.3);
    ctx.lineTo(r * 0.4, r * 0.4);
    ctx.moveTo(r * 0.5, -r * 0.4);
    ctx.lineTo(-r * 0.3, r * 0.5);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === 'tomato') {
    if (prep === 'chopped') {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(-r * 0.35, 0, r * 0.55, 0, Math.PI * 2);
      ctx.arc(r * 0.4, r * 0.1, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8a7a';
      ctx.beginPath();
      ctx.arc(-r * 0.35, 0, r * 0.22, 0, Math.PI * 2);
      ctx.arc(r * 0.4, r * 0.1, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff7a6a';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.3, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2f7d3d';
      ctx.beginPath();
      ctx.arc(0, -r * 0.85, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = ing.color;
    if (prep === 'chopped') {
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i - 1) * 0.5);
        rr(ctx, -r * 0.9, -r * 0.28 + i * r * 0.3, r * 1.8, r * 0.5, r * 0.25);
        ctx.fill();
        ctx.restore();
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.1, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, 0);
      ctx.quadraticCurveTo(0, -r * 0.5, r * 0.7, 0);
      ctx.moveTo(-r * 0.7, r * 0.3);
      ctx.quadraticCurveTo(0, -r * 0.2, r * 0.7, r * 0.3);
      ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.save();
    ctx.rotate(-0.12);
    ctx.fillRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.2, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.35, r * 0.3, r * 0.13, 0, Math.PI * 2);
    ctx.arc(r * 0.2, -r * 0.45, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (kind === 'patty') {
    ctx.fillStyle = prep === 'cooked' ? '#5d3413' : ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2e1a08';
    ctx.lineWidth = Math.max(2, r * 0.14);
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.5);
    ctx.lineTo(-r * 0.1, r * 0.55);
    ctx.moveTo(r * 0.1, -r * 0.6);
    ctx.lineTo(r * 0.6, r * 0.45);
    ctx.stroke();
    if (prep === 'cooked') {
      ctx.fillStyle = 'rgba(255,190,90,0.5)';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e09a3a';
    ctx.fillRect(-r, r * 0.1, r * 2, r * 0.35);
    ctx.fillStyle = '#fff3cf';
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.45, r * 0.09, 0, Math.PI * 2);
    ctx.arc(r * 0.1, -r * 0.6, r * 0.09, 0, Math.PI * 2);
    ctx.arc(r * 0.5, -r * 0.3, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'onion') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = Math.max(2, r * 0.18);
    if (prep === 'chopped') {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, (i - 1) * r * 0.45, r * (0.55 - i * 0.08), 0.3, Math.PI * 2 - 0.3);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, r, items) {
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c2ae';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (items) {
    const n = items.length;
    items.forEach((it, i) => {
      drawIngredient(ctx, it.kind, it.prep, x + (i - (n - 1) / 2) * r * 0.9, y - 6 - i * 2, Math.min(15, r * 0.42));
    });
  }
}

// --- Kitchen ---------------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = '#c98f5f';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  ctx.fillStyle = '#bd8252';
  const s = 64;
  for (let y = HUD_H; y < VIEW_H; y += s) {
    for (let x = ((y / s) % 2 === 0 ? 0 : s / 2); x < VIEW_W; x += s) {
      ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
    }
  }
  // Warm rug in the middle of the floor.
  ctx.fillStyle = '#a34d3a';
  rr(ctx, 380, 300, 520, 190, 18);
  ctx.fill();
  ctx.strokeStyle = '#e8b04b';
  ctx.lineWidth = 4;
  rr(ctx, 392, 312, 496, 166, 12);
  ctx.stroke();
}

function drawTopCounters(ctx, state) {
  // Wooden counter band.
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(40, 150, 1096, 64);
  ctx.fillStyle = '#a06a35';
  ctx.fillRect(40, 150, 1096, 10);
  ctx.strokeStyle = '#6b421e';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 150, 1096, 64);

  // Ingredient crates with a sample of each ingredient.
  for (const c of STATIONS.crates) {
    ctx.fillStyle = '#7c4f24';
    rr(ctx, c.x, c.y, c.w, c.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#5d3a17';
    ctx.stroke();
    drawIngredient(ctx, c.kind, 'raw', c.x + c.w / 2, c.y + 24, 15);
    text(ctx, c.label, c.x + c.w / 2, c.y + 52, 12, '#ffe9c4', 'center');
  }

  // Chopping board.
  const b = STATIONS.board;
  ctx.fillStyle = '#e8d3a7';
  rr(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#b89a62';
  ctx.stroke();
  text(ctx, 'CHOP', b.x + b.w / 2, b.y + 12, 11, '#7a5a28', 'center');
  if (state.board.item) {
    drawIngredient(ctx, state.board.item.kind, state.board.item.prep, b.x + b.w / 2, b.y + 36, 16);
    if (state.board.progress > 0 && state.board.progress < 1) {
      ctx.fillStyle = '#3a2c18';
      ctx.fillRect(b.x + 18, b.y + 52, b.w - 36, 7);
      ctx.fillStyle = '#ffb02e';
      ctx.fillRect(b.x + 18, b.y + 52, (b.w - 36) * state.board.progress, 7);
    }
  } else {
    ctx.fillStyle = '#9c7c4a';
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + 36, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grill with two slots.
  const g = STATIONS.grill;
  ctx.fillStyle = '#3d3d3d';
  rr(ctx, g.x, g.y, g.w, g.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#1e1e1e';
  ctx.stroke();
  text(ctx, 'GRILL', g.x + g.w / 2, g.y + 12, 11, '#ffb02e', 'center');
  state.grill.forEach((slot, i) => {
    const sx = g.x + 62 + i * 126;
    const sy = g.y + 38;
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(sx, sy, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(sx - 18 + k * 18, sy - 14);
      ctx.lineTo(sx - 18 + k * 18, sy + 14);
      ctx.stroke();
    }
    if (slot.item) {
      drawIngredient(ctx, 'patty', slot.state, sx, sy, 17);
      const total = slot.state === 'burnt' ? 1 : slot.t / 6;
      ctx.fillStyle = slot.state === 'burnt' ? '#000' : slot.state === 'ready' ? '#ffb02e' : '#e8e8e8';
      ctx.fillRect(sx - 20, sy + 26, 40, 5);
      ctx.fillStyle = slot.state === 'burnt' ? '#ff3b30' : slot.state === 'ready' ? '#37c24a' : '#ff8c1a';
      ctx.fillRect(sx - 20, sy + 26, 40 * Math.min(1, total), 5);
      if (slot.state === 'ready') text(ctx, 'READY!', sx, sy - 30, 11, '#37c24a', 'center');
      if (slot.state === 'burnt') text(ctx, 'BURNT!', sx, sy - 30, 11, '#ff3b30', 'center');
    }
  });
}

function drawLowCounters(ctx, state) {
  // Plating counter.
  const p = STATIONS.plating;
  ctx.fillStyle = '#8a5a2b';
  rr(ctx, p.x, p.y, p.w, p.h, 10);
  ctx.fill();
  ctx.fillStyle = '#a06a35';
  rr(ctx, p.x, p.y, p.w, 12, 6);
  ctx.fill();
  text(ctx, 'PLATING', p.x + p.w / 2, p.y + 12, 11, '#ffe9c4', 'center');
  state.plates.forEach((plate, i) => {
    const px = p.x + 85 + i * 170;
    const py = p.y + 46;
    if (plate) {
      drawPlate(ctx, px, py, 34, plate.items);
      const recipe = recipeById(plate.recipeId);
      const done = plate.items.length;
      text(ctx, `${done}/${recipe.steps.length} ${recipe.name}`, px, py + 22, 10, '#ffe9c4', 'center');
      if (done === recipe.steps.length) text(ctx, 'READY TO SERVE', px, py - 34, 11, '#7dff8a', 'center');
    } else {
      ctx.strokeStyle = 'rgba(255,233,196,0.5)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(px, py, 34, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // Bin.
  const bin = STATIONS.bin;
  ctx.fillStyle = '#5b5b5b';
  rr(ctx, bin.x, bin.y, bin.w, bin.h, 10);
  ctx.fill();
  ctx.fillStyle = '#3d3d3d';
  rr(ctx, bin.x + 8, bin.y + 8, bin.w - 16, bin.h - 16, 6);
  ctx.fill();
  text(ctx, 'BIN', bin.x + bin.w / 2, bin.y + bin.h / 2 + 2, 13, '#ddd', 'center');

  // Serving window on the right wall.
  const w = STATIONS.window;
  ctx.fillStyle = '#8a5a2b';
  rr(ctx, w.x, w.y, w.w, w.h, 10);
  ctx.fill();
  ctx.fillStyle = '#2e2118';
  rr(ctx, w.x + 8, w.y + 8, w.w - 16, 60, 6);
  ctx.fill();
  text(ctx, 'SERVE', w.x + w.w / 2, w.y + 38, 15, '#ffe9c4', 'center');
  text(ctx, 'WINDOW', w.x + w.w / 2, w.y + 58, 11, '#ffb02e', 'center');
  ctx.fillStyle = '#e8b04b';
  ctx.beginPath();
  ctx.moveTo(w.x + 30, w.y + 84);
  ctx.lineTo(w.x + 70, w.y + 84);
  ctx.lineTo(w.x + 50, w.y + 112);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'Drop plates', w.x + w.w / 2, w.y + 128, 11, '#ffe9c4', 'center');
  text(ctx, 'here!', w.x + w.w / 2, w.y + 142, 11, '#ffe9c4', 'center');
}

// --- Chef ------------------------------------------------------------------

function drawChef(ctx, chef) {
  const { x, y } = chef;
  ctx.save();
  ctx.translate(x, y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 24, 26, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body / apron.
  ctx.fillStyle = '#f2f2f2';
  rr(ctx, -17, -6, 34, 34, 10);
  ctx.fill();
  ctx.fillStyle = '#2f7d3d';
  ctx.fillRect(-17, 12, 34, 8);
  // Head.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -16, 14, 0, Math.PI * 2);
  ctx.fill();
  // Toque.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -28, 9, 0, Math.PI * 2);
  ctx.arc(0, -32, 10, 0, Math.PI * 2);
  ctx.arc(8, -28, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -30, 26, 7);
  // Eyes look in the facing direction.
  ctx.fillStyle = '#222';
  const dx = chef.dir === 'left' ? -4 : chef.dir === 'right' ? 4 : 0;
  ctx.beginPath();
  ctx.arc(-5 + dx, -16, 2, 0, Math.PI * 2);
  ctx.arc(5 + dx, -16, 2, 0, Math.PI * 2);
  ctx.fill();
  // Carried item floats above the head.
  if (chef.carry) {
    if (chef.carry.type === 'item') {
      drawIngredient(ctx, chef.carry.kind, chef.carry.prep, 0, -52, 14);
    } else {
      drawPlate(ctx, 0, -50, 22, chef.carry.plate.items);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -52, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// --- HUD / order board -----------------------------------------------------

function drawTicket(ctx, order, x, y, w, h, selected) {
  const recipe = recipeById(order.recipeId);
  const frac = Math.max(0, order.timeLeft / order.patience);
  ctx.fillStyle = selected ? '#fff6dd' : '#fdf3d8';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = selected ? '#e8b04b' : '#c9a86a';
  ctx.lineWidth = selected ? 3 : 2;
  ctx.stroke();
  text(ctx, recipe.name, x + 10, y + 16, 14, '#4a2c10');
  // Recipe icons in order; narrow tickets pack them tighter so the
  // RUSH! flag never sits on top of the last icon.
  const iconStep = w < 200 ? 24 : 30;
  const iconR = w < 200 ? 9 : 11;
  const iconX0 = w < 200 ? 18 : 22;
  recipe.steps.forEach((s, i) => {
    drawIngredient(ctx, s.kind, s.prep, x + iconX0 + i * iconStep, y + 40, iconR);
  });
  // Countdown bar + seconds.
  ctx.fillStyle = '#e5d3ae';
  ctx.fillRect(x + 10, y + h - 18, w - 20, 9);
  ctx.fillStyle = frac > 0.5 ? '#37c24a' : frac > 0.25 ? '#ffb02e' : '#ff3b30';
  ctx.fillRect(x + 10, y + h - 18, (w - 20) * frac, 9);
  text(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 10, y + 16, 14, frac > 0.25 ? '#4a2c10' : '#ff3b30', 'right');
  if (order.timeLeft <= 10) text(ctx, 'RUSH!', x + w - 10, y + 40, 12, '#ff3b30', 'right');
}

export function drawHUD(ctx, state) {
  // Board background.
  ctx.fillStyle = '#5d3a17';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(0, 0, VIEW_W, 8);
  text(ctx, 'ORDER BOARD', 16, 22, 15, '#ffd98a');
  // Four tickets have to share the board with the shift clock, so they
  // shrink; with three or fewer they get the full width.
  const ticketW = state.orders.length >= 4 ? 190 : 218;
  const gap = state.orders.length >= 4 ? 8 : 10;
  state.orders.forEach((o, i) => {
    drawTicket(ctx, o, 16 + i * (ticketW + gap), 30, ticketW, 66, o.id === state.selectedOrderId);
  });
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — take a breath, chef!', 16, 62, 14, '#ffe9c4');
  }
  // Shift timer, score, combo on the right.
  const rx = VIEW_W - 16;
  const mins = Math.floor(Math.max(0, state.timeLeft) / 60);
  const secs = Math.floor(Math.max(0, state.timeLeft) % 60);
  const timerColor = state.timeLeft <= 30 ? '#ff6b5e' : '#ffffff';
  text(ctx, `SHIFT ${mins}:${String(secs).padStart(2, '0')}`, rx, 22, 24, timerColor, 'right');
  text(ctx, `SCORE ${state.score}`, rx, 52, 18, '#ffd98a', 'right');
  const comboLabel = state.combo > 1 ? `COMBO x${(1 + (state.combo - 1) * 0.25).toFixed(2)}  (${state.combo} in a row)` : 'COMBO —';
  text(ctx, comboLabel, rx, 78, 14, state.combo > 1 ? '#7dff8a' : '#d8c49a', 'right');
  text(ctx, `TARGET ${state.target}  •  SERVED ${state.served}`, rx - 260, 78, 13, '#d8c49a', 'right');
}

// --- Particles, floats, toast ----------------------------------------------

function drawEffects(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    text(ctx, f.text, f.x, f.y, f.size, f.color, 'center');
  }
  ctx.globalAlpha = 1;
  if (state.toast) {
    ctx.fillStyle = 'rgba(30,18,8,0.85)';
    const w = ctx.measureText(state.toast).width + 200;
    rr(ctx, (VIEW_W - 320) / 2, HUD_H + 14, 320, 34, 17);
    ctx.fill();
    text(ctx, state.toast, VIEW_W / 2, HUD_H + 32, 15, '#ffe9c4', 'center');
  }
}

// --- Screens ----------------------------------------------------------------

export function drawTitle(ctx, state) {
  ctx.fillStyle = '#3a2412';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Decorative kitchen silhouette.
  ctx.fillStyle = '#5d3a17';
  ctx.fillRect(0, 520, VIEW_W, 200);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(0, 520, VIEW_W, 14);
  drawIngredient(ctx, 'tomato', 'raw', 200, 600, 40);
  drawIngredient(ctx, 'patty', 'cooked', 420, 610, 42);
  drawIngredient(ctx, 'bun', 'raw', 640, 600, 42);
  drawIngredient(ctx, 'lettuce', 'chopped', 880, 605, 40);
  drawIngredient(ctx, 'cheese', 'raw', 1080, 600, 38);
  text(ctx, 'SIZZLE RUSH', VIEW_W / 2, 150, 84, '#ffb02e', 'center');
  text(ctx, 'a lunch-rush kitchen game', VIEW_W / 2, 215, 26, '#ffe9c4', 'center');
  text(ctx, 'Take orders, chop, grill, plate and serve before the tickets run out.', VIEW_W / 2, 290, 18, '#d8c49a', 'center');
  text(ctx, 'Move  WASD / Arrows  •  Click a station to walk there  •  E  interact  •  SPACE  chop', VIEW_W / 2, 330, 17, '#ffffff', 'center');
  text(ctx, 'P  pause    M  mute    R  restart', VIEW_W / 2, 360, 17, '#ffffff', 'center');
  ctx.fillStyle = '#e8b04b';
  rr(ctx, VIEW_W / 2 - 170, 400, 340, 56, 28);
  ctx.fill();
  text(ctx, '▶  START YOUR SHIFT  (Enter)', VIEW_W / 2, 429, 20, '#3a2412', 'center');
  text(ctx, 'Shift: 3:00  •  Target score: 600  •  5 recipes, 2 plates, 1 very hot grill', VIEW_W / 2, 485, 15, '#d8c49a', 'center');
  text(ctx, `Best score: ${state.bestScore}`, VIEW_W / 2, 665, 15, '#ffd98a', 'center');
}

export function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(20,10,4,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const won = state.score >= state.target;
  text(ctx, won ? 'SHIFT COMPLETE!' : "SHIFT'S OVER", VIEW_W / 2, 170, 64, won ? '#7dff8a' : '#ffb02e', 'center');
  text(ctx, won ? `You beat the ${state.target} target — the bistro loves you.` : `Target was ${state.target} — so close. The rush will wait for no chef.`, VIEW_W / 2, 230, 18, '#ffe9c4', 'center');
  text(ctx, `SCORE  ${state.score}`, VIEW_W / 2, 310, 30, '#ffffff', 'center');
  text(ctx, `Dishes served: ${state.served}    Best combo: ${state.bestCombo}    Orders lost: ${state.lost}`, VIEW_W / 2, 360, 18, '#d8c49a', 'center');
  text(ctx, `Best score: ${state.bestScore}`, VIEW_W / 2, 400, 16, '#ffd98a', 'center');
  ctx.fillStyle = '#e8b04b';
  rr(ctx, VIEW_W / 2 - 150, 440, 300, 52, 26);
  ctx.fill();
  text(ctx, 'Press R to cook again', VIEW_W / 2, 467, 19, '#3a2412', 'center');
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20,10,4,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'PAUSED', VIEW_W / 2, 330, 56, '#ffffff', 'center');
  text(ctx, 'Press P to keep cooking', VIEW_W / 2, 390, 18, '#ffe9c4', 'center');
}

// --- Main frame --------------------------------------------------------------

export function drawFrame(ctx, state) {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  if (state.mode === 'title') {
    drawTitle(ctx, state);
    ctx.restore();
    return;
  }
  drawFloor(ctx);
  drawTopCounters(ctx, state);
  drawLowCounters(ctx, state);
  drawChef(ctx, state.chef);
  drawEffects(ctx, state);
  drawHUD(ctx, state);
  if (state.mode === 'gameover') drawGameOver(ctx, state);
  if (state.mode === 'paused') drawPaused(ctx);
  ctx.restore();
}
