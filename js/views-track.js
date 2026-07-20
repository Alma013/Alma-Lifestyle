// Alma · views: track (habits, check-in, progress), learn, more (care, settings)

import { el, icon, openModal, closeModal, toast, sparkline } from "./ui.js";
import { WHY_CARDS, NUDGES, HABITS } from "./data.js";
import { WHY_CARDS_V2, EXPERTS, METHOD_CARD, LI_TABLE } from "./data2.js";
import { exportJournal, importJournal } from "./idb.js";
import {
  store, eligibleRecipes, DAY_KEYS, DAY_NAMES, todayISO, mondayOf, dateOfDayKey, fmtDay,
  weekHabitSummary, toggleHabit, hashPin, uid,
} from "./store.js";

// ---------- track ----------
export function renderTrack(main, navigate) {
  const s = store.get();
  const weekStart = mondayOf();
  const summary = weekHabitSummary(weekStart);
  const todayIdx = DAY_KEYS.indexOf(DAY_KEYS[(new Date().getDay() + 6) % 7]);

  const habitBlocks = HABITS.map((h) => {
    const whyCardId = { move: "movement", sleep: "sleep", food: "variety", water: "hydration" }[h.id];
    return el("div", { class: "habit-block" },
      el("div", { class: "habit-head" }, icon(h.icon, 20), el("h3", {}, h.label),
        el("button", { class: "link why-link", onclick: () => openWhy(whyCardId) }, "why?")),
      el("div", { class: "dot-row" },
        DAY_KEYS.map((dk, i) => {
          const iso = dateOfDayKey(weekStart, dk);
          const on = !!summary[dk][h.id];
          const future = i > todayIdx;
          const b = el("button", {
            class: (on ? "on" : "") + (future ? " future" : ""),
            "aria-label": `${h.label}, ${DAY_NAMES[dk]}`,
            "aria-pressed": on ? "true" : "false",
            disabled: future,
            onclick: () => { toggleHabit(iso, h.id); renderTrack(main, navigate); },
          });
          return el("div", { class: "dot-cell" }, b, DAY_NAMES[dk].slice(0, 2));
        })),
    );
  });

  const lastCheckin = s.checkins[0];
  const due = !lastCheckin || (Date.now() - new Date(lastCheckin.date) > 6 * 864e5);

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "Week of " + fmtDay(weekStart)),
      el("h1", {}, "The rhythm"),
      el("p", {}, "Four quiet habits, tapped when they happen. Patterns, never streaks: a blank day is information, not a failure."),
    ),
    el("div", { class: "card" }, habitBlocks),
    el("div", { class: "card" },
      el("div", { class: "card-title-row" }, el("h2", {}, "Weekly check-in"),
        lastCheckin && el("span", { class: "tiny" }, "last: " + fmtDay(lastCheckin.date))),
      el("p", { class: "muted" }, due
        ? "Ten minutes, once a week. It starts with what held, because that is what keeps the whole thing alive."
        : "Done for this week. Come back when the week turns over, or any time something shifts."),
      el("button", { class: "btn" + (due ? "" : " secondary"), onclick: () => runCheckin(main, navigate) }, due ? "Start check-in" : "Check in again"),
    ),
    renderProgress(s),
  );
}

function renderProgress(s) {
  const entries = [...s.checkins].reverse().slice(-12); // oldest → newest
  const series = (key) => entries.map((c) => ({ x: c.date, y: c[key] ?? null }));
  const card = (title, key) => {
    const latest = entries.length ? entries[entries.length - 1][key] : null;
    return el("div", { class: "card spark-card" },
      el("div", { class: "spark-head" }, el("h3", {}, title), el("span", { class: "cur" }, latest ?? "–")),
      sparkline(series(key)),
    );
  };
  return el("div", {},
    el("h2", { style: "margin-top:1.4rem" }, "How it's felt"),
    el("p", { class: "muted" }, "Rated 1 to 5 at each check-in. No weight here, by design: energy is the honest scoreboard. ",
      el("button", { class: "link", onclick: () => openWhy("weight-free") }, "Why no weight?")),
    card("Energy", "energy"),
    card("Sleep", "sleep"),
    card("Mood", "mood"),
    entries.length
      ? el("div", { class: "card flat" },
          el("h3", {}, "In your words"),
          entries.slice(-4).reverse().map((c) =>
            c.felt ? el("p", { class: "muted" }, el("strong", {}, fmtDay(c.date) + ": "), c.felt) : null))
      : null,
  );
}

