// Harta · views: onboarding, today, plan, groceries, recipes

import { el, icon, openModal, closeModal, toast } from "./ui.js";
import { RECIPES, SECTIONS, HABITS, NUDGES } from "./data.js";
import {
  bodyNeeds, eatingWindow, timesCooked, allRecipes, claimMilestone, fmtClock, sumQuantities, localDayOf, greeting, displayGlucose, eligibleRecipes,
  store, DAY_KEYS, DAY_NAMES, todayISO, dayKeyToday, dateOfDayKey, fmtDay,
  recipeById, startNewWeek, swapDay, groceryList, toggleHabit,
} from "./store.js";

// ---------- onboarding ----------
export function renderOnboarding(main, navigate) {
  const s = store.get();
  let step = s.disclaimerAccepted ? 1 : 0;
  const existing = s.profile;
  const draft = {
    name: existing.name || "", adults: existing.adults || 2, kids: existing.kids ?? 2,
    allergies: [...(existing.allergies || [])], busyNights: [...(existing.busyNights || [])],
    fishOk: existing.fishOk !== false, meatOk: existing.meatOk !== false,
  };

  const steps = [renderWelcome, renderHousehold, renderNights, renderDone];

  function paint() {
    main.replaceChildren(el("div", { class: "onb" }, steps[step]()));
  }

  function renderWelcome() {
    return el("div", {},
      el("img", { src: "icons/icon.svg", class: "brand-mark-lg", alt: "" }),
      el("h1", { class: "center" }, "Harta"),
      el("p", { class: "center muted" }, "The map to living well. Know first, then choose."),
      el("div", { class: "card", style: "margin-top:1.2rem" },
        el("h3", {}, "Three promises, and what they buy you"),
        el("p", { class: "muted" }, "Every suggestion arrives with its reason and a named source, so you choose from knowledge instead of headlines. Harta never diagnoses, never prescribes and never mentions your weight, which means you get clarity here without the 2 am anxiety spiral."),
        el("p", { class: "muted" }, "Your doctor stays your doctor. For symptoms, results, medication and supplements, Harta\u2019s job is to send you into the appointment with sharper questions and a cleaner timeline, so the ten minutes you get are worth twenty."),
        el("p", { class: "muted" }, "Everything lives on this device only. No account to create, no password to forget, and nothing to hack, leak or sell: your meals, numbers and letters stay as private as the drawer beside your bed."),
      ),
      el("button", {
        class: "btn", style: "width:100%",
        onclick: () => { store.update({ disclaimerAccepted: true }); step = 1; paint(); },
      }, "I understand, let's begin"),
    );
  }

  function renderHousehold() {
    const allergyInput = el("input", { type: "text", placeholder: "e.g. peanuts, prawns (comma separated)" });
    const nameInput = el("input", { type: "text", placeholder: "What should Harta call you?" });
    const counter = (label, key, min, max) => {
      const val = el("span", { class: "slider-val" }, String(draft[key]));
      return el("div", { class: "field" },
        el("label", {}, label),
        el("div", { class: "btn-row" },
          el("button", { class: "btn ghost small", onclick: () => { draft[key] = Math.max(min, draft[key] - 1); val.textContent = draft[key]; } }, "−"),
          val,
          el("button", { class: "btn ghost small", onclick: () => { draft[key] = Math.min(max, draft[key] + 1); val.textContent = draft[key]; } }, "+"),
        ),
      );
    };
    const tick = (label, key) => {
      const box = el("input", { type: "checkbox" });
      box.checked = draft[key];
      box.addEventListener("change", () => (draft[key] = box.checked));
      return el("label", { class: "chip", style: "cursor:pointer" }, box, " ", label);
    };
    return el("div", {},
      el("h2", {}, "Who's at the table?"),
      el("p", { class: "muted" }, "Meal plans are sized and chosen for your real household."),
      el("div", { class: "field" }, el("label", {}, "Your name (optional)"), nameInput),
      counter("Adults", "adults", 1, 8),
      counter("Children", "kids", 0, 8),
      el("div", { class: "field" }, el("label", {}, "Allergies or foods to avoid"), allergyInput,
        el("p", { class: "hint" }, "Recipes containing these are removed from every plan.")),
      el("div", { class: "field" }, el("label", {}, "We eat"), el("div", { class: "chip-row" }, tick("Fish and seafood", "fishOk"), tick("Meat and poultry", "meatOk"))),
      el("button", {
        class: "btn", style: "width:100%",
        onclick: () => {
          draft.name = nameInput.value.trim();
          draft.allergies = allergyInput.value.split(",").map((a) => a.trim()).filter(Boolean);
          step = 2; paint();
        },
      }, "Next"),
    );
  }

  function renderNights() {
    const chips = DAY_KEYS.map((dk) => {
      const c = el("button", { class: "chip", onclick: () => { c.classList.toggle("on"); } }, DAY_NAMES[dk]);
      return [dk, c];
    });
    return el("div", {},
      el("h2", {}, "Which nights are rushed?"),
      el("p", { class: "muted" }, "Sport, late work, whatever makes cooking hard. Those nights get 15-minute dinners or planned leftovers. A plan that ignores your real week is a plan that fails by Thursday."),
      el("div", { class: "chip-row" }, chips.map(([, c]) => c)),
      el("button", {
        class: "btn", style: "width:100%",
        onclick: () => {
          draft.busyNights = chips.filter(([, c]) => c.classList.contains("on")).map(([dk]) => dk);
          store.mutate((st) => { Object.assign(st.profile, draft); st.onboarded = true; });
          if (!store.get().week) startNewWeek(); // redoing setup never throws away the current week
          step = 3; paint();
        },
      }, "Build my first week"),
    );
  }

  function renderDone() {
    return el("div", { class: "center" },
      el("h2", {}, "Your first week is ready"),
      el("p", { class: "muted" }, "Seven dinners, a grocery list, and the reason behind every choice. Change anything you like: the plan serves you, not the other way around."),
      el("button", { class: "btn", onclick: () => navigate("#/plan") }, "See the week"),
    );
  }

  paint();
}

