// Harta · the counsel (strategy for hard situations) and speak (the craft of being heard).
// Everything composes on the device from named frameworks; nothing is sent anywhere.

import { el, toast, openModal } from "./ui.js";
import { store } from "./store.js";
import { COUNSEL_WHO, COUNSEL_WANT, COUNSEL_PLAYS, SPEAK_LESSONS, SPEAK_NOTE } from "./data2.js";
import { speak as speakAloud, voiceAvailable } from "./voice.js";

// which playbook fits this person and this goal
function pickPlay(who, want) {
  if (want === "deescalate") return COUNSEL_PLAYS.deescalate;
  if (want === "boundary") return COUNSEL_PLAYS.boundary;
  if (who === "child") return COUNSEL_PLAYS.child;
  if (who === "partner" || who === "family" || who === "friend") return COUNSEL_PLAYS.partner;
  if (who === "colleague" || who === "boss" || who === "medical") return COUNSEL_PLAYS.work;
  return COUNSEL_PLAYS.deescalate;
}

export function renderCounsel(main) {
  let who = "child", want = "repair";
  const situation = el("textarea", { placeholder: "What happened, in your own words. Stays on this device, like everything else." });
  const result = el("div", {});

  const chipRow = (options, get, set) => el("div", { class: "chip-row" },
    ...options.map(([id, label]) => el("button", {
      class: "chip" + (get() === id ? " on" : ""),
      onclick: (e) => { set(id); e.target.closest(".chip-row").querySelectorAll(".chip").forEach((c) => { c.classList.remove("on"); c.setAttribute("aria-pressed", "false"); }); e.target.classList.add("on"); e.target.setAttribute("aria-pressed", "true"); },
    }, label)));

  const compose = () => {
    const play = pickPlay(who, want);
    const wantLabel = COUNSEL_WANT.find(([id]) => id === want)[1].toLowerCase();
    const readable = play.principle + " " + play.steps.join(" ");
    result.replaceChildren(
      el("div", { class: "card" },
        el("span", { class: "eyebrow" }, play.name),
        el("h2", {}, play.principle),
        want === "repair" ? el("p", { class: "tiny" }, "You chose to protect the relationship: every step below is played for the long game, not the point.") :
        want === "outcome" ? el("p", { class: "tiny" }, "You chose an outcome: stay warm, and do not leave the room without the close (step five).") :
        want === "understood" ? el("p", { class: "tiny" }, "You chose to be understood: give most of your effort to the listening step. Being heard is bought with hearing.") : null,
        el("h3", { style: "margin-top:0.8rem" }, "The moves, in order"),
        el("ol", { class: "method" }, play.steps.map((st) => el("li", {}, st))),
        el("h3", {}, "Words that open doors"),
        ...play.say.map((x) => el("p", { class: "muted", style: "font-style:italic;margin:0.2rem 0" }, x)),
        el("div", { class: "notice warm", style: "margin-top:0.7rem" }, el("strong", {}, "Do not: "), play.avoid),
        el("div", { class: "source-line" }, "Built from: " + play.source + "."),
        voiceAvailable() && store.get().voiceOn ? el("button", { class: "btn secondary small", style: "margin-top:0.7rem", onclick: () => speakAloud(readable) }, "Read it to me") : null,
      ),
      el("p", { class: "tiny" }, "General wisdom from named frameworks, tailored by your choices; it cannot know the people involved the way you do. For anything involving safety, a professional beats a playbook, today."),
    );
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "Strategy for hard moments"),
      el("h1", {}, "The counsel"),
      el("p", {}, "Tell it the situation; it hands you the wisest sequence the evidence knows, with the words to open it. In the interest of both sides, and of what is between you."),
    ),
    el("div", { class: "card" },
      el("label", { style: "display:block;font-size:0.85rem;font-weight:600;color:var(--ink-2);margin-bottom:0.3rem" }, "Who is this with?"),
      chipRow(COUNSEL_WHO, () => who, (v) => (who = v)),
      el("label", { style: "display:block;font-size:0.85rem;font-weight:600;color:var(--ink-2);margin:0.6rem 0 0.3rem" }, "What matters most right now?"),
      chipRow(COUNSEL_WANT, () => want, (v) => (want = v)),
      el("div", { class: "field", style: "margin-top:0.6rem" }, el("label", {}, "The situation (optional)"), situation),
      el("button", { class: "btn", onclick: compose }, "Give me the strategy"),
    ),
    result,
  );
}

export function renderSpeak(main) {
  const STR = { strong: ["evidence-strong", "strong evidence"], emerging: ["evidence-emerging", "emerging evidence"] };
  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "The craft of being heard"),
      el("h1", {}, "Speak"),
      el("p", {}, "Eight small lessons in saying things so they land: structure, concreteness, silence, story, honest influence. One a day is plenty; each ends with a practice you can do before dinner."),
    ),
    ...SPEAK_LESSONS.map((l) => {
      const [cls, label] = STR[l.strength];
      return el("button", { class: "card learn-card", style: "width:100%;text-align:left", onclick: () => {
        openModal(
          el("h2", {}, l.title),
          el("span", { class: "tag " + cls }, label),
          el("p", { style: "margin-top:0.8rem" }, l.body),
          el("div", { class: "notice", style: "margin-top:0.6rem" }, el("strong", {}, "Practice: "), l.practice),
          el("div", { class: "source-line" }, "Source: " + l.source + "."),
          voiceAvailable() && store.get().voiceOn ? el("button", { class: "btn secondary small", style: "margin-top:0.7rem", onclick: () => speakAloud(l.title + ". " + l.body + " Practice: " + l.practice) }, "Read it to me") : null,
        );
      } },
        el("div", { class: "card-title-row" }, el("h3", {}, l.title), el("span", { class: "tag " + cls }, label)),
        el("p", { class: "one-liner" }, l.one),
      );
    }),
    el("p", { class: "tiny center" }, SPEAK_NOTE),
  );
}