// ---------- weekly check-in ritual ----------
function runCheckin(main, navigate) {
  const s = store.get();
  const draft = { date: todayISO(), held: "", energy: 3, sleep: 3, mood: 3, felt: "", kind: "" };
  let step = 0;

  const weekStart = mondayOf();
  const summary = weekHabitSummary(weekStart);
  const heldFacts = [];
  for (const h of HABITS) {
    const n = DAY_KEYS.filter((dk) => summary[dk][h.id]).length;
    if (n > 0) heldFacts.push(`${h.label.toLowerCase()}: ${n} day${n > 1 ? "s" : ""}`);
  }

  const slider = (key, label) => {
    const val = el("span", { class: "slider-val" }, String(draft[key]));
    const input = el("input", { type: "range", min: 1, max: 5, step: 1, value: draft[key], "aria-label": label });
    input.addEventListener("input", () => { draft[key] = Number(input.value); val.textContent = input.value; });
    return el("div", { class: "field" }, el("label", {}, label), el("div", { class: "slider-row" }, input, val));
  };

  const steps = [
    () => el("div", {},
      el("h2", {}, "First: what held this week?"),
      el("p", { class: "muted" }, heldFacts.length
        ? "The taps say: " + heldFacts.join(", ") + ". Whatever else happened, that happened too."
        : "The trackers are quiet this week, which is fine. Something still held, even if it was just getting to today."),
      el("div", { class: "field" }, el("label", {}, "Name it, however small"),
        el("textarea", { placeholder: "Three dinners from the plan. A walk on Tuesday. Saying no to something.", oninput: (e) => (draft.held = e.target.value) })),
    ),
    () => el("div", {},
      el("h2", {}, "How did it feel?"),
      slider("energy", "Energy"), slider("sleep", "Sleep"), slider("mood", "Mood"),
      el("div", { class: "field" }, el("label", {}, "What felt different this week?"),
        el("textarea", { placeholder: "The 3pm slump only showed up once…", oninput: (e) => (draft.felt = e.target.value) })),
    ),
    () => {
      const chips = NUDGES.map((n) => {
        const c = el("button", {
          class: "chip" + (store.get().activeNudge === n.id ? " on" : ""),
          title: n.why,
          onclick: () => {
            store.update({ activeNudge: store.get().activeNudge === n.id ? null : n.id });
            paint();
          },
        }, n.text);
        return c;
      });
      return el("div", {},
        el("h2", {}, "One nudge for next week"),
        el("p", { class: "muted" }, "One, not five. Pick the one that fits the week you're actually about to have, or none at all."),
        el("div", { class: "chip-row" }, chips),
      );
    },
    () => el("div", {},
      el("h2", {}, "Close with one kind thing"),
      el("p", { class: "muted" }, "One sentence: the single kindest thing next week can do for your energy."),
      el("div", { class: "field" },
        el("textarea", { placeholder: "Book the Thursday walk before the week eats it.", oninput: (e) => (draft.kind = e.target.value) })),
    ),
  ];

  function paint() {
    const dots = steps.map((_, i) => el("span", { class: i <= step ? "on" : "" }));
    main.replaceChildren(
      el("div", { class: "page-head center" }, el("span", { class: "eyebrow" }, "Weekly check-in")),
      el("div", { class: "step-dots" }, dots),
      el("div", { class: "card checkin-step" }, steps[step]()),
      el("div", { class: "btn-row", style: "justify-content:space-between" },
        el("button", { class: "btn ghost", onclick: () => { step ? (step--, paint()) : renderTrack(main, navigate); } }, "Back"),
        step < steps.length - 1
          ? el("button", { class: "btn", onclick: () => { step++; paint(); } }, "Next")
          : el("button", {
              class: "btn",
              onclick: () => {
                store.mutate((st) => { st.checkins.unshift(draft); st.checkins = st.checkins.slice(0, 60); });
                toast("Check-in saved. Well held.");
                renderTrack(main, navigate);
              },
            }, "Finish"),
      ),
    );
  }
  paint();
}