// ---------- today ----------
export function renderToday(main, navigate) {
  const s = store.get();
  const dk = dayKeyToday();
  const iso = todayISO();
  const slot = s.week?.days[dk];
  const recipe = slot?.recipeId ? recipeById(slot.recipeId) : null;
  const dayLog = s.habitLogs[iso] || {};
  const greet = greeting();

  const pulses = HABITS.map((h) =>
    el("button", {
      class: "pulse" + (dayLog[h.id] ? " on" : ""),
      "aria-pressed": dayLog[h.id] ? "true" : "false",
      onclick: (e) => {
        toggleHabit(iso, h.id);
        renderToday(main, navigate);
      },
    }, icon(h.icon, 22), h.label)
  );

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })),
      el("h1", { class: "hello" }, `${greet}${s.profile.name ? ", " + s.profile.name : ""}`),
    ),

    el("div", { class: "card" },
      el("div", { class: "card-title-row" }, el("h2", {}, "Tonight"),
        recipe && el("button", { class: "link", onclick: () => { swapDay(dk); renderToday(main, navigate); toast("Swapped tonight's dinner"); } }, "Swap")),
      recipe
        ? el("div", { class: "dinner-hero" },
            el("button", { class: "meal-name name", style: "font-family:var(--font-head);font-size:1.35rem;background:none;border:none;padding:0;cursor:pointer;color:var(--ink);text-align:left", onclick: () => openRecipe(recipe) }, recipe.name + (slot.leftover ? " (leftovers night)" : "")),
            el("div", { class: "meta-row" },
              el("span", { class: "tag" }, `${recipe.total} min`),
              el("span", { class: "tag" }, `serves ${recipe.serves}`),
              recipe.tags.includes("kidsafe") && el("span", { class: "tag green" }, "kid friendly"),
            ),
            (() => {
              const n = timesCooked(recipe.id);
              if (n < 2) return null;
              const since = s.mealMemoryDates?.[recipe.id];
              return el("p", { class: "tiny", style: "font-style:italic;margin:0.2rem 0 0" },
                `This one has fed the table ${n === 2 ? "twice" : n + " times"}` + (since ? `, loved since ${fmtDay(since)}` : "") + ".");
            })(),
            el("p", { class: "muted", style: "margin-top:0.4rem" }, recipe.why),
          )
        : el("div", {},
            el("p", { class: "muted" }, "No dinner planned for tonight yet."),
            el("button", { class: "btn small", onclick: () => navigate("#/plan") }, "Plan the week")),
    ),

    el("div", { class: "card" },
      el("div", { class: "card-title-row" }, el("h2", {}, "Today's gentle four")),
      el("p", { class: "tiny", style: "margin:0 0 0.6rem" }, "Tap what happened. Untouched is fine: this is a pattern, not a scoreboard."),
      el("div", { class: "pulse-grid" }, pulses),
    ),

    ...[(() => {
      // a letter is approaching: the most anticipation an app can honestly hold
      const today = todayISO();
      const soon = (s.capsules || []).filter((c) => !c.opened && c.openOn && c.openOn > today)
        .map((c) => ({ c, days: Math.ceil((new Date(c.openOn + "T12:00:00") - new Date(today + "T12:00:00")) / 864e5) }))
        .filter((x) => x.days <= 7)
        .sort((a, b) => a.days - b.days)[0];
      if (!soon) return null;
      return el("div", { class: "card flat", style: "cursor:pointer", onclick: () => navigate("#/capsule") },
        el("span", { class: "eyebrow" }, "Approaching"),
        el("p", { style: "font-family:var(--font-head);margin:0.2rem 0 0" },
          `A letter for ${soon.c.to} unseals ${soon.days === 1 ? "tomorrow" : "in " + soon.days + " days"}.`),
      );
    })()].filter(Boolean),
    ...[(() => {
      const w = eatingWindow();
      if (!w && !s.fasting.activeStart) return null;
      if (w && w.mode === "fasting") {
        const h = Math.floor(w.minsToOpen / 60), m2 = w.minsToOpen % 60;
        return el("div", { class: "notice", style: "cursor:pointer", onclick: () => navigate("#/fasting") },
          el("strong", {}, "Fasting now. "),
          w.canEat ? "The window is open: you can eat, gently, whenever you choose."
            : `The kitchen reopens at ${fmtClock(w.opens)}: ${h ? h + " h " : ""}${m2} min to go. Water, black coffee and plain tea are welcome company.`);
      }
      if (w && w.mode === "open") {
        return el("div", { class: "notice", style: "cursor:pointer", onclick: () => navigate("#/fasting") },
          el("strong", {}, "Eating window open. "),
          `The kitchen closes at ${fmtClock(w.closes)} tonight, in about ${Math.floor(w.minsToClose / 60)} h ${w.minsToClose % 60} min.`);
      }
      if (w && w.mode === "closed") {
        const h = Math.floor(w.minsToOpen / 60), m2 = w.minsToOpen % 60;
        return el("div", { class: "notice", style: "cursor:pointer", onclick: () => navigate("#/fasting") },
          el("strong", {}, "Kitchen closed for the night. "),
          w.canEat ? "It can reopen whenever you choose." : `It reopens at ${fmtClock(w.opens)}: ${h ? h + " h " : ""}${m2} min to go.`);
      }
      return null;
    })()].filter(Boolean),
    ...[(() => {
      // the kept word: the kind thing you asked of this week, held where you can see it
      const c = s.checkins[0];
      if (!c || !c.kind || c.kindKept) return null;
      if ((Date.now() - new Date(c.date)) > 8 * 864e5) return null;
      return el("div", { class: "card flat" },
        el("p", { class: "muted", style: "margin:0" },
          el("strong", {}, "Your one kind thing this week: "), `“${c.kind}”`),
        el("div", { class: "btn-row", style: "margin-top:0.5rem" },
          el("button", { class: "btn secondary small", onclick: () => {
            store.mutate((st) => { st.checkins[0].kindKept = todayISO(); });
            toast("Kept. That is the whole assignment.");
            renderToday(main, navigate);
          } }, "Done, and it was kind")),
      );
    })()].filter(Boolean),
    (() => {
      const g = s.signals.readings.find((r) => r.type === "glucose");
      const k = s.signals.readings.find((r) => r.type === "ketone");
      return el("div", { class: "card" },
        el("div", { class: "card-title-row" }, el("h2", {}, "Your signals"),
          el("button", { class: "link", onclick: () => navigate("#/signals") }, "Open")),
        el("p", { class: "muted", style: "margin-bottom:0.5rem" },
          g || k
            ? "Latest: " + [g && `glucose ${displayGlucose(g.v).v} ${displayGlucose(g.v).unit}`, k && `ketones ${k.v} mmol/L`].filter(Boolean).join(" · ")
            : "Wearing a sensor, or prick-testing? Bring the numbers in and Harta reads them kindly: glucose, ketones, GKI, labs."),
        el("div", { class: "btn-row" },
          el("button", { class: "btn secondary small", onclick: () => navigate("#/signals") }, "Add a reading"),
          el("button", { class: "btn ghost small", onclick: () => { navigate("#/signals"); setTimeout(() => import("./views-signals.js").then((m) => m.openImportCSV(document.getElementById("main"))), 150); } }, "Import sensor CSV"),
        ),
      );
    })(),
    ...(s.activeNudge ? [renderNudgeCard(s)] : []),

    el("div", { class: "card" },
      el("div", { class: "card-title-row" }, el("h2", {}, "The week"), el("button", { class: "link", onclick: () => navigate("#/plan") }, "Open plan")),
      el("div", { class: "week-glance" },
        DAY_KEYS.map((k) =>
          el("div", { class: "wg-day" + (s.week?.days[k]?.recipeId ? " planned" : "") + (k === dk ? " today" : "") },
            DAY_NAMES[k].slice(0, 2), el("span", { class: "dot" }))
        )),
    ),

    el("p", { class: "tiny center" }, "Knowledge with sources, so the choices stay yours. The medical calls stay with your doctor, where they are safest."),
  );
}

