// Alma · store
// All data lives in localStorage on this device. Nothing is sent anywhere, ever.

import { RECIPES } from "./data.js";

const KEY = "alma.v1";

const DEFAULT_STATE = {
  version: 2,
  onboarded: false,
  disclaimerAccepted: false,
  profile: {
    name: "",
    adults: 2,
    kids: 2,
    allergies: [],      // recipe is excluded if any ingredient name matches
    dislikes: [],       // recipe ids the household vetoed at setup
    busyNights: [],     // ["tue","thu"] nights needing quick or leftover dinners
    fishOk: true,
    meatOk: true,
    dietPrefs: [],      // any of: "vegan" | "veg" | "gf" | "nosugar" (keto lives in eatingStyle)
  },
  eatingStyle: "med",   // "med" (whole-food Mediterranean) | "keto" (adult plates only)
  exclusions: {
    always: [],         // ["pork", ...] ingredient words excluded for good
    temp: [],           // { name, until: ISO } excluded until a review date
  },
  fasting: {
    protocol: null,     // "12-12" | "14-10" | "16-8"
    activeStart: null,  // ISO datetime while a fast is running
    log: [],            // { start, end, hours } most recent first, cap 60
    safetyAccepted: false,
  },
  signals: {
    unit: "mmol",       // glucose display unit: "mmol" | "mgdl"
    readings: [],       // { id, t: ISO datetime, type: "glucose"|"ketone", v: number (glucose always stored mmol/L), ctx: "fasting"|"pre"|"post"|"" , note }
    labs: [],           // { id, date, name, value, unit }
  },
  capsules: [],         // { id, to, title, body, openOn, created, opened }
  journalIndex: [],     // metadata only; photo/audio blobs live in IndexedDB
  arrivalLast: null,    // ISO date the arrival passage last showed
  sanctuaryMinutes: 0,  // lifetime minutes of breathing/sound, for gentle recognition
  week: null,           // { start: ISO(Mon), days: { mon: {recipeId|null, leftoverOf|null} }, checked: {itemKey:bool}, extras: [] }
  weekHistory: [],      // archived weeks (most recent first, cap 26)
  habitLogs: {},        // { "2026-07-20": { move:true, sleep:false, ... } }
  activeNudge: null,    // nudge id
  checkins: [],         // { date, held, energy, sleep, mood, felt, kind } (most recent first)
  mealMemory: {},       // { recipeId: "loved" | "fine" | "vetoed" }
  care: {
    pinHash: null,
    appointments: [],   // { id, what, who, date, notes, done }
    questions: [],      // { id, text, done }
    visits: [],         // { id, date, appt, notes, next }
  },
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    const merged = {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      profile: { ...DEFAULT_STATE.profile, ...(parsed.profile || {}) },
      care: { ...structuredClone(DEFAULT_STATE.care), ...(parsed.care || {}) },
      exclusions: { ...structuredClone(DEFAULT_STATE.exclusions), ...(parsed.exclusions || {}) },
      fasting: { ...structuredClone(DEFAULT_STATE.fasting), ...(parsed.fasting || {}) },
      signals: { ...structuredClone(DEFAULT_STATE.signals), ...(parsed.signals || {}) },
    };
    merged.version = 2; // v1 backups upgrade in place; nothing is lost
    return merged;
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn(state));
}

export const store = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  update(patch) { Object.assign(state, patch); persist(); },
  mutate(fn) { fn(state); persist(); },
  exportJSON() { return JSON.stringify(state, null, 2); },
  importJSON(text) {
    const parsed = JSON.parse(text); // throws on bad input; caller catches
    if (typeof parsed !== "object" || parsed === null || ![1, 2].includes(parsed.version)) {
      throw new Error("Not an Alma backup file");
    }
    state = { ...structuredClone(DEFAULT_STATE), ...parsed };
    persist();
  },
  wipe() {
    localStorage.removeItem(KEY);
    state = structuredClone(DEFAULT_STATE);
    persist();
  },
};

// ---------- dates ----------
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

