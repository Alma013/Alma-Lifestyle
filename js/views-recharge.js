// Harta · the sanctuary: daily arrival, breath, sound, and the inner-power prompts.
// This is the part of the app that recharges rather than organises.

import { el, icon, toast, openModal, closeModal } from "./ui.js";
import { store, todayISO, uid, greeting, localDayOf, claimMilestone } from "./store.js";
import { passageForToday, eveningPassageForToday, PROMPTS, SOUNDSCAPES, SOUND_GROUPS, STEADY_TECHNIQUES, STEADY_NOTE, ACHIEVER_TECHNIQUES, ACHIEVER_NOTE } from "./data2.js";
import { speak, stopSpeaking, voiceAvailable, listenAvailable } from "./voice.js";
import { openTalk } from "./talk.js";
import { addJournalEntry } from "./idb.js";
import { openWhy } from "./views-track.js";
import { playScape, stopScape, playingId, chime } from "./audio.js";

// ---------- the daily threshold ----------
// Shown once per day, before anything practical. A moment, not a gate:
// one passage, one breath, then the day.
export function maybeShowArrival() {
  const s = store.get();
  if (!s.onboarded) return;
  const today = todayISO();
  if (s.arrivalLast === today) return;
  const p = passageForToday(today);
  const overlay = el("div", { class: "arrival", role: "dialog", "aria-label": "Daily passage" },
    el("div", { class: "a-eyebrow" }, "Before the day"),
    el("p", { class: "a-passage" }, "“" + p.text + "”"),
    el("div", { class: "a-ref" }, p.ref),
    el("div", { class: "btn-row", style: "justify-content:center" },
      el("button", { class: "btn", onclick: dismiss }, "Step in"),
      voiceAvailable() && s.voiceOn ? el("button", { class: "btn secondary", onclick: () => speak(p.text + ". " + p.ref) }, "Hear it") : null,
    ),
    el("button", { class: "link a-skip", onclick: dismiss }, "Skip today"),
  );
  function dismiss() {
    stopSpeaking();
    store.mutate((st) => { st.arrivalLast = today; });
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), 480);
  }
  overlay.addEventListener("keydown", (e) => { if (e.key === "Escape") dismiss(); });
  document.body.append(overlay);
  overlay.querySelector(".btn")?.focus();
}

// ---------- breathing ----------
const BREATH_PATTERNS = {
  calm: { label: "Slow calm", phases: [["Breathe in", 4], ["Hold", 2], ["Breathe out", 6]],
    how: "In through the nose, out through the nose or softly parted lips. Jaw loose, shoulders down.",
    note: "A longer exhale nudges the nervous system toward rest. Slow breathing at around six breaths a minute is one of the better-studied relaxation practices." },
  box: { label: "Box", phases: [["Breathe in", 4], ["Hold", 4], ["Breathe out", 4], ["Hold", 4]],
    how: "In and out through the nose, quietly. The mouth stays closed, the tongue rests on the roof of the mouth.",
    note: "Even sides, like tracing a square. Used everywhere from clinics to cockpits for steadying attention." },
  "478": { label: "4-7-8", phases: [["Breathe in", 4], ["Hold", 7], ["Breathe out", 8]],
    how: "In through the nose for four, hold for seven, then out through the open mouth with a soft whoosh for eight, lips as if cooling soup.",
    note: "A stronger pattern for winding down toward sleep. If holding feels strained, the gentle pattern is the better choice tonight." },
};

let breathTimer = null;
let breathStartedAt = null;
let creditOnLeave = null;
function stopBreath() {
  if (breathTimer) { clearInterval(breathTimer.iv); clearTimeout(breathTimer.to); breathTimer = null; }
}