// ---------- learn ----------
const STRENGTH_TAG = {
  strong: ["evidence-strong", "strong evidence"],
  emerging: ["evidence-emerging", "emerging evidence"],
  thin: ["evidence-thin", "thin evidence"],
  contested: ["evidence-contested", "research-stage, contested"],
};

export function renderLearn(main) {
  const allCards = [...WHY_CARDS, ...WHY_CARDS_V2];
  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "Know first, then choose"),
      el("h1", {}, "The why"),
      el("p", {}, "Every rule this app runs on, with its source and an honest label for how solid the science is. Read what interests you; ignore the rest."),
    ),
    el("div", { class: "card" },
      el("h2", {}, METHOD_CARD.title),
      ...METHOD_CARD.steps.map(([t, b], i) => el("p", { class: "muted", style: "font-size:0.9rem" },
        el("strong", {}, (i + 1) + ". " + t + ". "), b)),
    ),
    el("h2", { style: "margin:1.2rem 0 0.6rem" }, "The voices behind the choices"),
    el("p", { class: "muted", style: "margin-bottom:0.8rem" }, "Five people whose ideas shape this app, each with what to take and what to hold lightly. Trust is built by labelling both."),
    ...EXPERTS.map((x) => {
      const [cls, label] = STRENGTH_TAG[x.strength];
      return el("div", { class: "card expert-card" },
        el("div", { class: "expert-mono" }, x.mono),
        el("div", {},
          el("div", { class: "card-title-row" }, el("h3", {}, x.name), el("span", { class: "tag " + cls }, label)),
          el("p", { class: "tiny", style: "margin:0 0 0.4rem" }, x.field),
          el("p", { class: "muted", style: "font-size:0.9rem" }, x.idea),
          el("p", { class: "muted", style: "font-size:0.9rem" }, el("strong", {}, "Take: "), x.take),
          el("p", { class: "muted", style: "font-size:0.9rem" }, el("strong", {}, "Hold lightly: "), x.hold),
          el("div", { class: "source-line" }, "Source: " + x.source + "."),
        ),
      );
    }),
    el("div", { class: "card" },
      el("h2", {}, LI_TABLE.title),
      el("p", { class: "muted", style: "font-size:0.9rem" }, LI_TABLE.intro),
      el("div", { style: "overflow-x:auto" },
        el("table", { style: "width:100%;border-collapse:collapse;font-size:0.86rem;min-width:34rem" },
          el("thead", {}, el("tr", {},
            ...["Defence system", "What it does", "Foods that feed it"].map((h) =>
              el("th", { style: "text-align:left;padding:0.45rem 0.6rem;border-bottom:1px solid var(--line);color:var(--ink-3);font-weight:600;font-size:0.74rem;letter-spacing:0.06em;text-transform:uppercase" }, h)))),
          el("tbody", {},
            ...LI_TABLE.systems.map(([sys, what, foods]) =>
              el("tr", {},
                el("td", { style: "padding:0.55rem 0.6rem;border-bottom:1px dashed var(--line-soft);font-family:var(--font-head);white-space:nowrap" }, sys),
                el("td", { style: "padding:0.55rem 0.6rem;border-bottom:1px dashed var(--line-soft);color:var(--ink-2)" }, what),
                el("td", { style: "padding:0.55rem 0.6rem;border-bottom:1px dashed var(--line-soft)" }, foods.join(", ")),
              ))))),
      el("div", { class: "source-line" }, "Source: " + LI_TABLE.source + "."),
    ),
    el("h2", { style: "margin:1.2rem 0 0.6rem" }, "The evidence cards"),
    ...allCards.map((c) => {
      const [cls, label] = STRENGTH_TAG[c.strength];
      return el("button", { class: "card learn-card", style: "width:100%;text-align:left", onclick: () => openWhy(c.id) },
        el("div", { class: "card-title-row" }, el("h3", {}, c.title), el("span", { class: "tag " + cls }, label)),
        el("p", { class: "one-liner" }, c.oneLiner),
      );
    }),
    el("p", { class: "tiny center" }, "Every card exists so you can decide from evidence, not marketing. And because Alma never plays doctor, you can trust it to hand the medical questions to yours, better phrased."),
  );
}

