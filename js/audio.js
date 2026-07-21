// Harta · soundscape engine
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
function padEngine(baseHz, bright) {
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
  if (bright) {                       // the uplifting voices: a major chord opening upward
    mk(baseHz * 1.25, 0.18);          // major third
    mk(baseHz * 1.5, 0.15);           // perfect fifth
    mk(baseHz * 3, 0.05, "triangle"); // high air
  }

  const lfo = ctx.createOscillator(); const lfoGain = ctx.createGain();
  lfo.frequency.value = bright ? 0.12 : 0.07; lfoGain.gain.value = baseHz * 2;
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
  filter.frequency.value = kind === "rain" ? 2400 : kind === "stream" ? 1400 : 620;
  filter.Q.value = 0.3;
  const bus = ctx.createGain(); bus.gain.value = kind === "rain" ? 0.34 : kind === "stream" ? 0.42 : 0.55;
  src.connect(filter); filter.connect(bus); bus.connect(master);
  // slow wandering of the filter keeps the bed alive instead of a flat hiss
  const wander = ctx.createOscillator(); const wanderGain = ctx.createGain();
  wander.frequency.value = kind === "rain" ? 0.05 : 0.03;
  wanderGain.gain.value = filter.frequency.value * 0.35;
  wander.connect(wanderGain); wanderGain.connect(filter.frequency); wander.start();
  src.start();

  let lfo = null, lfoGain = null;
  if (kind === "ocean" || kind === "stream") { // slow swell; the stream burbles faster
    lfo = ctx.createOscillator(); lfoGain = ctx.createGain();
    lfo.frequency.value = kind === "stream" ? 0.5 : 0.08; lfoGain.gain.value = kind === "stream" ? 0.12 : 0.32;
    lfo.connect(lfoGain); lfoGain.connect(bus.gain); lfo.start();
  }
  return () => { try { src.stop(); lfo?.stop(); wander.stop(); } catch {} bus.disconnect(); };
}

// Four tonal instruments, synthesised without any noise bed at all.
// Shared voice: harmonics with individual envelopes, connected straight to master.

function toneVoice(freq, t, { partials, attack = 0.01, decay = 3, gain = 0.2, type = "sine" }) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  g.connect(master);
  for (const [ratio, pGain] of partials) {
    const o = ctx.createOscillator(); const pg = ctx.createGain();
    o.type = type; o.frequency.value = freq * ratio; pg.gain.value = pGain;
    o.connect(pg); pg.connect(g); o.start(t); o.stop(t + decay + 0.1);
  }
}

function makeScheduler() {
  let alive = true;
  const timers = [];
  const later = (fn, ms) => { if (alive) timers.push(setTimeout(fn, ms)); };
  const stop = () => { alive = false; timers.forEach(clearTimeout); };
  return { later, stop, get alive() { return alive; } };
}

// Havasi-mood piano: slow emotional chord arpeggios in A minor, sustained, no bed.
function pianoEngine() {
  const sch = makeScheduler();
  const CHORDS = [
    [110, 164.81, 220, 261.63, 329.63],        // Am
    [87.31, 130.81, 174.61, 261.63, 349.23],   // F
    [98, 146.83, 196, 246.94, 293.66],         // G
    [130.81, 196, 261.63, 329.63, 392],        // C
  ];
  const PIANO = { partials: [[1, 1], [2, 0.5], [3, 0.22], [4, 0.1], [5, 0.05]], attack: 0.008, gain: 0.16 };
  let ci = 0;
  const bar = () => {
    if (!sch.alive) return;
    const chord = CHORDS[ci % CHORDS.length]; ci++;
    const t = ctx.currentTime;
    // left hand: deep root held long
    toneVoice(chord[0], t, { ...PIANO, decay: 7, gain: 0.2 });
    // right hand: rising arpeggio, humanised
    chord.slice(1).forEach((f, i) => {
      toneVoice(f * 2, t + 0.5 + i * (0.55 + Math.random() * 0.15), { ...PIANO, decay: 4.5, gain: 0.11 });
    });
    // occasional high answer, an octave above
    if (Math.random() < 0.5) toneVoice(chord[2] * 4, t + 3 + Math.random(), { ...PIANO, decay: 5, gain: 0.05 });
    sch.later(bar, 6500 + Math.random() * 1200);
  };
  bar();
  return sch.stop;
}