export function renderRecharge(main, navigate) {
  stopBreath();
  const s = store.get();
  const greet = greeting();
  const passage = passageForToday(todayISO());
  let pattern = "calm";
  let running = false;
  let minutes = 0;

  const word = el("div", { class: "breath-word", role: "status", "aria-live": "polite" }, "Ready");
  const count = el("div", { class: "breath-count" }, "Three minutes is a real reset. One is still real.");
  const howLine = el("p", { class: "tiny center", style: "max-width:26rem;margin:0.5rem auto 0" }, BREATH_PATTERNS[pattern].how);
  const stars = el("div", { class: "breath-stars", "aria-hidden": "true" });
  const orbit = el("div", { class: "orbit" });
  stars.append(orbit);
  for (let i = 0; i < 78; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = 18 + Math.random() * 78; // per cent of ring radius
    const st = el("i");
    st.style.left = (50 + (radius / 2) * Math.cos(angle)) + "%";
    st.style.top = (50 + (radius / 2) * Math.sin(angle)) + "%";
    const size = 1 + Math.random() * 2.4;
    st.style.width = size + "px"; st.style.height = size + "px";
    st.style.animationDuration = (2.2 + Math.random() * 3.8) + "s";
    st.style.animationDelay = (Math.random() * 3) + "s";
    orbit.append(st);
  }
  const ring = el("div", { class: "breath-ring sky" }, stars, word);

  function runPhase(i, startedAt) {
    const phases = BREATH_PATTERNS[pattern].phases;
    const [label, secs] = phases[i % phases.length];
    word.textContent = label;
    ring.style.setProperty("--breath-dur", secs + "s");
    ring.className = "breath-ring sky " + (label.includes("in") ? "inhale" : label.includes("out") ? "exhale" : "hold");
    chime();
    let left = secs;
    count.textContent = `${label} · ${left}`;
    breathTimer = {
      iv: setInterval(() => { left--; if (left > 0) count.textContent = `${label} · ${left}`; }, 1000),
      to: setTimeout(() => {
        clearInterval(breathTimer.iv);
        if (running) runPhase(i + 1, startedAt);
      }, secs * 1000),
    };
    minutes = (Date.now() - startedAt) / 60000;
  }

  const creditMinutes = () => {
    if (!breathStartedAt) return;
    const mins = Math.round((Date.now() - breathStartedAt) / 60000);
    if (mins >= 1) {
      store.mutate((st) => { st.sanctuaryMinutes += mins; });
      const total = store.get().sanctuaryMinutes;
      const MILESTONES = { 60: "Your sixtieth quiet minute. An hour of stillness, gathered one breath at a time.", 100: "Your hundredth quiet minute. They were all real.", 250: "Two hundred and fifty quiet minutes. The sanctuary is a habit now.", 500: "Five hundred minutes of quiet. This is who you are these days." };
      for (const [t, msg] of Object.entries(MILESTONES)) {
        if (total >= Number(t) && claimMilestone("sanctuary-" + t)) { toast(msg); break; }
      }
    }
    breathStartedAt = null;
  };
  const startBtn = el("button", { class: "btn", onclick: () => {
    if (running) {
      running = false; stopBreath(); creditMinutes();
      word.textContent = "Well held"; count.textContent = "";
      ring.className = "breath-ring sky";
      startBtn.textContent = "Begin again";
    } else {
      running = true; startBtn.textContent = "Finish";
      breathStartedAt = Date.now();
      runPhase(0, breathStartedAt);
    }
  } }, "Begin");
  creditOnLeave = creditMinutes;

  const patternChips = Object.entries(BREATH_PATTERNS).map(([id, p]) =>
    el("button", {
      class: "chip" + (pattern === id ? " on" : ""),
      onclick: (e) => {
        pattern = id;
        e.target.closest(".chip-row").querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
        e.target.classList.add("on");
        count.textContent = p.note;
        howLine.textContent = p.how;
      },
    }, p.label));

  // ---------- soundscapes ----------
  const tiles = SOUNDSCAPES.map((sc) => {
    const state = el("div", { class: "s-state" }, playingId() === sc.id ? "playing" : "");
    const tile = el("button", { class: "sound-tile" + (playingId() === sc.id ? " playing" : ""), onclick: () => {
      if (playingId() === sc.id) {
        stopScape();
        tile.classList.remove("playing"); state.replaceChildren("");
      } else {
        playScape(sc);
        document.querySelectorAll(".sound-tile").forEach((t) => { t.classList.remove("playing"); t.querySelector(".s-state").replaceChildren(""); });
        tile.classList.add("playing");
        state.replaceChildren(el("span", { class: "eq" }, el("i"), el("i"), el("i")), " playing");
      }
    } },
      el("span", { class: "s-name" }, sc.name),
      el("span", { class: "s-sub" }, sc.sub),
      state,
    );
    return tile;
  });

  // ---------- inner-power prompt ----------
  const daySeed = todayISO().split("-").reduce((a, b) => a + Number(b), 0);
  const prompt = PROMPTS[daySeed % PROMPTS.length];
  const promptArea = el("textarea", { placeholder: "Write here, or speak it in the journal. Nobody sees this but you." });

  const echoCard = (() => {
    if (store.get().echoLast === todayISO()) return null;
    const today = new Date();
    const candidates = [];
    for (const j of store.get().journalIndex || []) {
      if (j.preview) candidates.push({ t: j.t, text: j.preview, kind: "journal" });
    }
    for (const c of store.get().checkins || []) {
      if (c.felt) candidates.push({ t: c.date + "T12:00:00", text: c.felt, kind: "check-in" });
      else if (c.held) candidates.push({ t: c.date + "T12:00:00", text: c.held, kind: "check-in" });
    }
    let best = null;
    for (const target of [30, 90, 365]) {
      for (const c of candidates) {
        const age = (today - new Date(c.t)) / 864e5;
        if (Math.abs(age - target) <= 4 && (!best || Math.abs(age - target) < best.diff)) {
          best = { ...c, diff: Math.abs(age - target), label: target === 30 ? "A month ago" : target === 90 ? "Three months ago" : "A year ago" };
        }
      }
      if (best) break;
    }
    if (!best) return null;
    return el("div", { class: "card flat" },
      el("span", { class: "eyebrow" }, "From your own hand"),
      el("p", { style: "font-family:var(--font-head);font-style:italic;margin:0.3rem 0" }, best.label + ", you wrote: “" + best.text + "”"),
      el("div", { class: "btn-row" },
        el("button", { class: "btn ghost small", onclick: () => navigate("#/journal") }, "Read it again"),
        el("button", { class: "link", onclick: (e) => { store.mutate((st) => { st.echoLast = todayISO(); }); e.target.closest(".card").remove(); } }, "Not today"),
      ),
    );
  })();

  // ---- Vespers: the day gets an ending ----
  const vespersCard = (() => {
    if (new Date().getHours() < 20) return null;
    if (store.get().vespersLast === todayISO()) return null;
    const ev = eveningPassageForToday(todayISO());
    const line = el("input", { type: "text", placeholder: "One good thing from today, however small" });
    return el("div", { class: "card", style: "background:linear-gradient(170deg, var(--surface-2), var(--surface))" },
      el("span", { class: "eyebrow" }, "Close the day"),
      el("p", { style: "font-family:var(--font-head);font-style:italic;margin:0.4rem 0" }, "“" + ev.text + "” · " + ev.ref),
      el("div", { class: "field" }, line),
      el("div", { class: "btn-row" },
        el("button", { class: "btn secondary small", onclick: async () => {
          const v = line.value.trim();
          if (v) {
            await addJournalEntry({ type: "text", text: v, tags: ["gratitude"] });
            store.mutate((st) => { st.journalIndex.unshift({ id: uid(), t: new Date().toISOString(), type: "text", preview: v.slice(0, 90), tags: ["gratitude"] }); });
          }
          store.mutate((st) => { st.vespersLast = todayISO(); });
          toast(v ? "Kept. Sleep well." : "Good night.");
          renderRecharge(main, navigate);
        } }, "Close the day"),
        el("button", { class: "btn ghost small", onclick: () => {
          const scape = SOUNDSCAPES.find((x) => x.id === "bowls");
          if (scape) playScape(scape);
          document.querySelector(".chip-row .chip:first-child")?.click();
          toast("Singing bowls on. Breathe toward sleep.");
        } }, "Breathe toward sleep"),
        voiceAvailable() && s.voiceOn ? el("button", { class: "link", onclick: () => speak(ev.text + ". " + ev.ref) }, "Listen") : null,
      ),
    );
  })();

  main.replaceChildren(
    ...(vespersCard ? [vespersCard] : []),
    ...(echoCard ? [echoCard] : []),
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "The sanctuary"),
      el("h1", {}, greet + (s.profile.name ? ", " + s.profile.name : "")),
      el("p", {}, "Ten quiet minutes that put energy back. Breath first, sound if you want it, one honest line if it comes.",
        listenAvailable() && voiceAvailable() ? el("button", { class: "link", style: "margin-left:0.5rem", onclick: openTalk }, "Talk to Harta") : null),
      el("p", { class: "tiny", style: "font-family:var(--font-head);font-style:italic;font-size:0.92rem;margin-top:0.5rem" },
        "“" + passage.text + "” · " + passage.ref,
        voiceAvailable() && s.voiceOn ? el("button", { class: "link", style: "margin-left:0.5rem", onclick: () => speak(passage.text + ". " + passage.ref) }, "Listen") : null),
    ),
    el("div", { class: "card" },
      el("div", { class: "card-title-row" }, el("h2", {}, "Breathe"),
        s.sanctuaryMinutes > 0 ? el("span", { class: "tag green" }, `${s.sanctuaryMinutes} quiet minutes so far`) : null),
      el("div", { class: "chip-row" }, patternChips),
      el("div", { class: "breath-stage" }, ring, count, howLine),
      el("div", { class: "btn-row", style: "justify-content:center" }, startBtn),
    ),
