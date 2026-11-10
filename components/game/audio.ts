/**
 * Game audio, all WebAudio:
 *  - voice lines: pre-generated locally with Kokoro TTS (public/audio/voice)
 *  - sound effects and music: synthesised on the fly, zero asset downloads
 *
 * Browsers only allow audio after a user gesture, so the context is created
 * lazily by unlockAudio() on the first pointer / key press.
 */

let ctx: AudioContext | null = null;
let master: GainNode;
let sfxBus: GainNode;
let musicBus: GainNode;
let voiceBus: GainNode;
let noiseBuf: AudioBuffer;
let muted = false;
const listeners = new Set<(m: boolean) => void>();

try {
  muted = localStorage.getItem("island-muted") === "1";
} catch {
  /* storage unavailable: default to sound on */
}

export function isMuted() {
  return muted;
}
export function onMute(fn: (m: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem("island-muted", m ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
  listeners.forEach((fn) => fn(m));
}

export function unlockAudio() {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp).connect(ctx.destination);
  sfxBus = bus(0.5);
  musicBus = bus(0.16);
  voiceBus = bus(1);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  startMusic();
}

function bus(v: number) {
  const g = ctx!.createGain();
  g.gain.value = v;
  g.connect(master);
  return g;
}

/* ------------------------------------------------------------------ */
/*  Synth building blocks                                              */
/* ------------------------------------------------------------------ */

type Env = { a?: number; d: number; peak?: number };

function tone(type: OscillatorType, f0: number, f1: number, env: Env, out: AudioNode = sfxBus, at = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + env.d);
  const a = env.a ?? 0.004;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(env.peak ?? 0.4, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + env.d);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + a + env.d + 0.05);
}

function noise(filter: BiquadFilterType, f0: number, f1: number, env: Env, q = 1, out: AudioNode = sfxBus, at = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const bq = ctx.createBiquadFilter();
  bq.type = filter;
  bq.Q.value = q;
  bq.frequency.setValueAtTime(f0, t);
  bq.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + env.d);
  const g = ctx.createGain();
  const a = env.a ?? 0.003;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(env.peak ?? 0.5, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + env.d);
  src.connect(bq).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + a + env.d + 0.05);
}

/* ------------------------------------------------------------------ */
/*  Sound effects                                                      */
/* ------------------------------------------------------------------ */

const last: Record<string, number> = {};
/** Per-sound minimum gap, so a 30-monster melee doesn't turn into static. */
const GAP: Record<string, number> = { hit: 0.045, pop: 0.05, shoot_laser: 0.06 };

export function sfx(name: string) {
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  if (GAP[name] && now - (last[name] ?? 0) < GAP[name]) return;
  last[name] = now;
  const j = 1 + (Math.random() - 0.5) * 0.12; // a little pitch variety
  switch (name) {
    case "shoot_fists":
      noise("lowpass", 900, 200, { d: 0.08, peak: 0.5 });
      tone("sine", 160 * j, 60, { d: 0.09, peak: 0.5 });
      break;
    case "shoot_sword":
      noise("bandpass", 600 * j, 4000, { a: 0.02, d: 0.16, peak: 0.45 }, 3);
      break;
    case "shoot_pistol":
      tone("square", 880 * j, 220, { d: 0.09, peak: 0.22 });
      noise("highpass", 3000, 1500, { d: 0.04, peak: 0.25 });
      break;
    case "shoot_shotgun":
      noise("lowpass", 4000, 300, { d: 0.22, peak: 0.7 });
      tone("triangle", 140 * j, 50, { d: 0.18, peak: 0.5 });
      break;
    case "shoot_laser":
      tone("sawtooth", 1800 * j, 500, { d: 0.07, peak: 0.12 });
      break;
    case "shoot_rocket":
      noise("lowpass", 300, 1800, { a: 0.04, d: 0.35, peak: 0.4 }, 2);
      tone("sawtooth", 90, 160, { a: 0.03, d: 0.3, peak: 0.15 });
      break;
    case "hit":
      tone("square", 320 * j, 120, { d: 0.05, peak: 0.12 });
      break;
    case "pop":
      tone("sine", 300 * j, 1200, { d: 0.09, peak: 0.35 });
      noise("bandpass", 2000, 800, { d: 0.08, peak: 0.25 }, 2);
      break;
    case "boss_die":
      noise("lowpass", 2000, 60, { d: 1.2, peak: 0.9 });
      tone("sawtooth", 220, 30, { d: 1.1, peak: 0.35 });
      break;
    case "boom":
      noise("lowpass", 1800, 50, { d: 0.6, peak: 0.9 });
      tone("sine", 110, 35, { d: 0.5, peak: 0.6 });
      break;
    case "hurt":
      tone("sawtooth", 200, 70, { d: 0.18, peak: 0.3 });
      noise("lowpass", 600, 100, { d: 0.12, peak: 0.4 });
      break;
    case "pickup":
      [523, 659, 784, 1047].forEach((f, i) => tone("square", f, f, { d: 0.09, peak: 0.16 }, sfxBus, i * 0.06));
      break;
    case "heal":
      [660, 990].forEach((f, i) => tone("sine", f, f * 1.01, { d: 0.15, peak: 0.3 }, sfxBus, i * 0.08));
      break;
    case "xp":
      [784, 988, 1175, 1568].forEach((f, i) => tone("triangle", f, f, { d: 0.14, peak: 0.3 }, sfxBus, i * 0.07));
      break;
    case "clear":
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone("square", f, f, { d: 0.12, peak: 0.14 }, sfxBus, i * 0.09));
      break;
    case "victory":
      [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) =>
        tone("square", f, f, { d: i === 7 ? 0.6 : 0.12, peak: 0.16 }, sfxBus, [0, 0.12, 0.24, 0.36, 0.6, 0.78, 0.9, 1.1][i])
      );
      break;
    case "defeat":
      [392, 370, 349, 262].forEach((f, i) => tone("triangle", f, f * 0.98, { d: i === 3 ? 0.8 : 0.25, peak: 0.3 }, sfxBus, i * 0.3));
      break;
    case "start":
      [262, 392, 523].forEach((f, i) => tone("sawtooth", f, f, { d: 0.18, peak: 0.12 }, sfxBus, i * 0.12));
      noise("lowpass", 400, 80, { d: 0.5, peak: 0.5 }, 1, sfxBus, 0.36);
      break;
    case "click":
      tone("sine", 900, 600, { d: 0.04, peak: 0.2 });
      break;
  }
}

