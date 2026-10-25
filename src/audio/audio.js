// All sound is generated here with the Web Audio API: no audio files.
// Browsers only allow sound after a tap, so the AudioContext is made on the first gesture.

const C4 = 261.63;
const hz = (semitones) => C4 * 2 ** (semitones / 12);

// name -> list of notes. at = delay (s), d = length (s), f = start Hz, to = slide-to Hz, g = volume.
export const SFX = {
  tap: [{ f: 520, to: 820, d: 0.07, t: 'sine', g: 0.22 }],
  coin: [
    { f: 1175, d: 0.06, t: 'triangle', g: 0.1 },
    { f: 1568, at: 0.05, d: 0.09, t: 'triangle', g: 0.1 },
  ],
  buy: [
    { f: hz(7), d: 0.09, t: 'triangle', g: 0.2 },
    { f: hz(14), at: 0.07, d: 0.14, t: 'triangle', g: 0.2 },
  ],
  auto: [0, 4, 7, 12].map((n, i) => ({ f: hz(n + 12), at: i * 0.07, d: 0.12, t: 'triangle', g: 0.18 })),
  claim: [0, 4, 7, 12, 16].map((n, i) => ({ f: hz(n + 12), at: i * 0.08, d: 0.16, t: 'triangle', g: 0.2 })),
  gem: [
    { f: 1480, d: 0.1, t: 'sine', g: 0.16 },
    { f: 1976, at: 0.08, d: 0.2, t: 'sine', g: 0.16 },
  ],
  achievement: [0, 4, 7, 12, 7, 16].map((n, i) => ({ f: hz(n + 12), at: i * 0.09, d: 0.2, t: 'square', g: 0.09 })),
  prestige: [0, 7, 12, 16, 19, 24].map((n, i) => ({ f: hz(n), at: i * 0.1, d: 0.5, t: 'sine', g: 0.16 })),
  wing: [0, 4, 7].flatMap((n, i) => [
    { f: hz(n + 12), at: i * 0.12, d: 0.4, t: 'triangle', g: 0.16 },
    { f: hz(n + 24), at: i * 0.12, d: 0.4, t: 'sine', g: 0.08 },
  ]),
};

// Sounds that can fire many times a second are limited to one per this many seconds.
const MIN_GAP = { coin: 0.12, tap: 0.04, buy: 0.05 };

// ---- music: a slow, soft, never-quite-repeating pentatonic loop ----
const BPM = 76;
const BAR_STEPS = 4;
// Chord roots in semitones from C4: C, Am, F, G.
const ROOTS = [0, -3, -7, -5];
const PENTATONIC = [0, 2, 4, 7, 9];

const noise = (n) => ((Math.imul(n + 1, 2654435761) ^ Math.imul(n + 7, 40503) ^ (n << 7)) >>> 0) / 4294967296;

/** What to play on beat number `step` (pure, so it can be tested). */
export function musicPlan(step) {
  const bar = Math.floor(step / BAR_STEPS);
  const beat = step % BAR_STEPS;
  const root = ROOTS[bar % ROOTS.length];
  const plan = { pad: null, bass: null, lead: null };
  if (beat === 0) {
    plan.pad = [root, root + (root === -3 ? 3 : 4), root + 7].map((n) => hz(n));
    plan.bass = hz(root - 12);
  }
  if (beat === 2 && noise(step) < 0.5) plan.bass = hz(root - 5);
  if (noise(step * 3 + 11) < 0.55) {
    const idx = Math.floor(noise(step * 5 + 3) * PENTATONIC.length);
    const octave = noise(step * 7 + 5) < 0.3 ? 24 : 12;
    plan.lead = hz(PENTATONIC[idx] + octave);
  }
  return plan;
}

export const STEP_SECONDS = 60 / BPM;

/**
 * getSettings(): the live settings object. Nothing is created until unlock().
 * `ctxFactory` is only for tests.
 */
export function createAudio(getSettings, ctxFactory) {
  let ctx = null;
  let sfxGain = null;
  let musicGain = null;
  let timer = 0;
  let nextTime = 0;
  let step = 0;
  let hidden = false;
  const lastPlayed = {};

  const makeCtx = ctxFactory || (() => {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    return AC ? new AC() : null;
  });

  const sfxOn = () => { const s = getSettings(); return !s.muted && s.sfx; };
  const musicOn = () => { const s = getSettings(); return !s.muted && s.music && !hidden; };

  function tone(dest, note, when) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = note.t || 'sine';
    const start = when + (note.at || 0);
    osc.frequency.setValueAtTime(note.f, start);
    if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, start + note.d);
    const peak = note.g ?? 0.15;
    const attack = Math.min(0.02, note.d / 4);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + note.d + (note.tail || 0.05));
    osc.connect(g);
    g.connect(dest);
    osc.start(start);
    osc.stop(start + note.d + (note.tail || 0.05) + 0.02);
  }

  function schedule() {
    if (!ctx || !musicOn()) return;
    while (nextTime < ctx.currentTime + 0.8) {
      const when = Math.max(nextTime, ctx.currentTime + 0.02);
      const plan = musicPlan(step);
      if (plan.pad) for (const f of plan.pad) tone(musicGain, { f, d: STEP_SECONDS * 3.6, t: 'sine', g: 0.05, tail: 0.6 }, when);
      if (plan.bass) tone(musicGain, { f: plan.bass, d: STEP_SECONDS * 0.9, t: 'triangle', g: 0.09 }, when);
      if (plan.lead) tone(musicGain, { f: plan.lead, d: STEP_SECONDS * 0.7, t: 'triangle', g: 0.07, tail: 0.3 }, when);
      step += 1;
      nextTime += STEP_SECONDS;
    }
  }

  function startMusic() {
    if (timer || !ctx) return;
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 250);
    schedule();
  }
  function stopMusic() {
    if (timer) { clearInterval(timer); timer = 0; }
  }

  /** Bring the music in line with the settings (call after any change). */
  function sync() {
    if (!ctx) return;
    if (musicOn()) {
      startMusic();
      musicGain.gain.setTargetAtTime(0.5, ctx.currentTime, 0.2);
    } else {
      musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      stopMusic();
    }
  }

  return {
    /** Call from the first tap / key press. Safe to call repeatedly. */
    unlock() {
      if (!ctx) {
        try { ctx = makeCtx(); } catch { ctx = null; }
        if (!ctx) return false;
        sfxGain = ctx.createGain();
        sfxGain.gain.value = 0.8;
        sfxGain.connect(ctx.destination);
        musicGain = ctx.createGain();
        musicGain.gain.value = 0;
        musicGain.connect(ctx.destination);
      }
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      sync();
      return true;
    },

    play(name) {
      if (!ctx || !sfxOn()) return;
      const notes = SFX[name];
      if (!notes) return;
      const now = ctx.currentTime;
      const gap = MIN_GAP[name] || 0;
      if (gap && lastPlayed[name] !== undefined && now - lastPlayed[name] < gap) return;
      lastPlayed[name] = now;
      for (const n of notes) tone(sfxGain, n, now);
    },

    sync,

    /** Pause everything while the app is in the background. */
    setHidden(value) {
      hidden = !!value;
      if (ctx) {
        if (hidden) { stopMusic(); if (ctx.suspend) ctx.suspend(); } else { if (ctx.resume) ctx.resume(); sync(); }
      }
    },

    get ready() { return !!ctx; },
  };
}
