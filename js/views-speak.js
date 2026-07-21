// Harta · the counsel (strategy for hard situations) and speak (the craft of being heard).
// Everything composes on the device from named frameworks; nothing is sent anywhere.

import { el, toast, openModal, icon } from "./ui.js";
import { store } from "./store.js";
import { COUNSEL_WHO, COUNSEL_WANT, COUNSEL_PLAYS, SPEAK_LESSONS, SPEAK_NOTE } from "./data2.js";
import { speak as speakAloud, voiceAvailable, listenOnce, listenAvailable, stopSpeaking } from "./voice.js";
import { addJournalEntry } from "./idb.js";
import { uid } from "./store.js";

// read the situation the user wrote and tune the counsel to it
const SITUATION_TUNERS = [
  [/screen|phone|ipad|tablet|game|gaming|youtube|tv/i, "About screens: the fight is rarely about the screen, it is about the ending. Agree the ending before it starts (a timer they set themselves outlives one you impose), and put the goodbye in their hands: one more video, you press stop."],
  [/homework|school|study|grades|teacher/i, "About school: separate the relationship from the report card. Ten minutes of interested listening about their day buys more homework cooperation than an hour of supervision."],
  [/bed|sleep|night|tired|wake/i, "About bedtime and tiredness: every conflict is twice its size after 8 pm and on short sleep. If you can, park it for the morning; the same conversation costs half as much then."],
  [/money|pocket money|buy|expensive|cost|spend/i, "About money: name the limit as a family rule rather than a personal refusal. Rules can be resented safely; parents holding them stay allies."],
  [/eat|food|dinner|vegetable|meal|picky/i, "About food: the division of jobs settles most table wars. You decide what is served; they decide how much of it to eat. Pressure feeds refusal; boredom of the argument starves it."],
  [/sibling|brother|sister/i, "About siblings: never judge a fight you did not see start. Coach the pair, not the verdict: same rules for both, comfort for both, and let the fairness ledger stay closed."],
  [/deadline|late|overdue|project|deliver/i, "About the deadline: bring the bad news early and arrive holding options rather than apologies. Two workable paths and a recommendation turns a confession into a plan."],
  [/salary|raise|pay|promotion|review/i, "About pay: numbers negotiate better than feelings. Bring the market figure, your two strongest results, and one clear ask, then hold the silence after it."],
  [/email|message|text|wrote|chat/i, "About the written argument: nothing hot survives a keyboard. Move it to a voice or a room; tone travels there and repair is possible."],
  [/criticis|feedback|blame|accus/i, "About the criticism: take the one true grain out loud before anything else. Owning ten per cent cleanly buys the standing to contest the ninety."],
  [/mother|father|in-law|in law|grand/i, "About the wider family: defend the boundary, honour the person. The sentence that does both: we so appreciate you, and this decision is ours."],
  [/diagnos|scan|result|hospital|treatment|doctor/i, "About the medical weight in this: facts first, feelings named, and nobody has to be strong on schedule. One conversation can simply end with: we know enough for today."],
];
function tuneToSituation(text) {
  if (!text || text.trim().length < 8) return null;
  const hits = SITUATION_TUNERS.filter(([re]) => re.test(text)).map(([, tip]) => tip).slice(0, 2);
  return { quote: text.trim().slice(0, 140), tips: hits };
}

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
    const tuned = tuneToSituation(situation.value);
    const readable = play.principle + " " + (tuned && tuned.tips.length ? tuned.tips.join(" ") + " " : "") + play.steps.join(" ");
    result.replaceChildren(
      el("div", { class: "card" },
        el("span", { class: "eyebrow" }, play.name),
        el("h2", {}, play.principle),
        want === "repair" ? el("p", { class: "tiny" }, "You chose to protect the relationship: every step below is played for the long game, not the point.") :
        want === "outcome" ? el("p", { class: "tiny" }, "You chose an outcome: stay warm, and do not leave the room without the close (step five).") :
        want === "understood" ? el("p", { class: "tiny" }, "You chose to be understood: give most of your effort to the listening step. Being heard is bought with hearing.") : null,
        tuned ? el("div", { class: "notice", style: "margin-top:0.6rem" },
          el("p", { class: "tiny", style: "margin:0 0 0.3rem" }, "You wrote: \u201C" + tuned.quote + (situation.value.trim().length > 140 ? "\u2026" : "") + "\u201D"),
          tuned.tips.length
            ? el("div", {}, ...tuned.tips.map((tip) => el("p", { style: "font-size:0.9rem;margin:0.3rem 0" }, tip)))
            : el("p", { style: "font-size:0.9rem;margin:0" }, "Your situation in mind, the sequence below is the path. If you tell it more (what it is about, when it happens), the counsel tunes further.")) : null,
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
    if (voiceAvailable() && store.get().voiceOn) speakAloud(readable);
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
      el("div", { class: "btn-row" },
        el("button", { class: "btn", onclick: compose }, "Give me the strategy"),
        listenAvailable() ? (() => {
          let rec = null, active = false;
          const b = el("button", { class: "btn ghost small", onclick: () => {
            if (active) { try { rec?.stop(); } catch {} return; }
            active = true; stopSpeaking(); b.classList.add("danger");
            b.replaceChildren(el("span", { class: "record-dot" }), " Listening\u2026 tap when done");
            rec = listenOnce({
              onText: (fin, interim) => { situation.value = (fin + " " + interim).trim(); },
              onEnd: (finalText) => {
                active = false; b.classList.remove("danger");
                b.replaceChildren(icon("mic", 15), " Speak the situation");
                if (finalText) { situation.value = finalText; compose(); }
              },
            });
          } }, icon("mic", 15), " Speak the situation");
          return b;
        })() : null,
      ),
      el("p", { class: "tiny" }, "Speak it if that is easier: the counsel listens, reads what you say, and answers aloud when the reading voice is on."),
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
          listenAvailable() ? (() => {
            let rec = null, active = false;
            const live = el("p", { class: "muted", style: "font-style:italic;min-height:1.4rem;margin-top:0.6rem" }, "");
            const btn = el("button", { class: "btn small", style: "margin-top:0.7rem;margin-left:0.5rem", onclick: () => {
              if (active) { try { rec?.stop(); } catch {} return; }
              active = true; btn.textContent = "Stop and keep";
              live.textContent = "Speak the practice aloud\u2026";
              rec = listenOnce({
                onText: (fin, interim) => { live.textContent = (fin + " " + interim).trim(); },
                onEnd: async (finalText) => {
                  active = false; btn.textContent = "Practise aloud";
                  if (!finalText) { live.textContent = "Nothing caught; try again closer to the microphone."; return; }
                  live.textContent = "\u201C" + finalText + "\u201D \u2014 kept in your journal.";
                  await addJournalEntry({ type: "text", text: finalText, tags: ["speak-practice", l.id], prompt: l.title });
                  store.mutate((st) => { st.journalIndex.unshift({ id: uid(), t: new Date().toISOString(), type: "text", preview: finalText.slice(0, 90), tags: ["speak-practice"] }); });
                },
              });
            } }, "Practise aloud");
            return el("div", {}, btn, live,
              el("p", { class: "tiny" }, "Your words become text as you speak and are kept in the journal, so you can watch your phrasing sharpen over the weeks."));
          })() : null,
        );
      } },
        el("div", { class: "card-title-row" }, el("h3", {}, l.title), el("span", { class: "tag " + cls }, label)),
        el("p", { class: "one-liner" }, l.one),
      );
    }),
    el("p", { class: "tiny center" }, SPEAK_NOTE),
  );
}