/* ------------------------------------------------------------------ */
/*  Voice lines (Kokoro)                                               */
/* ------------------------------------------------------------------ */

const voiceCache = new Map<string, Promise<AudioBuffer | null>>();
let currentVoice: AudioBufferSourceNode | null = null;

function loadVoice(id: string) {
  let p = voiceCache.get(id);
  if (!p) {
    p = fetch(`/audio/voice/${id}.m4a`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((b) => ctx!.decodeAudioData(b))
      .catch(() => null);
    voiceCache.set(id, p);
  }
  return p;
}

/** Warm the cache so lines play instantly when they're needed. */
export function preloadVoices(ids: string[]) {
  if (!ctx) return;
  ids.forEach(loadVoice);
}

export async function voice(id: string, { interrupt = true } = {}) {
  if (!ctx || muted) return;
  const buf = await loadVoice(id);
  if (!buf || !ctx) return;
  if (currentVoice) {
    if (!interrupt) return;
    try {
      currentVoice.stop();
    } catch {
      /* already stopped */
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(voiceBus);
  // Duck the music under speech.
  musicBus.gain.setTargetAtTime(0.05, ctx.currentTime, 0.05);
  src.onended = () => {
    if (currentVoice === src) {
      currentVoice = null;
      musicBus.gain.setTargetAtTime(0.16, ctx!.currentTime, 0.3);
    }
  };
  src.start();
  currentVoice = src;
}

/* ------------------------------------------------------------------ */
/*  Music: a tiny chiptune sequencer                                   */
/* ------------------------------------------------------------------ */

let battle = false;
export function setBattleMusic(on: boolean) {
  battle = on;
}

// Island: breezy major pentatonic. Battle: driving minor.
const ISLAND = { bpm: 108, lead: [72, 0, 76, 79, 81, 0, 79, 76, 74, 0, 76, 72, 69, 0, 72, 0], bass: [48, 48, 55, 55, 53, 53, 55, 55] };
const BATTLE = { bpm: 150, lead: [69, 72, 76, 72, 74, 72, 69, 67, 69, 72, 76, 79, 77, 76, 74, 72], bass: [45, 45, 45, 45, 41, 41, 43, 43] };

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function startMusic() {
  if (!ctx) return;
  let step = 0;
  let next = ctx.currentTime + 0.1;
  const tick = () => {
    if (!ctx) return;
    while (next < ctx.currentTime + 0.2) {
      const song = battle ? BATTLE : ISLAND;
      const sixteenth = 60 / song.bpm / 4;
      const at = next - ctx.currentTime;
      const ln = song.lead[step % 16];
      if (ln && step % 2 === 0) tone(battle ? "square" : "triangle", midi(ln), midi(ln), { d: sixteenth * 1.6, peak: battle ? 0.12 : 0.2 }, musicBus, at);
      if (step % 4 === 0) tone("triangle", midi(song.bass[(step / 4) % 8]), midi(song.bass[(step / 4) % 8]), { d: sixteenth * 3.5, peak: 0.35 }, musicBus, at);
      if (battle && step % 4 === 0) tone("sine", 140, 45, { d: 0.12, peak: 0.6 }, musicBus, at); // kick
      if (step % 2 === 1) noise("highpass", 7000, 6000, { d: 0.03, peak: battle ? 0.12 : 0.06 }, 1, musicBus, at); // hat
      next += sixteenth;
      step++;
    }
  };
  setInterval(tick, 50);
}