export function todayISO() {
  return localISO(new Date());
}
function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function mondayOf(date = new Date()) {
  const d = new Date(date);
  const shift = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - shift);
  return localISO(d);
}
export function dayKeyToday() {
  return DAY_KEYS[(new Date().getDay() + 6) % 7];
}
export function dateOfDayKey(weekStartISO, dayKey) {
  const d = new Date(weekStartISO + "T12:00:00");
  d.setDate(d.getDate() + DAY_KEYS.indexOf(dayKey));
  return localISO(d);
}
export function fmtDay(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

// ---------- recipes ----------
export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export function activeExclusions() {
  const today = todayISO();
  const temp = state.exclusions.temp.filter((t) => !t.until || t.until >= today);
  return [...state.exclusions.always, ...temp.map((t) => t.name)];
}

export function eligibleRecipes() {
  const p = state.profile;
  const excluded = activeExclusions();
  return RECIPES.filter((r) => {
    if (state.eatingStyle === "keto" && !r.tags.includes("keto")) return false;
    for (const pref of p.dietPrefs || []) if (!r.tags.includes(pref)) return false;
    if (!p.fishOk && r.tags.includes("fish")) return false;
    if (!p.meatOk && (r.tags.includes("chicken") || ["beef-stirfry", "sarmale-light", "burgers-home", "pork-apple-tray", "keto-mititei", "keto-pork-cabbage", "keto-lettuce-tacos", "keto-butter-chicken", "keto-cobb", "keto-zoodle-carbonara"].includes(r.id))) return false;
    if (state.mealMemory[r.id] === "vetoed") return false;
    if (p.allergies.some((a) => r.ingredients.some((i) => i.n.toLowerCase().includes(a.toLowerCase())))) return false;
    if (excluded.some((x) => r.ingredients.some((i) => i.n.toLowerCase().includes(x.toLowerCase())))) return false;
    return true;
  });
}

// ---------- weekly planner ----------
// Deterministic-ish variety: score each eligible recipe against what the week needs,
// with gentle randomness so two weeks never look identical.
export function generateWeekPlan() {
  const pool = eligibleRecipes();
  const p = state.profile;
  const recentIds = new Set(
    (state.weekHistory[0] ? Object.values(state.weekHistory[0].days) : [])
      .map((d) => d && d.recipeId).filter(Boolean)
  );

  const days = {};
  const used = new Set();
  const counts = { fish: 0, legume: 0, veg: 0, romanian: 0 };

  const pick = (filter) => {
    const candidates = pool.filter((r) => !used.has(r.id) && (!filter || filter(r)));
    if (!candidates.length) return null;
    const scored = candidates.map((r) => {
      let s = Math.random() * 2;
      if (state.mealMemory[r.id] === "loved") s += 2.5;
      if (recentIds.has(r.id)) s -= 3;
      if (r.tags.includes("fish") && counts.fish === 0) s += 2;
      if (r.tags.includes("legume") && counts.legume < 2) s += 1.5;
      if (r.tags.includes("veg") && counts.veg < 3) s += 1;
      if (r.tags.includes("romanian") && counts.romanian === 0) s += 0.8;
      if (r.tags.includes("kidsafe") && p.kids > 0) s += 0.6;
      return [s, r];
    }).sort((a, b) => b[0] - a[0]);
    return scored[0][1];
  };

  const claim = (r) => {
    if (!r) return null;
    used.add(r.id);
    for (const t of ["fish", "legume", "veg", "romanian"]) if (r.tags.includes(t)) counts[t]++;
    return r;
  };

  // 1. Busy nights first: quick recipes, or a leftover slot after a batch night.
  const busy = DAY_KEYS.filter((d) => p.busyNights.includes(d));
  const batchDay = DAY_KEYS.find((d) => !p.busyNights.includes(d) && ["sun", "sat", "mon", "wed"].includes(d));
  let batchRecipe = null;
  if (busy.length && batchDay) {
    batchRecipe = claim(pick((r) => r.tags.includes("batch")));
    if (batchRecipe) days[batchDay] = { recipeId: batchRecipe.id };
  }
  let leftoverUsed = false;
  for (const d of busy) {
    if (days[d]) continue;
    if (batchRecipe && !leftoverUsed && DAY_KEYS.indexOf(d) > DAY_KEYS.indexOf(batchDay)) {
      days[d] = { recipeId: batchRecipe.id, leftover: true };
      leftoverUsed = true;
    } else {
      days[d] = { recipeId: claim(pick((r) => r.total <= 25))?.id || null };
    }
  }

  // 2. Fill the rest.
  for (const d of DAY_KEYS) {
    if (days[d]) continue;
    days[d] = { recipeId: claim(pick())?.id || null };
  }

  return { start: mondayOf(), days, checked: {}, extras: [] };
}

export function startNewWeek() {
  store.mutate((s) => {
    if (s.week) {
      s.weekHistory.unshift(s.week);
      s.weekHistory = s.weekHistory.slice(0, 26);
    }
    s.week = generateWeekPlan();
  });
}

export function swapDay(dayKey) {
  store.mutate((s) => {
    const current = s.week?.days[dayKey]?.recipeId;
    const used = new Set(Object.values(s.week.days).map((d) => d?.recipeId).filter(Boolean));
    let pool = eligibleRecipes().filter((r) => !used.has(r.id));
    if (s.profile.busyNights.includes(dayKey)) {
      const quick = pool.filter((r) => r.total <= 25);
      if (quick.length) pool = quick; // rushed nights stay rushed-friendly when possible
    }
    if (!pool.length) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    s.week.days[dayKey] = { recipeId: next.id };
    if (current) delete s.week.checked; // grocery list changed; reset ticks
    s.week.checked = {};
  });
}

// ---------- grocery list ----------
// Aggregates ingredients across the planned week (skipping leftover repeats),
// groups by section, and marks pantry staples as "check the pantry first".
export function groceryList() {
  const w = state.week;
  if (!w) return [];
  const bySection = new Map();
  const seen = new Map(); // name -> item (merge duplicates)
  const countedRecipes = new Set();

  for (const d of DAY_KEYS) {
    const slot = w.days[d];
    if (!slot?.recipeId || slot.leftover) continue;
    if (countedRecipes.has(slot.recipeId)) continue;
    countedRecipes.add(slot.recipeId);
    const r = recipeById(slot.recipeId);
    if (!r) continue;
    for (const ing of r.ingredients) {
      const key = ing.n.toLowerCase();
      if (seen.has(key)) {
        const item = seen.get(key);
        item.qs.push(ing.q);
        if (!item.recipes.includes(r.name)) item.recipes.push(r.name);
      } else {
        const item = { key, n: ing.n, qs: [ing.q], s: ing.s, pantry: !!ing.pantry, recipes: [r.name] };
        seen.set(key, item);
        if (!bySection.has(ing.s)) bySection.set(ing.s, []);
        bySection.get(ing.s).push(item);
      }
    }
  }
  for (const extra of w.extras || []) {
    const item = { key: "extra:" + extra.toLowerCase(), n: extra, qs: [], s: "pantry", pantry: false, recipes: ["Added by you"] };
    if (!bySection.has("pantry")) bySection.set("pantry", []);
    bySection.get("pantry").push(item);
  }
  return bySection;
}

// ---------- habits ----------
export function toggleHabit(dateISO, habitId) {
  store.mutate((s) => {
    const day = s.habitLogs[dateISO] || {};
    day[habitId] = !day[habitId];
    s.habitLogs[dateISO] = day;
  });
}

export function weekHabitSummary(weekStartISO) {
  const out = {};
  for (const dk of DAY_KEYS) {
    out[dk] = state.habitLogs[dateOfDayKey(weekStartISO, dk)] || {};
  }
  return out;
}

// ---------- care PIN ----------
export async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("alma:" + pin));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------- fasting ----------
export function startFast() {
  store.mutate((s) => { s.fasting.activeStart = new Date().toISOString(); });
}
export function endFast() {
  store.mutate((s) => {
    if (!s.fasting.activeStart) return;
    const start = s.fasting.activeStart;
    const end = new Date().toISOString();
    const hours = Math.round(((new Date(end) - new Date(start)) / 36e5) * 10) / 10;
    if (hours >= 0.5) s.fasting.log.unshift({ start, end, hours });
    s.fasting.log = s.fasting.log.slice(0, 60);
    s.fasting.activeStart = null;
  });
}
export function fastElapsedHours() {
  const s = state.fasting.activeStart;
  return s ? (Date.now() - new Date(s).getTime()) / 36e5 : 0;
}

