// Alma · store
// All data lives in localStorage on this device. Nothing is sent anywhere, ever.

import { RECIPES } from "./data.js";

const KEY = "alma.v1";

const DEFAULT_STATE = {
  version: 1,
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
  },
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
    return { ...structuredClone(DEFAULT_STATE), ...parsed, profile: { ...DEFAULT_STATE.profile, ...(parsed.profile || {}) }, care: { ...structuredClone(DEFAULT_STATE.care), ...(parsed.care || {}) } };
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
    if (typeof parsed !== "object" || parsed === null || parsed.version !== 1) {
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

export function eligibleRecipes() {
  const p = state.profile;
  return RECIPES.filter((r) => {
    if (!p.fishOk && r.tags.includes("fish")) return false;
    if (!p.meatOk && (r.tags.includes("chicken") || ["beef-stirfry", "sarmale-light", "burgers-home", "pork-apple-tray"].includes(r.id))) return false;
    if (state.mealMemory[r.id] === "vetoed") return false;
    if (p.allergies.some((a) => r.ingredients.some((i) => i.n.toLowerCase().includes(a.toLowerCase())))) return false;
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