function renderNudgeCard(s) {
  const n = NUDGES.find((x) => x.id === s.activeNudge);
  if (!n) return null;
  return el("div", { class: "notice" },
    el("strong", {}, "This week's one nudge: "), n.text + ". ",
    el("span", { class: "tiny" }, `${n.why} (${n.source})`),
  );
}

// ---------- plan ----------
export function renderPlan(main, navigate) {
  const s = store.get();
  if (!s.week) {
    startNewWeek();
    return renderPlan(main, navigate);
  }
  const dk = dayKeyToday();
  const moveMeal = (from, to) => {
    store.mutate((st) => {
      const a = st.week.days[from], b = st.week.days[to];
      st.week.days[from] = b; st.week.days[to] = a;
    });
    renderPlan(main, navigate);
  };
  const rows = DAY_KEYS.map((k, idx) => {
    const slot = s.week.days[k];
    const r = slot?.recipeId ? recipeById(slot.recipeId) : null;
    const row = el("div", {
      class: "day-row" + (k === dk ? " today-row" : ""),
      draggable: "true",
      dataset: { day: k },
    },
      el("span", { class: "d" }, DAY_NAMES[k].slice(0, 3), el("small", {}, fmtDay(dateOfDayKey(s.week.start, k)))),
      r
        ? el("span", {},
            el("button", { class: "meal-name", onclick: () => openRecipe(r) }, r.name),
            el("span", { class: "meal-sub" }, slot.leftover ? "Leftovers from the batch pot" : `${r.total} min · serves ${r.serves}` + (store.get().eatingStyle === "keto" && r.netCarbs ? ` · ~${r.netCarbs} g net carbs` : "")))
        : el("span", { class: "meal-name empty" }, "Nothing planned"),
      el("span", { class: "row-actions" },
        el("button", { class: "btn ghost small", "aria-label": "Move " + DAY_NAMES[k] + " dinner earlier", disabled: idx === 0, onclick: () => moveMeal(k, DAY_KEYS[idx - 1]) }, "↑"),
        el("button", { class: "btn ghost small", "aria-label": "Move " + DAY_NAMES[k] + " dinner later", disabled: idx === 6, onclick: () => moveMeal(k, DAY_KEYS[idx + 1]) }, "↓"),
        el("button", { class: "btn ghost small", "aria-label": "Swap " + DAY_NAMES[k] + " for another recipe", onclick: () => { swapDay(k); renderPlan(main, navigate); } }, icon("swap", 16)),
      ),
    );
    row.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", k); row.classList.add("dragging"); });
    row.addEventListener("dragend", () => row.classList.remove("dragging"));
    row.addEventListener("dragover", (e) => { e.preventDefault(); row.classList.add("drop-target"); });
    row.addEventListener("dragleave", () => row.classList.remove("drop-target"));
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      const from = e.dataTransfer.getData("text/plain");
      if (from && from !== k) moveMeal(from, k);
    });
    return row;
  });

  const pool = eligibleRecipes();
  const poolWarning = pool.length < 7
    ? el("div", { class: "notice warm" },
        `Your way of eating, dietary preferences and exclusions leave ${pool.length} recipe${pool.length === 1 ? "" : "s"}, and a full week needs at least seven. Loosen one filter in `,
        el("button", { class: "link", onclick: () => navigate("#/settings") }, "Settings"),
        " and plan a new week.")
    : null;
  const needs = bodyNeeds();
  const planTonight = (rid) => {
    store.mutate((st) => { st.week.days[dk] = { recipeId: rid }; st.week.checked = {}; });
    renderPlan(main, navigate);
  };
  const needsCard = el("div", { class: "card" },
    el("div", { class: "card-title-row" }, el("h2", {}, "Start from what your body needs")),
    ...needs.now.map((n) => el("div", { style: "margin-bottom:0.8rem" },
      el("h3", {}, n.title),
      el("p", { class: "muted", style: "font-size:0.88rem;margin-bottom:0.4rem" }, n.why),
      el("div", { class: "chip-row", style: "margin:0" },
        ...n.recipes.map((r) => el("button", { class: "chip", title: "Plan this for tonight", onclick: () => planTonight(r.id) }, r.name + " →"))),
    )),
    el("div", { class: "divider" }),
    el("p", { class: "tiny" }, "The long game: " + needs.season.join(" ")),
  );

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "Week of " + fmtDay(s.week.start)),
      el("h1", {}, "The plan"),
      el("p", {}, "Whole food, family sized, built around your rushed nights. Drag a dinner onto another day, or use the arrows; swap anything."),
    ),
    ...(poolWarning ? [poolWarning] : []),
    needsCard,
    el("div", { class: "week-list" }, rows),
    el("div", { class: "btn-row", style: "margin-top:1rem" },
      el("button", { class: "btn", onclick: () => navigate("#/groceries") }, "Grocery list"),
      el("button", {
        class: "btn secondary",
        onclick: () => {
          if (confirm("Build a fresh week? The current one is archived, not lost.")) {
            startNewWeek(); renderPlan(main, navigate); toast("New week planned");
          }
        },
      }, "New week"),
      el("button", { class: "btn ghost", onclick: () => navigate("#/recipes") }, "Browse recipes"),
    ),
  );
}