// ---------- signals (glucose, ketones, labs) ----------
export const MMOL_PER_MGDL = 1 / 18.016;
export function toMmol(v, unit) { return unit === "mgdl" ? v * MMOL_PER_MGDL : v; }
export function displayGlucose(vMmol) {
  return state.signals.unit === "mgdl"
    ? { v: Math.round(vMmol * 18.016), unit: "mg/dL" }
    : { v: Math.round(vMmol * 10) / 10, unit: "mmol/L" };
}

export function addReading(type, vMmol, ctx = "", note = "", t = new Date().toISOString()) {
  store.mutate((s) => {
    s.signals.readings.unshift({ id: uid(), t, type, v: vMmol, ctx, note });
    s.signals.readings = s.signals.readings.slice(0, 2000);
  });
}

// Latest same-morning glucose+ketone pair → GKI and Dr Boz ratio.
// GKI = glucose mmol / ketones mmol; Boz = glucose mg/dL / ketones mmol. Trend tools, not verdicts.
export function latestMetabolicPair() {
  const byDay = {};
  for (const r of state.signals.readings) {
    const day = r.t.slice(0, 10);
    (byDay[day] ||= {})[r.type] = (byDay[day][r.type] ?? r.v); // first (most recent) per type per day
  }
  const days = Object.keys(byDay).sort().reverse();
  for (const d of days) {
    const g = byDay[d].glucose, k = byDay[d].ketone;
    if (g != null && k != null && k > 0) {
      return { date: d, glucose: g, ketone: k, gki: Math.round((g / k) * 10) / 10, boz: Math.round((g * 18.016) / k) };
    }
  }
  return null;
}