export function openWhy(id) {
  const c = WHY_CARDS.find((x) => x.id === id) || WHY_CARDS_V2.find((x) => x.id === id);
  if (!c) return;
  const [cls, label] = STRENGTH_TAG[c.strength];
  openModal(
    el("h2", {}, c.title),
    el("span", { class: "tag " + cls }, label),
    el("p", { style: "margin-top:0.8rem" }, c.body),
    el("div", { class: "notice", style: "margin-top:0.6rem" }, el("strong", {}, "Try: "), c.action),
    el("div", { class: "source-line" }, "Source: " + c.source + "."),
  );
}

// ---------- more: care + settings ----------
export function renderMore(main, navigate) {
  const s = store.get();
  const item = (hash, title, sub, ic) =>
    el("button", { class: "card learn-card", style: "width:100%;text-align:left", onclick: () => navigate(hash) },
      el("div", { class: "card-title-row" }, el("h3", {}, title), ic ? icon(ic, 18) : null),
      el("p", { class: "one-liner" }, sub),
    );
  main.replaceChildren(
    el("div", { class: "page-head" }, el("h1", {}, "More")),
    item("#/learn", "The why", "Every rule with its source: the method, the five voices, the evidence cards.", "learn"),
    item("#/journal", "Journal", "Photos, voice notes and words, kept for the future you.", "camera"),
    item("#/capsule", "The capsule", "Letters sealed for later: your print, for you and yours.", "mail"),
    item("#/fasting", "Fasting", "Gentle eating windows, honest safety, a timer that never nags.", "hourglass"),
    item("#/signals", "Signals", "Glucose, ketones and labs, charted kindly. GKI and Dr Boz ratio included.", "pulse"),
    item("#/care", "Care calendar", "Appointments, check-ups and your question list for the doctor. Private, optional PIN.", "lock"),
    item("#/settings", "Settings and data", "Way of eating, exclusions, household, backup, and the promises this app makes."),
    el("div", { class: "card flat" },
      el("h3", {}, "About Alma"),
      el("p", { class: "muted" }, "Built by someone who learned the hard way that the best time to care about your health is before you have to. Everything here follows one idea: know first, then choose."),
      el("p", { class: "tiny" }, "Private like a paper journal, useful like an app: everything stays on this device, so it cannot be leaked, sold or fed to an ad machine. Medical decisions stay with your doctor, which is exactly why you can relax here."),
    ),
  );
}

// ---------- care ----------
let careUnlocked = false;

