// Alma · soundscape engine
// Everything is synthesised on the device with WebAudio: no files, no streaming,
// nothing leaves the phone. Honest framing lives in data2.js (SOUND_HONESTY).

let ctx = null;
let master = null;
let current = null; // { id, stop() }

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
}

function fadeMaster(to, seconds) {
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(to, now + seconds);
}

// A slow warm pad around a base frequency: detuned oscillator pair plus a soft
// shimmer an octave up, breathing gently via an LFO on the filter.
function padEngine(baseHz) {
  const nodes = [];
  const bus = ctx.createGain(); bus.gain.value = 0.22;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = baseHz * 6; filter.Q.value = 0.4;
  bus.connect(filter); filter.connect(master);

  const mk = (freq, gain, type = "sine") => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain;
    o.connect(g); g.connect(bus); o.start();
    nodes.push(o);
    return o;
  };
  mk(baseHz, 0.5);
  mk(baseHz * 1.005, 0.4);           // gentle beating
  mk(baseHz * 2, 0.12, "triangle");  // shimmer
  mk(baseHz / 2, 0.25);              // floor

  const lfo = ctx.createOscillator(); const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.07; lfoGain.gain.value = baseHz * 2;
  lfo.connect(lfoGain); lfoGain.connect(filter.frequency); lfo.start();
  nodes.push(lfo);

  return () => { nodes.forEach((n) => { try { n.stop(); } catch {} }); bus.disconnect(); };
}

// Filtered noise with a slow amplitude swell: waves without a single sample file.
function noiseEngine(kind) {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = 0.98 * last + 0.02 * white; // pink-ish
    d[i] = kind === "rain" ? white * 0.35 + last * 0.4 : last;
  }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = kind === "rain" ? 3200 : 900;
  const bus = ctx.createGain(); bus.gain.value = kind === "rain" ? 0.5 : 0.7;
  src.connect(filter); filter.connect(bus); bus.connect(master);
  src.start();

  let lfo = null, lfoGain = null;
  if (kind === "ocean") { // slow wave swell
    lfo = ctx.createOscillator(); lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08; lfoGain.gain.value = 0.32;
    lfo.connect(lfoGain); lfoGain.connect(bus.gain); lfo.start();
  }
  return () => { try { src.stop(); lfo?.stop(); } catch {} bus.disconnect(); };
}

export function playScape(scape) {
  ensureCtx();
  stopScape(0.15);
  const stop = scape.engine === "pad" ? padEngine(scape.base) : noiseEngine(scape.engine);
  current = { id: scape.id, stop };
  fadeMaster(0.8, 2.5);
  return scape.id;
}

export function stopScape(fade = 1.2) {
  if (!ctx || !current) return;
  const dying = current; current = null;
  fadeMaster(0, fade);
  setTimeout(() => { if (!current) dying.stop(); }, fade * 1000 + 60);
}

export function playingId() { return current?.id || null; }

// One soft chime for breath-phase changes; quiet, brief, optional.
export function chime() {
  if (!ctx || !current) return; // only chime while a scape is running
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = "sine"; o.frequency.value = 660;
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + 1);
}