// Average rise from pre-meal to post-meal readings, for the gentle pattern hints.
export function mealResponseSummary() {
  const pre = state.signals.readings.filter((r) => r.type === "glucose" && r.ctx === "pre");
  const post = state.signals.readings.filter((r) => r.type === "glucose" && r.ctx === "post");
  if (!pre.length || !post.length) return null;
  const avg = (a) => a.reduce((x, y) => x + y.v, 0) / a.length;
  return { n: Math.min(pre.length, post.length), rise: Math.round((avg(post) - avg(pre)) * 10) / 10 };
}

// ---------- what the body needs (meal suggestions from your own data) ----------
// Short term reads this week's signals and check-ins; long term reads the season.
// Suggestions are options with reasons, never homework.
export function bodyNeeds() {
  const s = state;
  const pool = eligibleRecipes();
  const byTag = (t) => pool.filter((r) => r.tags.includes(t));
  const now = [];
  const season = [];

  const lastCheckin = s.checkins[0];
  const meal = mealResponseSummary();

  if (meal && meal.n >= 3 && meal.rise > 2) {
    now.push({
      title: "A steadier evening curve",
      why: `Your after-meal readings run about ${Math.round(meal.rise * 10) / 10} mmol/L above before-meal ones, so tonight suits a lower-carb, vegetables-first plate.`,
      recipes: pool.filter((r) => (r.netCarbs && r.netCarbs <= 12) || r.tags.includes("keto")).slice(0, 3),
    });
  }
  if (lastCheckin && lastCheckin.energy <= 2) {
    now.push({
      title: "Iron and protein for a low-energy week",
      why: "You rated energy " + lastCheckin.energy + "/5 at the last check-in. Red meat, legumes and dark greens carry the iron; protein steadies the afternoons.",
      recipes: pool.filter((r) => ["beef-stirfry", "keto-mititei", "burgers-home", "lentil-bolognese", "keto-cobb", "sheetpan-salmon"].includes(r.id)).slice(0, 3),
    });
  }
  if (lastCheckin && lastCheckin.sleep <= 2) {
    now.push({
      title: "Lighter, earlier, kinder to sleep",
      why: "Sleep rated " + lastCheckin.sleep + "/5. A lighter dinner eaten earlier is one of the most reliable sleep levers there is.",
      recipes: pool.filter((r) => ["chicken-soup", "minestrone", "veg-frittata", "keto-mushroom-soup", "fish-parcels", "ciorba-legume"].includes(r.id)).slice(0, 3),
    });
  }
  // week coverage: what the pattern still needs
  const weekIds = s.week ? Object.values(s.week.days).map((d) => d?.recipeId).filter(Boolean) : [];
  const weekTags = weekIds.map((id) => recipeById(id)).filter(Boolean).flatMap((r) => r.tags);
  const fishCount = weekTags.filter((t) => t === "fish").length;
  const legumeCount = weekTags.filter((t) => t === "legume").length;
  if (s.week && fishCount < 2 && state.profile.fishOk) {
    now.push({
      title: "The week is short on fish",
      why: `${fishCount || "No"} fish dinner${fishCount === 1 ? "" : "s"} planned so far; the omega-3 rhythm asks for two.`,
      recipes: byTag("fish").slice(0, 3),
    });
  }
  if (s.week && legumeCount < 2 && state.eatingStyle !== "keto") {
    now.push({
      title: "Room for legumes",
      why: "Twice a week is the rhythm the longevity research keeps rewarding, and the week has space.",
      recipes: byTag("legume").slice(0, 3),
    });
  }
  if (!now.length) {
    now.push({
      title: "The pattern is holding",
      why: "Nothing is missing this week. Cook what brings joy; enjoyment is what makes patterns last.",
      recipes: pool.filter((r) => s.mealMemory[r.id] === "loved").slice(0, 3),
    });
  }

  // season: the long game, from the last month of check-ins
  const recent = s.checkins.slice(0, 4);
  const avg = (k) => recent.length ? recent.reduce((a, c) => a + (c[k] || 3), 0) / recent.length : null;
  if (recent.length >= 2) {
    const e = avg("energy"), sl = avg("sleep");
    if (e !== null && e < 3) season.push("Energy has run low across the month. Worth protecting: the after-dinner walk, iron-rich dinners weekly, and mentioning the pattern at your next GP visit.");
    if (sl !== null && sl < 3) season.push("Sleep has been the weak signal lately. The long levers: a consistent wind-down, the 4-7-8 breath, dinner on the earlier side, coffee before noon only.");
  }
  season.push("The season's quiet targets: fish twice a week, legumes twice, thirty different plants across the week, and the walk that survives real life.");
  return { now: now.slice(0, 3), season };
}
