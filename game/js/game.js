// Sizzle Rush — game.js
// One job: the game's state and rules — orders, stations, movement,
// chopping, grilling, plating, serving and scoring. It asks render.js to
// draw and audio.js to make noise, but owns every rule itself.

import {
  VIEW_W, VIEW_H, HUD_H, SHIFT_SECONDS, WIN_TARGET_SCORE, INGREDIENTS,
  RECIPES, recipeById, TIMING, SCORING, STATIONS, SOLIDS, WALK,
} from './data.js';

const CHEF_R = 20;

function freshState(bestScore) {
  return {
    mode: 'title',
    demo: false,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    lost: 0,
    target: WIN_TARGET_SCORE,
    bestScore,
    orders: [],
    nextOrderId: 1,
    spawnIn: 6,
    chef: { x: 640, y: 430, dir: 'down', moving: false, carry: null, walkTarget: null, walkStation: null },
    board: { item: null, progress: 0, chopping: false, chopTick: 0 },
    grill: [
      { item: null, t: 0, state: 'empty' },
      { item: null, t: 0, state: 'empty' },
    ],
    plates: [null, null],
    particles: [],
    floats: [],
    shake: 0,
    toast: null,
    toastT: 0,
    selectedOrderId: null,
  };
}

export function createGame(audio) {
  let bestScore = 0;
  try {
    bestScore = Number(window.localStorage.getItem('sizzle-rush-best') || 0) || 0;
  } catch (e) { /* storage unavailable (hosted page) — keep it in memory */ }
  let state = freshState(bestScore);

  // --- small helpers -------------------------------------------------------
  function saveBest() {
    try {
      window.localStorage.setItem('sizzle-rush-best', String(state.bestScore));
    } catch (e) { /* ignore */ }
  }
  function toast(msg, seconds = 2) {
    state.toast = msg;
    state.toastT = seconds;
  }
  function addFloat(x, y, text, color, size = 20) {
    state.floats.push({ x, y, text, color, size, life: 1.2, maxLife: 1.2 });
  }
  function burst(x, y, color, n, speed = 90) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      state.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40,
        size: 2 + Math.random() * 3, color, life: 0.5 + Math.random() * 0.4, maxLife: 0.9,
      });
    }
  }
  function centerOf(rect) {
    return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
  }

  // --- orders ---------------------------------------------------------------
  function spawnOrder(recipeId = null) {
    const elapsed = state.elapsed;
    let pool = RECIPES;
    if (elapsed < 30) pool = RECIPES.slice(0, 3);
    else if (elapsed < 75) pool = RECIPES.slice(0, 4);
    const recipe = recipeId
      ? recipeById(recipeId)
      : pool[Math.floor(Math.random() * pool.length)];
    const patience = Math.max(
      TIMING.orderPatienceMin,
      TIMING.orderPatienceStart - Math.floor(elapsed / 30) * 6,
    );
    const order = {
      id: state.nextOrderId++,
      recipeId: recipe.id,
      timeLeft: patience,
      patience,
    };
    state.orders.push(order);
    if (state.selectedOrderId === null) state.selectedOrderId = order.id;
    audio.ticket();
    return order;
  }

  function expireOrder(order) {
    state.orders = state.orders.filter((o) => o.id !== order.id);
    state.lost += 1;
    state.combo = 0;
    state.score = Math.max(0, state.score + SCORING.expiredOrder);
    state.shake = 12;
    audio.expire();
    addFloat(640, 200, `${recipeById(order.recipeId).name} walked out! -25`, '#ff6b5e', 22);
    for (const plate of state.plates) {
      if (plate && plate.orderId === order.id) plate.orphaned = true;
    }
    if (state.selectedOrderId === order.id) {
      state.selectedOrderId = state.orders.length ? state.orders[0].id : null;
    }
    toast('Order expired — a customer left hungry!');
  }

  // --- stations ---------------------------------------------------------------
  function stationNear() {
    const c = state.chef;
    const d = (p) => Math.hypot(c.x - p.x, c.y - p.y);
    for (const crate of STATIONS.crates) {
      const p = { x: crate.x + crate.w / 2, y: 232 };
      if (d(p) < 86) return { type: 'crate', kind: crate.kind, point: p };
    }
    const bp = { x: STATIONS.board.x + STATIONS.board.w / 2, y: 232 };
    if (d(bp) < 96) return { type: 'board', point: bp };
    const gp = { x: STATIONS.grill.x + STATIONS.grill.w / 2, y: 232 };
    if (d(gp) < 130) return { type: 'grill', point: gp };
    const pp = { x: STATIONS.plating.x + STATIONS.plating.w / 2, y: 540 };
    if (d(pp) < 190) return { type: 'plating', point: pp };
    const wp = { x: 1112, y: STATIONS.window.y + STATIONS.window.h / 2 };
    if (d(wp) < 92) return { type: 'window', point: wp };
    const binp = { x: STATIONS.bin.x + STATIONS.bin.w / 2, y: 540 };
    if (d(binp) < 90) return { type: 'bin', point: binp };
    return null;
  }

  function interact() {
    if (state.mode !== 'playing') return;
    const st = stationNear();
    if (!st) return;
    const chef = state.chef;

    if (st.type === 'crate') {
      if (chef.carry) { audio.buzz(); toast('Hands full!'); return; }
      chef.carry = { type: 'item', kind: st.kind, prep: 'raw' };
      audio.pickup();
      return;
    }

    if (st.type === 'board') {
      // The board is also the kitchen's one set-down shelf: any single
      // carried item can rest here, and a raw choppable one can be
      // chopped with Space while it sits here.
      if (!state.board.item && chef.carry && chef.carry.type === 'item') {
        state.board.item = { kind: chef.carry.kind, prep: chef.carry.prep };
        state.board.progress = 0;
        chef.carry = null;
        audio.place();
        if (INGREDIENTS[state.board.item.kind].chop && state.board.item.prep === 'raw') {
          toast('Hold SPACE to chop');
        }
        return;
      }
      if (state.board.item && !chef.carry) {
        chef.carry = { type: 'item', kind: state.board.item.kind, prep: state.board.item.prep };
        state.board.item = null;
        state.board.progress = 0;
        audio.pickup();
        return;
      }
      audio.buzz();
      return;
    }

    if (st.type === 'grill') {
      if (chef.carry && chef.carry.type === 'item' && chef.carry.kind === 'patty' && chef.carry.prep === 'raw') {
        const slot = state.grill.find((s) => !s.item);
        if (!slot) { audio.buzz(); toast('Grill is full!'); return; }
        slot.item = { kind: 'patty', prep: 'raw' };
        slot.t = 0;
        slot.state = 'cooking';
        chef.carry = null;
        audio.place();
        return;
      }
      if (!chef.carry) {
        const slot = state.grill.find((s) => s.item && s.state === 'ready')
          || state.grill.find((s) => s.item && s.state === 'burnt')
          || state.grill.find((s) => s.item);
        if (!slot) { audio.buzz(); return; }
        chef.carry = { type: 'item', kind: 'patty', prep: slot.state === 'ready' ? 'cooked' : slot.state === 'burnt' ? 'burnt' : 'raw' };
        slot.item = null;
        slot.t = 0;
        slot.state = 'empty';
        audio.pickup();
        return;
      }
      audio.buzz();
      return;
    }

    if (st.type === 'plating') {
      if (chef.carry && chef.carry.type === 'item') {
        const item = chef.carry;
        const stepMatches = (plate, allowOrphaned = false) => {
          if (!plate || (plate.orphaned && !allowOrphaned)) return false;
          // A plate carries its recipe id with it: its order may be gone
          // by the time it is served, so the order id alone cannot name it.
          const recipe = recipeById(plate.recipeId);
          const next = recipe.steps[plate.items.length];
          return !!next && next.kind === item.kind && next.prep === item.prep;
        };
        // A plate already going for the selected order, whose next step
        // this ingredient is — then any plate it fits — then a fresh
        // plate for an open order whose recipe starts with it. Nothing
        // is created for an ingredient no open order needs next.
        // (An orphaned plate — its customer left — still takes
        // ingredients, so it can be finished and served for the penalty.)
        let plate = state.plates.find((p) => p && p.orderId === state.selectedOrderId && stepMatches(p));
        if (!plate) plate = state.plates.find((p) => stepMatches(p));
        if (!plate) plate = state.plates.find((p) => stepMatches(p, true));
        if (!plate) {
          const emptyIdx = state.plates.findIndex((p) => p === null);
          if (emptyIdx === -1) { audio.buzz(); toast('Both plates are in use!'); return; }
          const firstMatches = (order) => {
            const first = recipeById(order.recipeId).steps[0];
            return first && first.kind === item.kind && first.prep === item.prep;
          };
          const order = state.orders.find((o) => o.id === state.selectedOrderId && firstMatches(o))
            || state.orders.find((o) => firstMatches(o) && !state.plates.some((p) => p && p.orderId === o.id));
          if (!order) {
            audio.buzz();
            toast(`No open order needs ${INGREDIENTS[item.kind].name} next`);
            return;
          }
          plate = { orderId: order.id, recipeId: order.recipeId, items: [], orphaned: false };
          state.plates[emptyIdx] = plate;
        }
        // The plate's own recipe id names the dish from here on.
        const recipe = recipeById(plate.recipeId);
        plate.items.push({ kind: item.kind, prep: item.prep });
        chef.carry = null;
        audio.place();
        burst(state.chef.x, state.chef.y - 30, '#ffd98a', 8, 60);
        if (plate.items.length === recipe.steps.length) {
          audio.ding();
          toast(`${recipe.name} ready — serve it!`);
        }
        return;
      }
      if (chef.carry && chef.carry.type === 'plate') {
        const emptyIdx = state.plates.findIndex((p) => p === null);
        if (emptyIdx === -1) { audio.buzz(); toast('No free plate spot!'); return; }
        state.plates[emptyIdx] = chef.carry.plate;
        chef.carry = null;
        audio.place();
        return;
      }
      if (!chef.carry) {
        const idx = state.plates.findIndex((p) => {
          if (!p) return false;
          const recipe = recipeById(p.recipeId);
          return p.items.length === recipe.steps.length;
        });
        // Prefer a finished plate, then the fullest one, then any plate
        // at all (even an empty one, so it can be binned).
        let pick = idx;
        if (pick === -1) {
          let most = 0;
          state.plates.forEach((p, i) => {
            if (p && p.items.length > most) { most = p.items.length; pick = i; }
          });
        }
        if (pick === -1) pick = state.plates.findIndex((p) => p !== null);
        if (pick === -1) { audio.buzz(); return; }
        chef.carry = { type: 'plate', plate: state.plates[pick] };
        state.plates[pick] = null;
        audio.pickup();
        return;
      }
      return;
    }

    if (st.type === 'window') {
      if (chef.carry && chef.carry.type === 'plate') {
        const plate = chef.carry.plate;
        const recipe = recipeById(plate.recipeId);
        const order = state.orders.find((o) => o.id === plate.orderId);
        if (plate.items.length < recipe.steps.length) {
          audio.buzz();
          toast('Plate is not finished yet!');
          return;
        }
        if (order && !plate.orphaned) {
          const tip = Math.round(SCORING.tipMax * (order.timeLeft / order.patience));
          const mult = Math.min(SCORING.comboCap, 1 + SCORING.comboStep * state.combo);
          const points = Math.round((recipe.price + tip) * mult);
          state.score += points;
          state.combo += 1;
          state.bestCombo = Math.max(state.bestCombo, state.combo);
          state.served += 1;
          state.orders = state.orders.filter((o) => o.id !== order.id);
          if (state.selectedOrderId === order.id) {
            state.selectedOrderId = state.orders.length ? state.orders[0].id : null;
          }
          chef.carry = null;
          audio.serve();
          addFloat(1090, 400, `+${points}`, '#7dff8a', 26);
          burst(1090, 420, '#7dff8a', 14, 120);
          toast(`${recipe.name} served! +${points}`);
          return;
        }
        // Wrong dish: a finished plate for an order that is gone, or an
        // orphaned plate served anyway.
        state.score = Math.max(0, state.score + SCORING.wrongDish);
        state.combo = 0;
        chef.carry = null;
        audio.buzz();
        addFloat(1090, 400, '-20  wrong dish!', '#ff6b5e', 22);
        toast('Wrong dish — the customer sent it back!');
        return;
      }
      if (chef.carry && chef.carry.type === 'plate') return; // unreachable guard
      if (chef.carry) { audio.buzz(); toast('The window only takes finished plates!'); return; }
      audio.buzz();
      return;
    }

    if (st.type === 'bin') {
      if (!chef.carry) return;
      chef.carry = null;
      audio.place();
      toast('Binned it.');
      return;
    }
  }

  // --- movement ---------------------------------------------------------------
  function circleHitsSolid(x, y) {
    for (const s of SOLIDS) {
      const cx = Math.max(s.x, Math.min(x, s.x + s.w));
      const cy = Math.max(s.y, Math.min(y, s.y + s.h));
      if (Math.hypot(x - cx, y - cy) < CHEF_R) return true;
    }
    return false;
  }

  function moveChef(dx, dy) {
    const c = state.chef;
    const nx = Math.max(WALK.x0, Math.min(WALK.x1, c.x + dx));
    if (!circleHitsSolid(nx, c.y)) c.x = nx;
    const ny = Math.max(WALK.y0, Math.min(WALK.y1, c.y + dy));
    if (!circleHitsSolid(c.x, ny)) c.y = ny;
  }

  // --- update -----------------------------------------------------------------
  let sizzleOn = false;
  function update(dt) {
    // A staged demo scene is fully frozen: its particles, floating texts
    // and toast stay exactly where stageShot put them for the screenshot.
    if (state.demo) return;
    // Floats and particles always animate; the rest freezes outside play.
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 30 * dt;
      p.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    for (const f of state.floats) {
      f.y -= 34 * dt;
      f.life -= dt;
    }
    state.floats = state.floats.filter((f) => f.life > 0);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
    if (state.toastT > 0) {
      state.toastT -= dt;
      if (state.toastT <= 0) state.toast = null;
    }
    if (state.mode !== 'playing' || state.demo) return;

    state.elapsed += dt;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      endShift();
      return;
    }

    // Orders tick down and expire.
    for (const o of [...state.orders]) {
      o.timeLeft -= dt;
      if (o.timeLeft <= 0) expireOrder(o);
    }
    // New orders arrive on a quickening schedule.
    state.spawnIn -= dt;
    if (state.spawnIn <= 0 && state.orders.length < TIMING.maxActiveOrders) {
      spawnOrder();
      state.spawnIn = Math.max(
        TIMING.spawnIntervalMin,
        TIMING.spawnIntervalStart - Math.floor(state.elapsed / 45) * 2,
      );
    }

    // Grill: cook, then a short ready window, then burnt.
    let anyCooking = false;
    for (const slot of state.grill) {
      if (!slot.item) continue;
      slot.t += dt;
      if (slot.state === 'cooking') {
        anyCooking = true;
        if (slot.t >= TIMING.grillCookSeconds) {
          slot.state = 'ready';
          slot.t = 0;
          audio.ding();
          toast('Patty ready — grab it before it burns!');
        }
      } else if (slot.state === 'ready') {
        if (slot.t >= TIMING.grillReadySeconds) {
          slot.state = 'burnt';
          slot.t = 0;
          audio.buzz();
          toast('A patty burnt on the grill!');
        }
      }
    }
    if (anyCooking) audio.startSizzle();
    else if (sizzleOn) audio.stopSizzle();
    sizzleOn = anyCooking;

    // Grill sizzle + smoke particles.
    for (const slot of state.grill) {
      if (!slot.item) continue;
      const i = state.grill.indexOf(slot);
      const sx = STATIONS.grill.x + 62 + i * 126;
      if (slot.state === 'cooking' && Math.random() < dt * 14) {
        state.particles.push({
          x: sx + (Math.random() - 0.5) * 30, y: STATIONS.grill.y + 22,
          vx: (Math.random() - 0.5) * 12, vy: -46 - Math.random() * 20,
          size: 2 + Math.random() * 2, color: '#ffcf5e', life: 0.4, maxLife: 0.4,
        });
      }
      if (slot.state === 'burnt' && Math.random() < dt * 8) {
        state.particles.push({
          x: sx + (Math.random() - 0.5) * 20, y: STATIONS.grill.y + 18,
          vx: (Math.random() - 0.5) * 8, vy: -30,
          size: 4 + Math.random() * 3, color: '#777', life: 0.9, maxLife: 0.9,
        });
      }
    }

    // Chopping while Space is held at the board.
    if (state.board.chopping && state.board.item && state.board.item.prep === 'raw') {
      state.board.progress += dt / TIMING.chopSeconds;
      state.board.chopTick += dt;
      if (state.board.chopTick > 0.28) {
        state.board.chopTick = 0;
        audio.chop();
        burst(STATIONS.board.x + STATIONS.board.w / 2, STATIONS.board.y + 36, '#c9f0c9', 4, 50);
      }
      if (state.board.progress >= 1) {
        state.board.item.prep = 'chopped';
        state.board.progress = 0;
        state.board.chopping = false;
        audio.place();
        if (!state.chef.carry) {
          state.chef.carry = { type: 'item', kind: state.board.item.kind, prep: 'chopped' };
          state.board.item = null;
          toast('Chopped! Carrying it.');
        } else {
          toast('Chopped — pick it up with E');
        }
      }
    }

    // Chef movement: keys win over click-to-walk.
    const k = state.keys;
    let dx = 0;
    let dy = 0;
    if (k.has('arrowleft') || k.has('keya')) dx -= 1;
    if (k.has('arrowright') || k.has('keyd')) dx += 1;
    if (k.has('arrowup') || k.has('keyw')) dy -= 1;
    if (k.has('arrowdown') || k.has('keys')) dy += 1;
    const chef = state.chef;
    if (dx !== 0 || dy !== 0) {
      chef.walkTarget = null;
      chef.walkStation = null;
      const len = Math.hypot(dx, dy);
      moveChef((dx / len) * TIMING.chefSpeed * dt, (dy / len) * TIMING.chefSpeed * dt);
      chef.dir = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
      chef.moving = true;
    } else if (chef.walkTarget) {
      const tx = chef.walkTarget.x;
      const ty = chef.walkTarget.y;
      const dist = Math.hypot(tx - chef.x, ty - chef.y);
      if (dist < 14) {
        chef.walkTarget = null;
        const st = chef.walkStation;
        chef.walkStation = null;
        if (st) interact();
      } else {
        const step = TIMING.chefSpeed * dt;
        moveChef(((tx - chef.x) / dist) * step, ((ty - chef.y) / dist) * step);
        chef.dir = Math.abs(tx - chef.x) > Math.abs(ty - chef.y)
          ? (tx > chef.x ? 'right' : 'left')
          : (ty > chef.y ? 'down' : 'up');
        chef.moving = true;
      }
    } else {
      chef.moving = false;
    }
  }

  function endShift() {
    state.mode = 'gameover';
    state.chef.walkTarget = null;
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      saveBest();
    }
    audio.stopSizzle();
    audio.fanfare();
  }

  function startShift() {
    const keepBest = state.bestScore;
    state = freshState(keepBest);
    state.keys = new Set();
    state.mode = 'playing';
    spawnOrder('classic');
    spawnOrder('melt');
    toast('Shift started — two orders in!');
  }

  // --- input ------------------------------------------------------------------
  function pressKey(code, down) {
    const c = code.toLowerCase();
    if (down && (state.mode === 'title') && (c === 'enter' || c === 'space')) {
      audio.unlock();
      startShift();
      return;
    }
    if (down && c === 'keyr') {
      audio.unlock();
      startShift();
      return;
    }
    if (down && c === 'keym') {
      const muted = audio.toggleMute();
      toast(muted ? 'Muted' : 'Sound on');
      return;
    }
    if (state.mode === 'playing' && down && c === 'keyp') {
      state.mode = 'paused';
      audio.stopSizzle();
      return;
    }
    if (state.mode === 'paused' && down && c === 'keyp') {
      state.mode = 'playing';
      return;
    }
    if (state.mode !== 'playing') return;
    if (c === 'keye' && down) interact();
    if (c === 'space') {
      state.board.chopping = down;
      if (down) audio.unlock();
    }
    if (down) state.keys.add(c);
    else state.keys.delete(c);
    if (down) audio.unlock();
  }

  function clickAt(x, y) {
    audio.unlock();
    if (state.mode === 'title') {
      if (x > VIEW_W / 2 - 170 && x < VIEW_W / 2 + 170 && y > 400 && y < 456) startShift();
      return;
    }
    if (state.mode !== 'playing') return;
    // Order tickets: click to select which order to plate for.
    // (Ticket width shrinks when four orders share the board.)
    if (y >= 30 && y <= 96) {
      const tw = state.orders.length >= 4 ? 190 : 218;
      const gap = state.orders.length >= 4 ? 8 : 10;
      const idx = Math.floor((x - 16) / (tw + gap));
      const tx = 16 + idx * (tw + gap);
      if (idx >= 0 && idx < state.orders.length && x >= tx && x <= tx + tw) {
        state.selectedOrderId = state.orders[idx].id;
        audio.pickup();
        return;
      }
    }
    // Stations: walk there, then interact on arrival.
    const targets = [];
    for (const crate of STATIONS.crates) targets.push({ rect: crate, point: { x: crate.x + crate.w / 2, y: 232 } });
    targets.push({ rect: STATIONS.board, point: { x: STATIONS.board.x + STATIONS.board.w / 2, y: 232 } });
    targets.push({ rect: STATIONS.grill, point: { x: STATIONS.grill.x + STATIONS.grill.w / 2, y: 232 } });
    targets.push({ rect: STATIONS.plating, point: { x: STATIONS.plating.x + STATIONS.plating.w / 2, y: 540 } });
    targets.push({ rect: STATIONS.window, point: { x: 1112, y: STATIONS.window.y + STATIONS.window.h / 2 } });
    targets.push({ rect: STATIONS.bin, point: { x: STATIONS.bin.x + STATIONS.bin.w / 2, y: 540 } });
    for (const t of targets) {
      const r = t.rect;
      if (x >= r.x - 14 && x <= r.x + r.w + 14 && y >= r.y - 14 && y <= r.y + r.h + 14) {
        state.chef.walkTarget = t.point;
        state.chef.walkStation = true;
        return;
      }
    }
    // Otherwise walk to the clicked floor spot.
    if (y > HUD_H + 10) {
      state.chef.walkTarget = { x: Math.max(WALK.x0, Math.min(WALK.x1, x)), y: Math.max(WALK.y0, Math.min(WALK.y1, y)) };
      state.chef.walkStation = null;
    }
  }

  // --- demo staging for screenshots ------------------------------------------
  // Deterministic, frozen scenes rendered by the game's own code. The update
  // loop skips them (state.demo), so every capture of the same shot matches.
  function stageShot(name) {
    const keepBest = state.bestScore;
    state = freshState(keepBest);
    state.keys = new Set();
    state.demo = true;
    state.mode = 'playing';
    if (name === 'title') {
      state.mode = 'title';
      state.demo = false;
      return;
    }
    if (name === 'cover') {
      state.score = 320;
      state.combo = 2;
      state.timeLeft = 134;
      state.served = 3;
      state.orders = [
        { id: 1, recipeId: 'classic', timeLeft: 38, patience: 65 },
        { id: 2, recipeId: 'melt', timeLeft: 52, patience: 65 },
        { id: 3, recipeId: 'salad', timeLeft: 24, patience: 60 },
      ];
      state.selectedOrderId = 1;
      state.chef.x = 640;
      state.chef.y = 430;
      state.chef.dir = 'up';
      state.chef.carry = { type: 'item', kind: 'tomato', prep: 'chopped' };
      state.board.item = { kind: 'lettuce', prep: 'raw' };
      state.board.progress = 0.55;
      state.grill[0] = { item: { kind: 'patty', prep: 'raw' }, t: 3.2, state: 'cooking' };
      state.plates[0] = {
        orderId: 1,
        recipeId: 'classic',
        items: [{ kind: 'bun', prep: 'raw' }, { kind: 'patty', prep: 'cooked' }],
        orphaned: false,
      };
      state.floats.push({ x: 1090, y: 400, text: '+120', color: '#7dff8a', size: 26, life: 1.2, maxLife: 1.2 });
      state.particles.push(
        { x: 950, y: 168, vx: 4, vy: -40, size: 3, color: '#ffcf5e', life: 0.4, maxLife: 0.4 },
        { x: 962, y: 172, vx: -3, vy: -52, size: 2, color: '#ffcf5e', life: 0.4, maxLife: 0.4 },
        { x: 940, y: 170, vx: 2, vy: -44, size: 3, color: '#ffcf5e', life: 0.4, maxLife: 0.4 },
      );
      return;
    }
    if (name === 'rush') {
      state.score = 480;
      state.combo = 4;
      state.timeLeft = 47;
      state.served = 5;
      state.orders = [
        { id: 1, recipeId: 'double', timeLeft: 6, patience: 48 },
        { id: 2, recipeId: 'onionstack', timeLeft: 31, patience: 55 },
        { id: 3, recipeId: 'classic', timeLeft: 44, patience: 65 },
        { id: 4, recipeId: 'salad', timeLeft: 18, patience: 50 },
      ];
      state.selectedOrderId = 1;
      state.chef.x = 1000;
      state.chef.y = 300;
      state.chef.dir = 'left';
      state.chef.carry = { type: 'item', kind: 'patty', prep: 'raw' };
      state.board.item = { kind: 'onion', prep: 'chopped' };
      state.grill[0] = { item: { kind: 'patty', prep: 'raw' }, t: 5.4, state: 'cooking' };
      state.grill[1] = { item: { kind: 'patty', prep: 'raw' }, t: 0, state: 'ready' };
      state.plates[0] = {
        orderId: 1,
        recipeId: 'double',
        items: [{ kind: 'bun', prep: 'raw' }, { kind: 'patty', prep: 'cooked' }, { kind: 'cheese', prep: 'raw' }],
        orphaned: false,
      };
      state.plates[1] = {
        orderId: 4,
        recipeId: 'salad',
        items: [{ kind: 'lettuce', prep: 'chopped' }],
        orphaned: false,
      };
      state.toast = 'RUSH! Double Trouble is about to walk out!';
      state.toastT = 99;
      return;
    }
    if (name === 'serve') {
      state.score = 210;
      state.combo = 1;
      state.timeLeft = 152;
      state.served = 2;
      state.orders = [
        { id: 1, recipeId: 'melt', timeLeft: 40, patience: 65 },
        { id: 2, recipeId: 'salad', timeLeft: 55, patience: 60 },
      ];
      state.selectedOrderId = 1;
      state.chef.x = 1085;
      state.chef.y = 452;
      state.chef.dir = 'right';
      state.chef.carry = {
        type: 'plate',
        plate: {
          orderId: 1,
          recipeId: 'melt',
          items: [{ kind: 'bun', prep: 'raw' }, { kind: 'patty', prep: 'cooked' }, { kind: 'cheese', prep: 'raw' }],
          orphaned: false,
        },
      };
      state.floats.push({ x: 1090, y: 380, text: '+140', color: '#7dff8a', size: 26, life: 1.2, maxLife: 1.2 });
      state.toast = 'Cheese Melt ready — serve it!';
      state.toastT = 99;
      return;
    }
    // Unknown shot name: fall back to a plain playing scene.
    state.demo = false;
    startShift();
  }

  // Test hook: lets the playtest drive the real rules fast (advance timers).
  function skip(seconds) {
    const step = 0.05;
    let left = seconds;
    while (left > 0 && state.mode === 'playing') {
      update(Math.min(step, left));
      left -= step;
    }
  }

  state.keys = new Set();
  return {
    get state() {
      return state;
    },
    update,
    pressKey,
    clickAt,
    interact,
    startShift,
    stageShot,
    skip,
  };
}