export function renderCareGate(main, navigate) {
  const s = store.get();
  if (!s.care.pinHash || careUnlocked) return renderCare(main, navigate);
  const input = el("input", { type: "password", inputmode: "numeric", maxlength: 4, placeholder: "PIN", autocomplete: "off" });
  const tryUnlock = async () => {
    if ((await hashPin(input.value)) === s.care.pinHash) { careUnlocked = true; renderCare(main, navigate); }
    else { toast("That PIN doesn't match"); input.value = ""; }
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  main.replaceChildren(
    el("div", { class: "onb" },
      el("h2", { class: "center" }, "Care calendar"),
      el("p", { class: "muted center" }, "This area is PIN protected."),
      el("div", { class: "field" }, input),
      el("button", { class: "btn", style: "width:100%", onclick: tryUnlock }, "Unlock"),
    ),
  );
}

function renderCare(main, navigate) {
  const s = store.get();
  const upcoming = [...s.care.appointments].filter((a) => !a.done).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const past = s.care.visits.slice(0, 6);

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "Private"),
      el("h1", {}, "Care calendar"),
      el("p", {}, "Staying on top of check-ups is prevention too. This page keeps the calendar and helps you arrive with good questions; what things mean is always the doctor's job."),
    ),
    el("div", { class: "card" },
      el("div", { class: "card-title-row" }, el("h2", {}, "Coming up"),
        el("button", { class: "link", onclick: () => editAppointment(null, main, navigate) }, "Add")),
      upcoming.length
        ? upcoming.map((a) => {
            const overdue = a.date && a.date < todayISO();
            return el("div", { class: "appt" },
              el("span", { class: "when" + (overdue ? " due" : "") }, a.date ? fmtDay(a.date) : "no date"),
              el("span", {}, el("strong", {}, a.what), a.who ? el("span", { class: "muted" }, " · " + a.who) : null),
              el("div", { class: "btn-row" },
                el("button", { class: "btn ghost small", onclick: () => editAppointment(a, main, navigate) }, "Edit"),
                el("button", { class: "btn secondary small", onclick: () => recordVisit(a, main, navigate) }, "Record visit")),
            );
          })
        : el("p", { class: "muted" }, "Nothing booked. Is anything due? Screening rounds and an annual GP visit are worth asking about."),
    ),
    el("div", { class: "card" },
      el("div", { class: "card-title-row" }, el("h2", {}, "Questions for the doctor")),
      el("p", { class: "tiny" }, "Anything you've wondered between visits. Walk in with the list; walk out with answers."),
      s.care.questions.filter((q) => !q.done).map((q) =>
        el("div", { class: "gitem" },
          (() => { const b = el("input", { type: "checkbox" }); b.addEventListener("change", () => { store.mutate((st) => { const qq = st.care.questions.find((x) => x.id === q.id); if (qq) qq.done = true; }); renderCare(main, navigate); }); return b; })(),
          el("label", {}, q.text))),
      (() => {
        const inp = el("input", { type: "text", placeholder: "e.g. Am I due for any screening this year?" });
        const add = () => { const v = inp.value.trim(); if (!v) return; store.mutate((st) => st.care.questions.unshift({ id: uid(), text: v, done: false })); renderCare(main, navigate); };
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });
        return el("div", { style: "margin-top:0.6rem" }, el("div", { class: "field" }, inp), el("button", { class: "btn small secondary", onclick: add }, "Add question"));
      })(),
    ),
    ...(past.length
      ? [el("div", { class: "card flat" },
          el("h2", {}, "Visit notes"),
          past.map((v) => el("div", { style: "margin-bottom:0.7rem" },
            el("strong", {}, fmtDay(v.date) + " · " + v.appt),
            el("p", { class: "muted", style: "margin:0.15rem 0" }, v.notes || "(no notes)"),
            v.next && el("p", { class: "tiny" }, "Next: " + v.next))))]
      : []),
    el("div", { class: "btn-row" },
      el("button", { class: "btn ghost small", onclick: () => setupPin(main, navigate) }, icon("lock", 15), s.care.pinHash ? "Change PIN" : "Add a PIN"),
    ),
  );
}

