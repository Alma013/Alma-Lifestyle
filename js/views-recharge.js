// Alma · the sanctuary: daily arrival, breath, sound, and the inner-power prompts.
// This is the part of the app that recharges rather than organises.

import { el, icon, toast, openModal, closeModal } from "./ui.js";
import { store, todayISO, uid } from "./store.js";
import { passageForToday, PROMPTS, SOUNDSCAPES, SOUND_HONESTY } from "./data2.js";
import { playScape, stopScape, playingId, chime } from "./audio.js";
import { addJournalEntry } from "./idb.js";

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
    el("button", { class: "btn", onclick: dismiss }, "Step in"),
    el("button", { class: "link a-skip", onclick: dismiss }, "Skip today"),
  );
  function dismiss() {
    store.mutate((st) => { st.arrivalLast = today; });
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), 480);
  }
  document.body.append(overlay);
}

// ---------- breathing ----------
const BREATH_PATTERNS = {
  calm: { label: "Slow calm", phases: [["Breathe in", 4], ["Hold", 2], ["Breathe out", 6]], note: "A longer exhale nudges the nervous system toward rest. Slow breathing at around six breaths a minute is one of the better-studied relaxation practices." },
  box: { label: "Box", phases: [["Breathe in", 4], ["Hold", 4], ["Breathe out", 4], ["Hold", 4]], note: "Even sides, like tracing a square. Used everywhere from clinics to cockpits for steadying attention." },
  "478": { label: "4-7-8", phases: [["Breathe in", 4], ["Hold", 7], ["Breathe out", 8]], note: "A stronger pattern for winding down toward sleep. If holding feels strained, the gentle pattern is the better choice tonight." },
};

let breathTimer = null;
function stopBreath() {
  if (breathTimer) { clearInterval(breathTimer.iv); clearTimeout(breathTimer.to); breathTimer = null; }
}

export function renderRecharge(main) {
  stopBreath();
  const s = store.get();
  let pattern = "calm";
  let running = false;
  let minutes = 0;

  const word = el("div", { class: "breath-word" }, "Ready");
  const count = el("div", { class: "breath-count" }, "Three minutes is a real reset. One is still real.");
  const ring = el("div", { class: "breath-ring" }, word);

  function runPhase(i, startedAt) {
    const phases = BREATH_PATTERNS[pattern].phases;
    const [label, secs] = phases[i % phases.length];
    word.textContent = label;
    ring.style.setProperty("--breath-dur", secs + "s");
    ring.className = "breath-ring " + (label.includes("in") ? "inhale" : label.includes("out") ? "exhale" : "hold");
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

  const startBtn = el("button", { class: "btn", onclick: () => {
    if (running) {
      running = false; stopBreath();
      word.textContent = "Well held"; count.textContent = "";
      ring.className = "breath-ring";
      startBtn.textContent = "Begin again";
      store.mutate((st) => { st.sanctuaryMinutes += Math.max(1, Math.round(minutes)); });
    } else {
      running = true; startBtn.textContent = "Finish";
      runPhase(0, Date.now());
    }
  } }, "Begin");

  const patternChips = Object.entries(BREATH_PATTERNS).map(([id, p]) =>
    el("button", {
      class: "chip" + (pattern === id ? " on" : ""),
      onclick: (e) => {
        pattern = id;
        e.target.closest(".chip-row").querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
        e.target.classList.add("on");
        count.textContent = p.note;
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

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "The sanctuary"),
      el("h1", {}, "Recharge"),
      el("p", {}, "Ten quiet minutes that put energy back. Breath first, sound if you want it, one honest line if it comes."),
    ),
    el("div", { class: "card" },
      el("div", { class: "card-title-row" }, el("h2", {}, "Breathe"),
        s.sanctuaryMinutes > 0 ? el("span", { class: "tag green" }, `${s.sanctuaryMinutes} quiet minutes so far`) : null),
      el("div", { class: "chip-row" }, patternChips),
      el("div", { class: "breath-stage" }, ring, count),
      el("div", { class: "btn-row", style: "justify-content:center" }, startBtn),
    ),
    el("div", { class: "card" },
      el("h2", {}, "Sound"),
      el("div", { class: "sound-grid" }, tiles),
      el("p", { class: "tiny", style: "margin-top:0.7rem" }, SOUND_HONESTY),
    ),
    el("div", { class: "card prompt-card" },
      el("h2", {}, "For the inner power"),
      el("blockquote", {}, prompt),
      el("div", { class: "field" }, promptArea),
      el("div", { class: "btn-row" },
        el("button", { class: "btn secondary small", onclick: async () => {
          const text = promptArea.value.trim();
          if (!text) { toast("Nothing written yet"); return; }
          await addJournalEntry({ type: "text", text, tags: ["inner-power"], prompt });
          store.mutate((st) => { st.journalIndex.unshift({ id: uid(), t: new Date().toISOString(), type: "text", preview: text.slice(0, 90), tags: ["inner-power"] }); });
          promptArea.value = "";
          toast("Kept in your journal");
        } }, "Keep this"),
      ),
      el("p", { class: "tiny" }, "Prompts follow one idea: the hardest moments are also the clearest. What they showed you is yours to keep."),
    ),
  );
}

export function leaveRecharge() { stopBreath(); }
