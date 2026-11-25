// Sizzle Rush — audio.js
// One job: every sound in the game, synthesized live with WebAudio.
// No audio files, no network. Created lazily on the first user gesture.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function unlock() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume();
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, filterFreq, when = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0);
  }

  return {
    unlock,
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopSizzle();
      return muted;
    },

    // A short wooden thunk for each chop hit.
    chop() {
      tone(180, 0.09, 'triangle', 0.25, 0, 70);
      noiseBurst(0.05, 0.18, 900);
    },
    // Pick something up: a soft pop.
    pickup() {
      tone(520, 0.07, 'sine', 0.18, 0, 780);
    },
    // Put something down: a dull tap.
    place() {
      tone(240, 0.06, 'triangle', 0.16, 0, 140);
    },
    // Plate complete: a bright two-note ding.
    ding() {
      tone(880, 0.16, 'sine', 0.22);
      tone(1318, 0.28, 'sine', 0.2, 0.09);
    },
    // Served: a happy cash-register-ish chirp.
    serve() {
      tone(660, 0.09, 'square', 0.1);
      tone(880, 0.09, 'square', 0.1, 0.08);
      tone(1320, 0.18, 'sine', 0.16, 0.16);
    },
    // Wrong move: a low buzz.
    buzz() {
      tone(140, 0.22, 'sawtooth', 0.14, 0, 90);
    },
    // New order ticket slides in.
    ticket() {
      tone(440, 0.07, 'sine', 0.14);
      tone(587, 0.1, 'sine', 0.14, 0.07);
    },
    // Order expired: a sad descending pair.
    expire() {
      tone(330, 0.2, 'triangle', 0.2, 0, 220);
      tone(220, 0.3, 'triangle', 0.2, 0.18, 140);
    },
    // Game over / shift end fanfare.
    fanfare() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.18, i * 0.12));
    },
    // Continuous grill sizzle while any patty cooks. Idempotent.
    startSizzle() {
      if (muted || sizzleNodes || !ensure()) return;
      const c = ctx;
      const len = c.sampleRate;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3500;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(0.045, c.currentTime + 0.3);
      src.connect(filter).connect(gain).connect(c.destination);
      src.start();
      sizzleNodes = { src, gain };
    },
    stopSizzle() {
      if (!sizzleNodes || !ctx) return;
      const { src, gain } = sizzleNodes;
      sizzleNodes = null;
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      src.stop(ctx.currentTime + 0.25);
    },
  };
}