function editAppointment(appt, main, navigate) {
  const what = el("input", { type: "text", value: appt?.what || "", placeholder: "e.g. Annual GP check-up" });
  const who = el("input", { type: "text", value: appt?.who || "", placeholder: "e.g. Dr…, clinic (optional)" });
  const date = el("input", { type: "date", value: appt?.date || "" });
  openModal(
    el("h2", {}, appt ? "Edit appointment" : "New appointment"),
    el("div", { class: "field" }, el("label", {}, "What"), what),
    el("div", { class: "field" }, el("label", {}, "With"), who),
    el("div", { class: "field" }, el("label", {}, "When"), date),
    el("div", { class: "btn-row" },
      el("button", {
        class: "btn",
        onclick: () => {
          if (!what.value.trim()) return toast("Give it a name");
          store.mutate((st) => {
            if (appt) { const a = st.care.appointments.find((x) => x.id === appt.id); Object.assign(a, { what: what.value.trim(), who: who.value.trim(), date: date.value }); }
            else st.care.appointments.push({ id: uid(), what: what.value.trim(), who: who.value.trim(), date: date.value, done: false });
          });
          closeModal(); renderCare(main, navigate);
        },
      }, "Save"),
      appt && el("button", {
        class: "btn danger small",
        onclick: () => { store.mutate((st) => { st.care.appointments = st.care.appointments.filter((x) => x.id !== appt.id); }); closeModal(); renderCare(main, navigate); },
      }, "Delete"),
    ),
  );
}

function recordVisit(appt, main, navigate) {
  const notes = el("textarea", { placeholder: "What was said, in the doctor's words. What you want to remember." });
  const next = el("input", { type: "text", placeholder: "Next step, if any (e.g. bloods in 6 months)" });
  openModal(
    el("h2", {}, "Record: " + appt.what),
    el("p", { class: "tiny" }, "Write what was said, not what it might mean. Interpretation stays with the professionals."),
    el("div", { class: "field" }, el("label", {}, "Notes"), notes),
    el("div", { class: "field" }, el("label", {}, "Next step"), next),
    el("button", {
      class: "btn",
      onclick: () => {
        store.mutate((st) => {
          st.care.visits.unshift({ id: uid(), date: todayISO(), appt: appt.what, notes: notes.value.trim(), next: next.value.trim() });
          const a = st.care.appointments.find((x) => x.id === appt.id);
          if (a) a.done = true;
        });
        closeModal(); renderCare(main, navigate); toast("Visit recorded");
      },
    }, "Save visit"),
  );
}

function setupPin(main, navigate) {
  const pin = el("input", { type: "password", inputmode: "numeric", maxlength: 4, placeholder: "4 digits", autocomplete: "off" });
  openModal(
    el("h2", {}, "Care calendar PIN"),
    el("p", { class: "muted" }, "A light lock for shared devices. It protects this page only. Leave empty and save to remove the PIN."),
    el("div", { class: "field" }, pin),
    el("button", {
      class: "btn",
      onclick: async () => {
        const v = pin.value.trim();
        if (v && !/^\d{4}$/.test(v)) return toast("Four digits, please");
        const hash = v ? await hashPin(v) : null;
        store.mutate((st) => { st.care.pinHash = hash; });
        careUnlocked = true;
        closeModal(); renderCare(main, navigate); toast(v ? "PIN set" : "PIN removed");
      },
    }, "Save"),
  );
}

