// Alma · views: onboarding, today, plan, groceries, recipes

import { el, icon, openModal, closeModal, toast } from "./ui.js";
import { RECIPES, SECTIONS, HABITS, NUDGES } from "./data.js";
import {
  bodyNeeds, greeting, displayGlucose, eligibleRecipes,
  store, DAY_KEYS, DAY_NAMES, todayISO, dayKeyToday, dateOfDayKey, fmtDay,
  recipeById, startNewWeek, swapDay, groceryList, toggleHabit,
} from "./store.js";

// ---------- onboarding ----------
export function renderOnboarding(main, navigate) {
  const s = store.get();
  let step = s.disclaimerAccepted ? 1 : 0;
  const draft = {
    name: "", adults: 2, kids: 2, allergies: [], busyNights: [], fishOk: true, meatOk: true,
  };

  const steps = [renderWelcome, renderHousehold, renderNights, renderDone];

  function paint() {
    main.replaceChildren(el("div", { class: "onb" }, steps[step]()));
  }

  function renderWelcome() {
    return el("div", {},
      el("img", { src: "icons/icon.svg", class: "brand-mark-lg", alt: "" }),
      el("h1", { class: "center" }, "Alma"),
      el("p", { class: "center muted" }, "Know first, then choose."),
      el("div", { class: "card", style: "margin-top:1.2rem" },
        el("h3", {}, "Three promises, and what they buy you"),
        el("p", { class: "muted" }, "Every suggestion arrives with its reason and a named source, so you choose from knowledge instead of headlines. Alma never diagnoses, never prescribes and never mentions your weight, which means you get clarity here without the 2 am anxiety spiral."),
        el("p", { class: "muted" }, "Your doctor stays your doctor. For symptoms, results, medication and supplements, Alma\u2019s job is to send you into the appointment with sharper questions and a cleaner timeline, so the ten minutes you get are worth twenty."),
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
    const nameInput = el("input", { type: "text", placeholder: "What should Alma call you?" });
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
          startNewWeek();
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

    (() => {
      const g = s.signals.readings.find((r) => r.type === "glucose");
      const k = s.signals.readings.find((r) => r.type === "ketone");
      return el("div", { class: "card" },
        el("div", { class: "card-title-row" }, el("h2", {}, "Your signals"),
          el("button", { class: "link", onclick: () => navigate("#/signals") }, "Open")),
        el("p", { class: "muted", style: "margin-bottom:0.5rem" },
          g || k
            ? "Latest: " + [g && `glucose ${displayGlucose(g.v).v} ${displayGlucose(g.v).unit}`, k && `ketones ${k.v} mmol/L`].filter(Boolean).join(" · ")
            : "Wearing a sensor, or prick-testing? Bring the numbers in and Alma reads them kindly: glucose, ketones, GKI, labs."),
        el("div", { class: "btn-row" },
          el("button", { class: "btn secondary small", onclick: () => navigate("#/signals") }, "Add a reading"),
          el("button", { class: "btn ghost small", onclick: () => navigate("#/signals") }, "Import sensor CSV"),
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
  const rows = DAY_KEYS.map((k) => {
    const slot = s.week.days[k];
    const r = slot?.recipeId ? recipeById(slot.recipeId) : null;
    return el("div", { class: "day-row" + (k === dk ? " today-row" : "") },
      el("span", { class: "d" }, DAY_NAMES[k].slice(0, 3), el("small", {}, fmtDay(dateOfDayKey(s.week.start, k)))),
      r
        ? el("span", {},
            el("button", { class: "meal-name", onclick: () => openRecipe(r) }, r.name),
            el("span", { class: "meal-sub" }, slot.leftover ? "Leftovers from the batch pot" : `${r.total} min · serves ${r.serves}` + (store.get().eatingStyle === "keto" && r.netCarbs ? ` · ~${r.netCarbs} g net carbs` : "")))
        : el("span", { class: "meal-name empty" }, "Nothing planned"),
      el("button", { class: "btn ghost small", "aria-label": "Swap " + DAY_NAMES[k], onclick: () => { swapDay(k); renderPlan(main, navigate); } }, icon("swap", 16)),
    );
  });

  const pool = eligibleRecipes();
  const poolWarning = pool.length < 7
    ? el("div", { class: "notice warm" },
        `Your current combination of way of eating, dietary keeps and exclusions leaves ${pool.length} recipe${pool.length === 1 ? "" : "s"}, and a full week needs at least seven. Loosen one filter in `,
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
      el("p", {}, "Whole food, family sized, built around your rushed nights. Swap anything."),
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
          el("span", { class: "q" }, item.qs.join(" + ")),
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
export function renderRecipes(main) {
  const s = store.get();
  let activeTag = null;
  const TAGS = [["quick", "Under 25 min"], ["kidsafe", "Kid friendly"], ["veg", "Vegetarian"], ["vegan", "Vegan"], ["gf", "Gluten free"], ["keto", "Ketogenic"], ["nosugar", "No added sugar"], ["fish", "Fish"], ["legume", "Legumes"], ["batch", "Batch and freeze"], ["romanian", "Romanian"]];

  function paint() {
    const list = RECIPES.filter((r) => !activeTag || r.tags.includes(activeTag));
    main.replaceChildren(
      el("div", { class: "page-head" },
        el("span", { class: "eyebrow" }, `${RECIPES.length} recipes`),
        el("h1", {}, "The kitchen"),
        el("p", {}, "Every recipe carries its why. Mark what the family loved and the planner learns."),
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
      if (st.mealMemory[r.id] === v) delete st.mealMemory[r.id];
      else st.mealMemory[r.id] = v;
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
    r.macros && el("p", { class: "tiny", style: "margin:-0.2rem 0 0.8rem" },
      `Per serve, approximately: ${r.macros.kcal} kcal · protein ${r.macros.protein} g · fat ${r.macros.fat} g · carbs ${r.macros.carbs} g (sugars ${r.macros.sugars} g) · fibre ${r.macros.fibre} g. Estimates for orientation, not accounting.`),
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