// ---------- groceries ----------
export function renderGroceries(main, navigate) {
  const s = store.get();
  if (!s.week) { navigate("#/plan"); return; }
  const sections = groceryList();
  const secEls = [];
  for (const [secId, label] of SECTIONS) {
    const items = sections.get(secId);
    if (!items?.length) continue;
    secEls.push(el("div", { class: "gsec" },
      el("h3", {}, label),
      items.map((item) => {
        const checked = !!s.week.checked[item.key];
        const box = el("input", { type: "checkbox", id: "g-" + item.key });
        box.checked = checked;
        box.addEventListener("change", () => {
          store.mutate((st) => { st.week.checked[item.key] = box.checked; });
          row.classList.toggle("done", box.checked);
        });
        const row = el("div", { class: "gitem" + (checked ? " done" : "") },
          box,
          el("label", { for: "g-" + item.key, title: "For: " + item.recipes.join(", ") }, item.n,
            item.pantry ? el("span", {}, " ", el("span", { class: "pantry-note" }, "check pantry")) : null),
          el("span", { class: "q" }, sumQuantities(item.qs)),
        );
        return row;
      }),
    ));
  }

  const extraInput = el("input", { type: "text", placeholder: "Add your own item" });
  const addExtra = () => {
    const v = extraInput.value.trim();
    if (!v) return;
    store.mutate((st) => { st.week.extras = [...(st.week.extras || []), v]; });
    extraInput.value = "";
    renderGroceries(main, navigate);
  };
  extraInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addExtra(); });

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "Week of " + fmtDay(s.week.start)),
      el("h1", {}, "Groceries"),
      el("p", {}, "Ordered the way supermarkets are. Pantry staples are flagged so you buy them once, not weekly."),
    ),
    el("div", { class: "card" }, ...secEls.length ? secEls : [el("p", { class: "muted" }, "Plan some dinners first and the list builds itself.")]),
    el("div", { class: "card flat" },
      el("div", { class: "field" }, el("label", {}, "Anything else the house needs"), extraInput),
      el("div", { class: "btn-row" },
        el("button", { class: "btn small secondary", onclick: addExtra }, "Add item"),
        el("button", { class: "btn small ghost", onclick: () => window.print() }, icon("print", 16), "Print"),
      ),
    ),
  );
}