el("div", { class: "card" },
      el("h2", {}, "Sound"),
      ...SOUND_GROUPS.map(([gid, glabel]) => el("div", { style: "margin-bottom:0.8rem" },
        el("h3", { style: "font-family:var(--font-ui);font-size:0.74rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-3);margin-bottom:0.4rem" }, glabel),
        el("div", { class: "sound-grid" }, tiles.filter((t, i) => SOUNDSCAPES[i].group === gid)),
      )),
      el("p", { class: "tiny", style: "margin-top:0.7rem" }, el("button", { class: "link", onclick: () => openWhy("sound-calm") }, "Why this works, honestly")),
    ),
    el("div", { class: "card" },
      el("h2", {}, "For the state of an achiever"),
      el("p", { class: "muted" }, "Six ways to get to the state before the task: pre-decisions, rehearsal, self-coaching, movement, momentum and the reserve."),
      el("div", { class: "chip-row" },
        ...ACHIEVER_TECHNIQUES.map((t) => el("button", { class: "chip", onclick: () => openSteady(t) }, t.name))),
      el("p", { class: "tiny" }, ACHIEVER_NOTE),
    ),
    el("div", { class: "card prompt-card" },
      el("h2", {}, "For the inner power"),
      el("blockquote", {}, prompt),
      el("div", { class: "field" }, promptArea),
      (() => {
        // three honest ways in: type it, speak it, or write on paper and photograph the page
        const paperInput = el("input", { type: "file", accept: "image/*", capture: "environment", style: "display:none" });
        paperInput.addEventListener("change", async () => {
          const f = paperInput.files[0];
          if (!f) return;
          await addJournalEntry({ type: "photo", blob: f, text: "Written by hand", tags: ["inner-power", "paper"], prompt });
          store.mutate((st) => { st.journalIndex.unshift({ id: uid(), t: new Date().toISOString(), type: "photo", preview: "A handwritten page", tags: ["inner-power"] }); });
          toast("Your page is kept, handwriting and all.");
        });
        let rec = null, recChunks = [];
        const recLabel = el("span", {}, "Speak it");
        const recBtn = el("button", { class: "btn ghost small", onclick: async () => {
          if (rec && rec.state === "recording") { rec.stop(); return; }
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recChunks = [];
            rec = new MediaRecorder(stream);
            rec.ondataavailable = (e) => recChunks.push(e.data);
            rec.onstop = async () => {
              stream.getTracks().forEach((t) => t.stop());
              const blob = new Blob(recChunks, { type: rec.mimeType || "audio/webm" });
              await addJournalEntry({ type: "audio", blob, text: "", tags: ["inner-power", "voice"], prompt });
              store.mutate((st) => { st.journalIndex.unshift({ id: uid(), t: new Date().toISOString(), type: "audio", preview: "A voice note", tags: ["inner-power"] }); });
              recLabel.textContent = "Speak it";
              recBtn.classList.remove("danger");
              toast("Voice note kept in your journal.");
            };
            rec.start();
            recLabel.replaceChildren(el("span", { class: "record-dot" }), " Recording… tap to keep");
            recBtn.classList.add("danger");
          } catch { toast("Microphone permission was declined"); }
        } }, icon("mic", 15), recLabel);
        return el("div", { class: "btn-row" },
          el("button", { class: "btn secondary small", onclick: async () => {
            const text = promptArea.value.trim();
            if (!text) { toast("Nothing written yet"); return; }
            await addJournalEntry({ type: "text", text, tags: ["inner-power"], prompt });
            store.mutate((st) => { st.journalIndex.unshift({ id: uid(), t: new Date().toISOString(), type: "text", preview: text.slice(0, 90), tags: ["inner-power"] }); });
            promptArea.value = "";
            toast("Kept in your journal");
          } }, "Keep this"),
          recBtn,
          el("button", { class: "btn ghost small", onclick: () => paperInput.click() }, "Photograph the page"),
          voiceAvailable() && s.voiceOn ? el("button", { class: "link", onclick: () => speak(prompt) }, "Read the prompt to me") : null,
          paperInput,
        );
      })(),
      el("p", { class: "tiny" }, "Prompts follow one idea: the hardest moments are also the clearest. What they showed you is yours to keep."),
    ),
    el("div", { class: "card" },
      el("h2", {}, "For the hard moments"),
      el("p", { class: "muted" }, "Pain flares and big feelings have body-first brakes. Seven tools, each honest about its evidence, none longer than a minute to learn."),
      el("div", { class: "chip-row" },
        ...STEADY_TECHNIQUES.map((t) => el("button", { class: "chip", onclick: () => openSteady(t) }, t.name))),
      el("p", { class: "tiny" }, STEADY_NOTE),
    ),
        el("div", { class: "card flat" },
      el("h3", {}, "Then, the details"),
      (() => {
        const dk = ["mon","tue","wed","thu","fri","sat","sun"][(new Date().getDay() + 6) % 7];
        const rid = store.get().week?.days[dk]?.recipeId;
        const recipes = store.get().week ? null : null;
        return el("p", { class: "muted" }, rid
          ? "Tonight: a dinner is already chosen and waiting on Today. The week's plan and your numbers are there too, and none of it is urgent. Batteries first."
          : "Tonight's dinner, the week's plan and your numbers are all waiting, and none of them are urgent. Batteries first.");
      })(),
      el("div", { class: "btn-row" },
        el("button", { class: "btn secondary small", onclick: () => navigate("#/today") }, "Today"),
        el("button", { class: "btn ghost small", onclick: () => navigate("#/plan") }, "The plan"),
        el("button", { class: "btn ghost small", onclick: () => navigate("#/signals") }, "My signals"),
      ),
    ),
  );
}

const STRENGTH_LABEL = { strong: ["evidence-strong", "strong evidence"], emerging: ["evidence-emerging", "emerging evidence"], thin: ["evidence-thin", "practice wisdom"] };
function openSteady(t) {
  const [cls, label] = STRENGTH_LABEL[t.strength];
  const readable = t.name + ". For " + t.when + ". " + t.steps.join(" ") + " " + t.why;
  openModal(
    el("h2", {}, t.name),
    el("span", { class: "tag " + cls }, label),
    el("p", { class: "tiny", style: "margin-top:0.4rem" }, "For: " + t.when),
    el("ol", { class: "method", style: "margin-top:0.6rem" }, t.steps.map((st) => el("li", {}, st))),
    el("p", { class: "muted", style: "margin-top:0.6rem" }, t.why),
    el("div", { class: "source-line" }, "Source: " + t.source + "."),
    voiceAvailable() && store.get().voiceOn ? el("button", { class: "btn secondary small", style: "margin-top:0.7rem", onclick: () => speak(readable) }, "Read it to me") : null,
  );
}

export function leaveRecharge() { stopBreath(); creditOnLeave?.(); creditOnLeave = null; stopSpeaking(); }