// ---------- settings ----------
export function renderSettings(main, navigate) {
  const s = store.get();

  // ---- eating style ----
  const styleCard = el("div", { class: "card" },
    el("h2", {}, "Way of eating"),
    el("div", { class: "chip-row" },
      el("button", { class: "chip" + (s.eatingStyle === "med" ? " on" : ""), onclick: () => { store.update({ eatingStyle: "med" }); renderSettings(main, navigate); } }, "Whole-food Mediterranean"),
      el("button", { class: "chip" + (s.eatingStyle === "keto" ? " on" : ""), onclick: () => {
        openModal(
          el("h2", {}, "Switching to ketogenic"),
          el("p", { class: "muted" }, "Alma will plan from the ketogenic recipe set (roughly 6 to 12 g net carbs per serve) and show net carbs on recipes. Two honest notes first:"),
          el("ul", { class: "muted", style: "padding-left:1.1rem" },
            el("li", {}, "Tell your GP, especially if you take any medication: keto changes how some medicines behave."),
            el("li", {}, "Adult plates only. Children eat the same dinners plus their carbs; a ketogenic diet is never a child's diet outside specialist epilepsy care."),
          ),
          el("div", { class: "btn-row" },
            el("button", { class: "btn", onclick: () => { store.update({ eatingStyle: "keto" }); closeModal(); toast("Keto mode on. Plan a new week to feel it."); renderSettings(main, navigate); } }, "Understood, switch"),
            el("button", { class: "btn ghost", onclick: closeModal }, "Stay Mediterranean"),
          ),
        );
      } }, "Ketogenic"),
    ),
    el("p", { class: "tiny" }, s.eatingStyle === "keto"
      ? "Keto mode is on: the planner uses the low-carb set and shows net carbs. The Mediterranean pattern remains one tap away."
      : "The default, and the best-evidenced pattern in nutrition. Keto is available as a deliberate tool."),
    el("div", { class: "divider" }),
    el("label", { style: "display:block;font-size:0.85rem;font-weight:600;color:var(--ink-2);margin-bottom:0.3rem" }, "Also keep every plan"),
    el("div", { class: "chip-row" },
      ...[["vegan", "Vegan"], ["veg", "Vegetarian"], ["gf", "Gluten free"], ["nosugar", "No added sugar"]].map(([id, label]) =>
        el("button", {
          class: "chip" + ((s.profile.dietPrefs || []).includes(id) ? " on" : ""),
          onclick: () => {
            store.mutate((st) => {
              const p = st.profile.dietPrefs || (st.profile.dietPrefs = []);
              const i = p.indexOf(id);
              if (i >= 0) p.splice(i, 1); else p.push(id);
            });
            renderSettings(main, navigate);
            const n = eligibleRecipes().length;
            toast(n >= 7 ? `${n} recipes match. The next plan will respect it.` : `Only ${n} recipes match that combination; a full week needs seven.`);
          },
        }, label))),
    el("p", { class: "tiny" }, "When sweetness is needed anywhere, Alma reaches for pure allulose, stevia or monk fruit. ",
      el("button", { class: "link", onclick: () => openWhy("sweetness") }, "The honest why")),
  );

  // ---- exclusions ----
  const excl = s.exclusions;
  const exclList = [
    ...excl.always.map((n) => ({ n, kind: "always" })),
    ...excl.temp.map((t) => ({ n: t.name, kind: "until " + fmtDay(t.until), raw: t })),
  ];
  const exName = el("input", { type: "text", placeholder: "e.g. pork, dairy, mushrooms" });
  const exUntil = el("input", { type: "date" });
  const exclCard = el("div", { class: "card" },
    el("h2", {}, "Foods you don't eat"),
    el("p", { class: "tiny" }, "Always, or for a season (treatment, faith, a gut protocol). Excluded foods simply vanish from planning; temporary ones come back on their review date."),
    exclList.length
      ? el("div", { class: "chip-row" }, ...exclList.map((x) =>
          el("button", { class: "chip on", title: "Tap to remove", onclick: () => {
            store.mutate((st) => {
              st.exclusions.always = st.exclusions.always.filter((a) => a !== x.n);
              st.exclusions.temp = st.exclusions.temp.filter((t) => t.name !== x.n);
            });
            renderSettings(main, navigate);
          } }, `${x.n} · ${x.kind} ✕`)))
      : el("p", { class: "muted" }, "Nothing excluded."),
    el("div", { class: "field" }, el("label", {}, "Add an exclusion"), exName),
    el("div", { class: "field" }, el("label", {}, "Until (leave empty for always)"), exUntil),
    el("button", { class: "btn secondary small", onclick: () => {
      const n = exName.value.trim().toLowerCase();
      if (!n) return;
      store.mutate((st) => {
        if (exUntil.value) st.exclusions.temp.push({ name: n, until: exUntil.value });
        else st.exclusions.always.push(n);
      });
      renderSettings(main, navigate); toast("Excluded. The planner will respect it.");
    } }, "Exclude"),
  );

  main.replaceChildren(
    el("div", { class: "page-head" }, el("h1", {}, "Settings and data")),
    styleCard,
    exclCard,
    el("div", { class: "card" },
      el("h2", {}, "Household"),
      el("p", { class: "muted" }, `${s.profile.adults} adult${s.profile.adults > 1 ? "s" : ""}, ${s.profile.kids} child${s.profile.kids === 1 ? "" : "ren"}` +
        (s.profile.allergies.length ? ` · avoiding: ${s.profile.allergies.join(", ")}` : "") +
        (s.profile.busyNights.length ? ` · rushed nights: ${s.profile.busyNights.map((d) => DAY_NAMES[d].slice(0, 3)).join(", ")}` : "")),
      el("button", {
        class: "btn secondary small",
        onclick: () => { store.update({ onboarded: false }); navigate("#/"); },
      }, "Redo setup"),
    ),
    el("div", { class: "card" },
      el("h2", {}, "Your data"),
      el("p", { class: "muted" }, "Everything lives in this browser, on this device. Back it up before switching devices or clearing the browser."),
      el("div", { class: "btn-row" },
        el("button", {
          class: "btn secondary small",
          onclick: async () => {
            toast("Bundling everything, including journal media…");
            const journal = await exportJournal();
            const full = { ...JSON.parse(store.exportJSON()), journal };
            const blob = new Blob([JSON.stringify(full)], { type: "application/json" });
            const a = el("a", { href: URL.createObjectURL(blob), download: `alma-backup-${todayISO()}.json` });
            a.click(); URL.revokeObjectURL(a.href);
          },
        }, "Download backup"),
        (() => {
          const inp = el("input", { type: "file", accept: "application/json", style: "display:none" });
          inp.addEventListener("change", async () => {
            const f = inp.files[0];
            if (!f) return;
            try {
              const text = await f.text();
              const parsed = JSON.parse(text);
              const journal = parsed.journal || [];
              delete parsed.journal;
              store.importJSON(JSON.stringify(parsed));
              if (journal.length) await importJournal(journal);
              toast("Backup restored" + (journal.length ? ` (${journal.length} journal entries)` : ""));
              navigate("#/");
            }
            catch { toast("That file doesn't look like an Alma backup"); }
          });
          return el("span", {}, inp, el("button", { class: "btn ghost small", onclick: () => inp.click() }, "Restore backup"));
        })(),
        el("button", {
          class: "btn danger small",
          onclick: () => {
            if (confirm("Erase everything Alma has stored on this device? This cannot be undone.") && confirm("Really erase? A backup file is the only way back.")) {
              store.wipe(); careUnlocked = false; navigate("#/"); toast("All data erased");
            }
          },
        }, "Erase all data"),
      ),
    ),
    el("div", { class: "card flat" },
      el("h2", {}, "The promises"),
      el("ul", { class: "muted", style: "padding-left:1.1rem" },
        el("li", {}, "Named sources on every suggestion, so you never have to take Alma\u2019s word for anything."),
        el("li", {}, "No diagnosis and no symptom checking, so this app can never frighten you at midnight. It sends you to the right person with better questions instead."),
        el("li", {}, "Nutrition facts when you want them, never as a verdict: no calorie targets, no weight, no punishments, no streaks. A companion you can keep for years without it ever turning on you."),
        el("li", {}, "Your data never leaves this device because there is no server to leave to. Privacy here is physics, not a policy that can quietly change."),
      ),
    ),
  );
}