// ---------- recipes ----------

// ---------- recipes from a link ----------
function guessSection(line) {
  const l = line.toLowerCase();
  if (/(chicken|beef|pork|lamb|fish|salmon|tuna|prawn|mince|bacon|turkey)/.test(l)) return "fishmeat";
  if (/(milk|cream|butter|cheese|yoghurt|yogurt|feta|parmesan|egg)/.test(l)) return "fridge";
  if (/(frozen)/.test(l)) return "frozen";
  if (/(bread|tortilla|wrap|bun)/.test(l)) return "bakery";
  if (/(onion|garlic|tomato|capsicum|carrot|zucchini|spinach|lettuce|broccoli|cabbage|potato|pumpkin|lemon|lime|herb|parsley|dill|basil|mushroom|avocado|cucumber|apple|berry|celery|leek|eggplant)/.test(l)) return "produce";
  return "pantry";
}
function parseISODuration(d) {
  if (!d || typeof d !== "string") return null;
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return null;
  return (Number(m[1] || 0) * 60 + Number(m[2] || 0)) || null;
}
function recipeFromJsonLd(doc, url) {
  const scripts = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  for (const sc of scripts) {
    let data; try { data = JSON.parse(sc.textContent); } catch { continue; }
    const nodes = [];
    const walk = (x) => { if (!x) return; if (Array.isArray(x)) return x.forEach(walk); nodes.push(x); if (x["@graph"]) walk(x["@graph"]); };
    walk(data);
    const rec = nodes.find((n) => String(n["@type"]).includes("Recipe"));
    if (!rec) continue;
    const steps = [];
    const walkSteps = (x) => {
      if (!x) return;
      if (Array.isArray(x)) return x.forEach(walkSteps);
      if (typeof x === "string") steps.push(x);
      else if (x.text) steps.push(x.text);
      else if (x.itemListElement) walkSteps(x.itemListElement);
    };
    walkSteps(rec.recipeInstructions);
    const total = parseISODuration(rec.totalTime) || parseISODuration(rec.cookTime) || 30;
    const serves = parseInt(String(rec.recipeYield || "4").match(/\d+/)?.[0] || "4");
    return {
      name: (rec.name || "A recipe from the web").trim(),
      total, time: Math.min(total, parseISODuration(rec.prepTime) || total),
      serves: Math.min(12, Math.max(1, serves)),
      ingredients: (rec.recipeIngredient || []).map((n) => ({ n: String(n).trim(), q: "", s: guessSection(String(n)) })),
      method: steps.map((x) => String(x).replace(/<[^>]+>/g, "").trim()).filter(Boolean),
      source: new URL(url).hostname.replace("www.", ""),
    };
  }
  return null;
}
function recipeFromPaste(text, url) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;
  const ingIdx = lines.findIndex((l) => /^ingredients?\b/i.test(l));
  const methodIdx = lines.findIndex((l) => /^(method|instructions?|directions?|steps)\b/i.test(l));
  const name = lines[0].slice(0, 90);
  let ingredients, method;
  if (ingIdx >= 0 && methodIdx > ingIdx) {
    ingredients = lines.slice(ingIdx + 1, methodIdx);
    method = lines.slice(methodIdx + 1);
  } else {
    // best effort: lines with a number or unit look like ingredients
    ingredients = lines.slice(1).filter((l) => /\d|cup|tbsp|tsp|gram|\bg\b|ml|clove|bunch/i.test(l) && l.length < 90);
    method = lines.slice(1).filter((l) => !ingredients.includes(l) && l.length > 25);
  }
  if (!ingredients.length || !method.length) return null;
  const serves = parseInt(text.match(/serves?\s*(\d+)/i)?.[1] || "4");
  const total = parseInt(text.match(/(\d+)\s*min/i)?.[1] || "30");
  return {
    name, total, time: Math.min(total, 25), serves,
    ingredients: ingredients.map((n) => ({ n, q: "", s: guessSection(n) })),
    method,
    source: url ? new URL(url).hostname.replace("www.", "") : "your paste",
  };
}
function saveCustomRecipe(parsed, main) {
  const id = "custom-" + Math.random().toString(36).slice(2, 8);
  store.mutate((s) => {
    s.customRecipes.push({
      id, name: parsed.name, time: parsed.time, total: parsed.total, serves: parsed.serves,
      tags: ["custom"],
      ingredients: parsed.ingredients, method: parsed.method,
      why: "Added by you, from " + parsed.source + ". It plans, shops and swaps like every other recipe.",
      whySource: parsed.source,
    });
  });
  closeModal(); renderRecipes(main);
  toast("\u201C" + parsed.name + "\u201D is in the kitchen now");
}
function addFromLinkModal(main) {
  const urlInput = el("input", { type: "url", placeholder: "https://\u2026 paste the recipe page" });
  const status = el("p", { class: "tiny" }, "");
  const pasteArea = el("textarea", { placeholder: "\u2026or paste the recipe text itself here: title first, then ingredients, then method.", style: "min-height:8rem" });
  openModal(
    el("h2", {}, "Add a recipe from a link"),
    el("p", { class: "muted" }, "Paste a link and Harta will read the recipe straight off the page where the site allows it. Where it does not, paste the text and Harta will shape it."),
    el("div", { class: "field" }, urlInput),
    el("div", { class: "btn-row" },
      el("button", { class: "btn", onclick: async () => {
        const url = urlInput.value.trim();
        if (!/^https?:\/\//.test(url)) { toast("A full link, starting with https"); return; }
        status.textContent = "Reading the page\u2026";
        try {
          const res = await fetch(url, { mode: "cors" });
          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, "text/html");
          const parsed = recipeFromJsonLd(doc, url) || recipeFromPaste(doc.body?.innerText || "", url);
          if (parsed) { saveCustomRecipe(parsed, main); return; }
          status.textContent = "The page opened but no recipe was found in it. Paste the text below instead.";
        } catch {
          status.textContent = "That site does not let apps read it directly (a common privacy setting). Copy the recipe text from the page and paste it below; Harta will do the rest.";
        }
      } }, "Read the link"),
    ),
    status,
    el("div", { class: "field" }, pasteArea),
    el("button", { class: "btn secondary", onclick: () => {
      const parsed = recipeFromPaste(pasteArea.value, urlInput.value.trim() || null);
      if (parsed) saveCustomRecipe(parsed, main);
      else toast("Harta needs a title, some ingredients and a method to work with");
    } }, "Shape the paste into a recipe"),
  );
}