// Singing bowls: one long ring at a time, slightly detuned partials that beat like bronze.
function bowlsEngine() {
  const sch = makeScheduler();
  const BOWLS = [196, 233.08, 261.63, 293.66];
  const strike = () => {
    if (!sch.alive) return;
    const f = BOWLS[Math.floor(Math.random() * BOWLS.length)];
    const t = ctx.currentTime;
    toneVoice(f, t, { partials: [[1, 1], [1.003, 0.8], [2.71, 0.25], [2.716, 0.2], [5.4, 0.06]], attack: 0.04, decay: 12, gain: 0.17 });
    sch.later(strike, 9000 + Math.random() * 5000);
  };
  strike();
  return sch.stop;
}

// Kalimba: bright plucked tines, quick decay, gentle pentatonic wandering.
function kalimbaEngine() {
  const sch = makeScheduler();
  const TINES = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
  let idx = 3;
  const pluck = () => {
    if (!sch.alive) return;
    idx = Math.max(0, Math.min(TINES.length - 1, idx + (Math.floor(Math.random() * 5) - 2)));
    const t = ctx.currentTime;
    toneVoice(TINES[idx], t, { partials: [[1, 1], [2, 0.6], [6.27, 0.15]], attack: 0.004, decay: 1.6, gain: 0.14 });
    if (Math.random() < 0.25) toneVoice(TINES[Math.max(0, idx - 2)], t + 0.22, { partials: [[1, 1], [2, 0.6], [6.27, 0.15]], attack: 0.004, decay: 1.4, gain: 0.1 });
    sch.later(pluck, 900 + Math.random() * 1400);
  };
  pluck();
  return sch.stop;
}

// Wind chimes: sparse high bells with inharmonic partials, drifting in small clusters.
function chimesEngine() {
  const sch = makeScheduler();
  const TUBES = [659.26, 739.99, 830.61, 987.77, 1108.73];
  const gust = () => {
    if (!sch.alive) return;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const f = TUBES[Math.floor(Math.random() * TUBES.length)];
      sch.later(() => toneVoice(f, ctx.currentTime, { partials: [[1, 1], [2.76, 0.4], [5.4, 0.18]], attack: 0.005, decay: 6, gain: 0.07 }), i * (250 + Math.random() * 500));
    }
    sch.later(gust, 5000 + Math.random() * 7000);
  };
  gust();
  return sch.stop;
}

const TONAL_ENGINES = { piano: pianoEngine, bowls: bowlsEngine, kalimba: kalimbaEngine, chimes: chimesEngine };

export function playScape(scape) {
  ensureCtx();
  stopScape(0.15);
  const stop = scape.engine === "pad" ? padEngine(scape.base, scape.bright) : TONAL_ENGINES[scape.engine] ? TONAL_ENGINES[scape.engine]() : noiseEngine(scape.engine);
  current = { id: scape.id, stop };
  fadeMaster(0.8, 2.5);
  return scape.id;
}

export function stopScape(fade = 1.2) {
  if (!ctx || !current) return;
  const dying = current; current = null;
  fadeMaster(0, fade);
  setTimeout(() => dying.stop(), fade * 1000 + 60); // always stop the old engine; never let two run
}

export function playingId() { return current?.id || null; }

// One soft chime for breath-phase changes; quiet, brief, optional.
export function chime() {
  ensureCtx(); // the Begin tap is a user gesture; the chime may sound alone
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = "sine"; o.frequency.value = 660;
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + 1);
}
