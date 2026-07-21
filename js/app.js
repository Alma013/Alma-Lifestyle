// Harta · app shell: routing and navigation

import { el, icon } from "./ui.js";
import { store } from "./store.js";
import { renderOnboarding, renderToday, renderPlan, renderGroceries, renderRecipes } from "./views-plan.js";
import { renderTrack, renderLearn, renderMore, renderCareGate, renderSettings, renderAbout } from "./views-track.js";
import { renderRecharge, leaveRecharge, maybeShowArrival } from "./views-recharge.js";
import { renderFasting, renderSignals, leaveFasting } from "./views-signals.js";
import { renderJournal, renderCapsule, leaveJournal } from "./views-journal.js";
import { renderCounsel, renderSpeak } from "./views-speak.js";

// The sanctuary comes first: the app opens into Recharge, and the practical
// day (dinner, plan, numbers) waits one tap away. Uplift before admin.
const ROUTES = [
  { hash: "#/", label: "Recharge", icon: "sun", render: renderRecharge },
  { hash: "#/today", label: "Today", icon: "home", render: renderToday },
  { hash: "#/plan", label: "Meals", icon: "plan", render: renderPlan },
  { hash: "#/track", label: "Track", icon: "track", render: renderTrack },
  { hash: "#/more", label: "The map", icon: "map", render: renderMore },
];
const HIDDEN_ROUTES = [
  { hash: "#/recharge", render: renderRecharge, parent: "#/" },
  { hash: "#/groceries", render: renderGroceries, parent: "#/plan" },
  { hash: "#/recipes", render: renderRecipes, parent: "#/plan" },
  { hash: "#/learn", render: renderLearn, parent: "#/more" },
  { hash: "#/fasting", render: renderFasting, parent: "#/more" },
  { hash: "#/signals", render: renderSignals, parent: "#/more" },
  { hash: "#/journal", render: renderJournal, parent: "#/more" },
  { hash: "#/capsule", render: renderCapsule, parent: "#/more" },
  { hash: "#/care", render: renderCareGate, parent: "#/more" },
  { hash: "#/settings", render: renderSettings, parent: "#/more" },
  { hash: "#/about", render: renderAbout, parent: "#/more" },
  { hash: "#/counsel", render: renderCounsel, parent: "#/more" },
  { hash: "#/speak", render: renderSpeak, parent: "#/more" },
];

const main = document.getElementById("main");

export function navigate(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function route() {
  leaveRecharge(); // stop any breathing timers when the view changes
  leaveJournal();  // release the microphone if a recording was left running
  leaveFasting();  // clear the fasting tick
  const hash = location.hash || "#/";
  if (!store.get().onboarded) {
    renderNav(null);
    renderOnboarding(main, navigate);
    return;
  }
  const r = ROUTES.find((x) => x.hash === hash) || HIDDEN_ROUTES.find((x) => x.hash === hash) || ROUTES[0];
  renderNav(r.parent || r.hash);
  r.render(main, navigate);
  if (r.parent) {
    const parentRoute = ROUTES.find((x) => x.hash === r.parent);
    const back = document.createElement("button");
    back.className = "btn ghost small back-btn";
    back.setAttribute("aria-label", "Back to " + (parentRoute?.label || "the previous page"));
    back.textContent = "\u2190 " + (parentRoute?.label || "Back");
    back.addEventListener("click", () => navigate(r.parent));
    main.prepend(back);
  }
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function renderNav(activeHash) {
  const make = (r) =>
    el("a", { href: r.hash, class: r.hash === activeHash ? "active" : "", "aria-current": r.hash === activeHash ? "page" : null },
      icon(r.icon, 22), r.label);
  const tabbar = document.getElementById("tabbar");
  const nav = document.getElementById("nav");
  if (activeHash === null) { tabbar.replaceChildren(); nav.replaceChildren(); return; }
  tabbar.replaceChildren(...ROUTES.map(make));
  nav.replaceChildren(...ROUTES.map(make));
}

// ---------- appearance: the user's choice, with auto following the device ----------
const darkMeta = document.querySelector('meta[name="theme-color"][media*="dark"]');
const lightMeta = document.querySelector('meta[name="theme-color"][media*="light"]');
function applyTheme() {
  const pref = store.get().themePref || "auto";
  const dark = pref === "auto" ? window.matchMedia("(prefers-color-scheme: dark)").matches : pref === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if ((store.get().themePref || "auto") === "auto") applyTheme(); });
applyTheme();

window.addEventListener("hashchange", route);
import { todayISO } from "./store.js";
let routedDay = todayISO();
document.addEventListener("visibilitychange", () => {
  // refresh only when the DAY changed; never wipe typed answers on a mere app switch
  if (!document.hidden && todayISO() !== routedDay) { routedDay = todayISO(); route(); maybeShowArrival(); }
});
store.subscribe(() => applyTheme());
route();
maybeShowArrival(); // the daily passage, once per day, after the first paint

// PWA: offline shell
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {/* offline install is a bonus, never a blocker */});
}