export function renderRecipes(main) {
  const s = store.get();
  let activeTag = null;
  const TAGS = [["quick", "Quick: 25 min of your hands or less"], ["kidsafe", "Kid friendly"], ["veg", "Vegetarian"], ["vegan", "Vegan"], ["gf", "Gluten free"], ["keto", "Ketogenic"], ["nosugar", "No added sugar"], ["fish", "Fish"], ["legume", "Legumes"], ["batch", "Batch and freeze"], ["romanian", "Romanian"], ["custom", "Added by you"]];

  function paint() {
    const list = allRecipes().filter((r) => !activeTag || r.tags.includes(activeTag));
    main.replaceChildren(
      el("div", { class: "page-head" },
        el("span", { class: "eyebrow" }, `${allRecipes().length} recipes`),
        el("h1", {}, "The kitchen"),
        el("p", {}, "Every recipe carries its why. Mark what the family loved and the planner learns."),
      ),
      el("div", { class: "btn-row", style: "margin-bottom:0.8rem" },
        el("button", { class: "btn secondary small", onclick: () => addFromLinkModal(main) }, "Add from a link"),
      ),
      el("div", { class: "chip-row" },
        TAGS.map(([t, label]) =>
          el("button", {
            class: "chip" + (activeTag === t ? " on" : ""),
            onclick: () => { activeTag = activeTag === t ? null : t; paint(); },
          }, label))),
      el("div", { class: "recipe-grid" },
        list.map((r) =>
          el("button", { class: "recipe-card", onclick: () => openRecipe(r) },
            el("span", { class: "rname" }, s.mealMemory[r.id] === "loved" ? "♥ " : "", r.name),
            el("span", { class: "rmeta" }, `${r.total} min · serves ${r.serves}` + (r.netCarbs ? ` · ~${r.netCarbs} g` : "")),
          ))),
    );
  }
  paint();
}

