// Harta · talk: hold the mic, say it, and Harta answers in its reading voice.
// Understanding is rule-based and on-device; it is honest about its limits.

import { el, openModal, closeModal, toast, icon } from "./ui.js";
import { store, dayKeyToday, recipeById, eatingWindow, fmtClock, toggleHabit, todayISO } from "./store.js";
import { passageForToday, COUNSEL_PLAYS } from "./data2.js";
import { listenOnce, listenAvailable } from "./voice.js";

function answer(text) {
  const q = text.toLowerCase();
  const s = store.get();
  if (!q.trim()) return "I did not catch that. Try asking what is for dinner, or say: read me the passage.";
  if (/dinner|tonight|cook|eat tonight/.test(q)) {
    const r = s.week?.days[dayKeyToday()]?.recipeId ? recipeById(s.week.days[dayKeyToday()].recipeId) : null;
    return r ? `Tonight is ${r.name}. ${r.total} minutes, serves ${r.serves}. ${r.why}` : "Nothing is planned tonight. Open the plan and I will help you choose.";
  }
  if (/breakfast|lunch/.test(q)) {
    const slot = s.week?.days[dayKeyToday()];
    const which = /breakfast/.test(q) ? slot?.bf : slot?.lunch;
    const r = which ? recipeById(which) : null;
    return r ? `${/breakfast/.test(q) ? "Breakfast" : "Lunch"} today is ${r.name}.` : "That meal is not planned. Turn on breakfast and lunch planning in Settings if you would like it decided for you.";
  }
  if (/passage|verse|word for today|psalm/.test(q)) {
    const p = passageForToday(todayISO());
    return p.text + ". " + p.ref + ".";
  }
  if (/window|when can i eat|fast/.test(q)) {
    const w = eatingWindow();
    if (!w) return "No eating window is set. Choose a fasting rhythm on the fasting page and I will keep the clock.";
    if (w.mode === "fasting") return w.canEat ? "The window is open. You can eat, gently, whenever you choose." : `The kitchen reopens at ${fmtClock(w.opens)}. ${Math.floor(w.minsToOpen / 60)} hours and ${w.minsToOpen % 60} minutes to go. Water and plain tea are welcome company.`;
    if (w.mode === "open") return `The kitchen closes at ${fmtClock(w.closes)} tonight.`;
    return w.canEat ? "The kitchen can reopen whenever you choose." : `The kitchen reopens at ${fmtClock(w.opens)}.`;
  }
  if (/walked|walk today|moved|exercise done/.test(q)) { toggleHabit(todayISO(), "move"); return "Noted: you moved today. Well done."; }
  if (/drank|water/.test(q)) { toggleHabit(todayISO(), "water"); return "Water first, noted."; }
  if (/child|kid|son|daughter/.test(q) && /conflict|fight|tantrum|angry|meltdown|yell/.test(q)) {
    const p = COUNSEL_PLAYS.child; return p.principle + " First move: " + p.steps[0] + " The full playbook is in the counsel.";
  }
  if (/partner|husband|wife/.test(q) && /fight|conflict|argu/.test(q)) {
    const p = COUNSEL_PLAYS.partner; return p.principle + " Start soft: " + p.say[0] + " The full playbook is in the counsel.";
  }
  if (/work|boss|colleague|manager/.test(q) && /conflict|difficult|problem|argu/.test(q)) {
    const p = COUNSEL_PLAYS.work; return p.principle + " The full playbook is waiting in the counsel.";
  }
  if (/breathe|breathing|calm me/.test(q)) return "Go to Recharge and press Begin. In through the nose for four, out for six. I will be there.";
  if (/thank/.test(q)) return "Always. Know first, then choose.";
  if (/hello|hi harta|good (morning|evening|night)/.test(q)) return "Hello. Ask me about tonight's dinner, your eating window, the day's passage, or a hard moment.";
  return "I keep to simple things for now: dinner, breakfast, the eating window, the passage, logging a walk or water, and first moves for hard moments. For everything deeper, the counsel and the journal are one tap away.";
}

export function openTalk() {
  if (!listenAvailable()) {
    toast("This device does not offer speech in the browser"); return;
  }
  let rec = null;
  const transcript = el("p", { class: "muted", style: "min-height:2.4rem;font-style:italic" }, "Hold the button and speak.");
  const reply = el("p", { style: "min-height:2.4rem" }, "");
  const holdBtn = el("button", { class: "btn", style: "width:100%" }, icon("mic", 18), " Hold to talk");
  const start = (e) => {
    e.preventDefault();
    reply.textContent = "";
    transcript.textContent = "Listening…";
    rec = listenOnce({
      onText: (fin, interim) => { transcript.textContent = (fin + " " + interim).trim() || "Listening…"; },
      onEnd: (finalText) => {
        transcript.textContent = finalText ? "“" + finalText + "”" : "I did not catch that.";
        const a = answer(finalText);
        reply.textContent = a;
      },
    });
  };
  const stop = () => { try { rec?.stop(); } catch {} };
  holdBtn.addEventListener("pointerdown", start);
  holdBtn.addEventListener("pointerup", stop);
  holdBtn.addEventListener("pointerleave", stop);
  openModal(
    { onClose: () => { stop(); } },
    el("h2", {}, "Talk to Harta"),
    el("p", { class: "tiny" }, "Ask about tonight's dinner, the eating window, today's passage, log a walk or water, or name a hard moment. One honest note: listening uses your device's speech service, which on most phones processes the audio through the platform; if that matters today, type instead."),
    holdBtn,
    transcript,
    reply,
  );
}
