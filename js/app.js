// Alma · app shell: routing and navigation

import { el, icon } from "./ui.js";
import { store } from "./store.js";
import { renderOnboarding, renderToday, renderPlan, renderGroceries, renderRecipes } from "./views-plan.js";
import { renderTrack, renderLearn, renderMore, renderCareGate, renderSettings } from "./views-track.js";
import { renderRecharge, leaveRecharge, maybeShowArrival } from "./views-recharge.js";
import { renderFasting, renderSignals } from "./views-signals.js";
import { renderJournal, renderCapsule } from "./views-journal.js";

const ROUTES = [
  { hash: "#/", label: "Today", icon: "home", render: renderToday },
  { hash: "#/plan", label: "Plan", icon: "plan", render: renderPlan },
  { hash: "#/track", label: "Track", icon: "track", render: renderTrack },
  { hash: "#/recharge", label: "Recharge", icon: "sun", render: renderRecharge },
  { hash: "#/more", label: "More", icon: "more", render: renderMore },
];
const HIDDEN_ROUTES = [
  { hash: "#/groceries", render: renderGroceries, parent: "#/plan" },
  { hash: "#/recipes", render: renderRecipes, parent: "#/plan" },
  { hash: "#/learn", render: renderLearn, parent: "#/more" },
  { hash: "#/fasting", render: renderFasting, parent: "#/more" },
  { hash: "#/signals", render: renderSignals, parent: "#/more" },
  { hash: "#/journal", render: renderJournal, parent: "#/more" },
  { hash: "#/capsule", render: renderCapsule, parent: "#/more" },
  { hash: "#/care", render: renderCareGate, parent: "#/more" },
  { hash: "#/settings", render: renderSettings, parent: "#/more" },
];

const main = document.getElementById("main");

export function navigate(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function route() {
  leaveRecharge(); // stop any breathing timers when the view changes
  const hash = location.hash || "#/";
  if (!store.get().onboarded) {
    renderNav(null);
    renderOnboarding(main, navigate);
    return;
  }
  const r = ROUTES.find((x) => x.hash === hash) || HIDDEN_ROUTES.find((x) => x.hash === hash) || ROUTES[0];
  renderNav(r.parent || r.hash);
  r.render(main, navigate);
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

window.addEventListener("hashchange", route);
store.subscribe(() => {/* views re-render themselves; hook kept for future needs */});
route();
maybeShowArrival(); // the daily passage, once per day, after the first paint

// PWA: offline shell
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {/* offline install is a bonus, never a blocker */});
}