// foods the evidence says to keep occasional; marked, never banned
const INGREDIENT_WARNINGS = [
  [["bacon", "pancetta", "salami", "ham", "prosciutto", "chorizo"], "processed meat: keep occasional (WCRF)"],
  [["sugar", "honey", "maple syrup"], "added sugar: keep rare; allulose, stevia or monk fruit instead"],
  [["white bread", "white rice"], "refined grain: wholegrain does more"],
];
function ingredientWarning(name) {
  const low = name.toLowerCase();
  for (const [keys, label] of INGREDIENT_WARNINGS) if (keys.some((k) => low.includes(k))) return label;
  return null;
}

export function openRecipe(r) {
  const s = store.get();
  const verdict = s.mealMemory[r.id];
  const setVerdict = (v) => {
    store.mutate((st) => {
      if (st.mealMemory[r.id] === v) { delete st.mealMemory[r.id]; delete st.mealMemoryDates[r.id]; }
      else { st.mealMemory[r.id] = v; if (v === "loved" && !st.mealMemoryDates[r.id]) st.mealMemoryDates[r.id] = todayISO(); }
    });
    closeModal(); openRecipe(r);
  };
  openModal(
    el("h2", {}, r.name),
    el("div", { class: "meta-row", style: "margin-bottom:0.7rem" },
      el("span", { class: "tag" }, `${r.time} min hands on`),
      el("span", { class: "tag" }, `${r.total} min total`),
      el("span", { class: "tag" }, `serves ${r.serves}`),
      r.tags.includes("batch") && el("span", { class: "tag green" }, "doubles well"),
      r.netCarbs && el("span", { class: "tag amber" }, `~${r.netCarbs} g net carbs`),
      r.tags.includes("vegan") ? el("span", { class: "tag green" }, "vegan") : (r.tags.includes("veg") && el("span", { class: "tag green" }, "vegetarian")),
      r.tags.includes("gf") && el("span", { class: "tag" }, "gluten free"),
      r.tags.includes("nosugar") && el("span", { class: "tag" }, "no added sugar"),
    ),
    (() => {
      const n = timesCooked(r.id);
      if (n < 2) return null;
      const since = store.get().mealMemoryDates?.[r.id];
      return el("p", { class: "tiny", style: "font-style:italic;margin:-0.2rem 0 0.6rem" },
        `It has fed the table ${n === 2 ? "twice" : n + " times"}` + (since ? `, loved since ${fmtDay(since)}` : "") + ".");
    })(),
    r.macros && el("p", { class: "tiny", style: "margin:-0.2rem 0 0.8rem" },
      `Per serve, approximately: ${Math.round(r.macros.kcal * 4.184 / 10) * 10} kJ (${r.macros.kcal} kcal) · protein ${r.macros.protein} g · fat ${r.macros.fat} g · carbs ${r.macros.carbs} g (sugars ${r.macros.sugars} g) · fibre ${r.macros.fibre} g. Computed from the listed quantities against published food-composition data (AFCD and USDA); rounded, a guide rather than a lab result.`),
    el("h3", {}, "Ingredients"),
    el("ul", { class: "ingredients" }, r.ingredients.map((i) => {
      const warn = ingredientWarning(i.n);
      return el("li", {}, `${i.n}: ${i.q} `, warn ? el("span", { class: "tag amber", title: warn, style: "cursor:help" }, "⚠ " + warn) : null);
    })),
    el("h3", {}, "Method"),
    el("ol", { class: "method" }, r.method.map((m) => el("li", {}, m))),
    r.kidNote && el("div", { class: "notice", style: "margin-top:0.6rem" }, el("strong", {}, "Kids: "), r.kidNote),
    el("div", { class: "source-line" }, el("strong", {}, "Why it's here: "), `${r.why} `, el("em", {}, `Source: ${r.whySource}.`)),
    el("div", { class: "btn-row", style: "margin-top:1rem" },
      el("button", { class: "btn small " + (verdict === "loved" ? "" : "secondary"), onclick: () => setVerdict("loved") }, verdict === "loved" ? "Loved ♥" : "Family loved it"),
      el("button", { class: "btn small " + (verdict === "vetoed" ? "danger" : "ghost"), onclick: () => setVerdict("vetoed") }, verdict === "vetoed" ? "Vetoed (tap to undo)" : "Not for us"),
    ),
  );
}
