// Harta · UI helpers

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, v);
  }
  if ((node.classList.contains("chip") || node.classList.contains("sound-tile")) && tag === "button" && !("aria-pressed" in attrs)) {
    node.setAttribute("aria-pressed", node.classList.contains("on") || node.classList.contains("playing") ? "true" : "false");
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

// Feather-style inline icons, stroke inherits currentColor.
const ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
  plan: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  track: '<path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/>',
  learn: '<path d="M2 5.5C4.5 4 7.5 4 12 6c4.5-2 7.5-2 10-.5V18c-2.5-1.5-5.5-1.5-10 .5-4.5-2-7.5-2-10-.5Z"/><path d="M12 6v12.5"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  walk: '<circle cx="13" cy="4.5" r="2"/><path d="M10 21l2.5-6L10 12l1-5 3 1 2 3h3"/><path d="M8 12l-2 9"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z"/>',
  bowl: '<path d="M4 11h16a8 8 0 0 1-16 0Z"/><path d="M9 8c0-2 1.5-2 1.5-4M13.5 8c0-2 1.5-2 1.5-4"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  heart: '<path d="M12 20.5S4 15 4 9.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5c0 5.5-8 11-8 11Z"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  x: '<path d="M5 5l14 14M19 5L5 19"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  print: '<path d="M6 8V3h12v5"/><rect x="4" y="8" width="16" height="8" rx="1.5"/><path d="M6 14h12v7H6z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19"/>',
  hourglass: '<path d="M6.5 3h11M6.5 21h11M8 3c0 4 3 5.5 4 6.5 1-1 4-2.5 4-6.5M8 21c0-4 3-5.5 4-6.5 1 1 4 2.5 4 6.5"/>',
  pulse: '<path d="M3 12h4l2.5-6 4 12L16 12h5"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7 10 4.5h4L15.5 7"/><circle cx="12" cy="13" r="3.5"/>',
  mail: '<rect x="3" y="5.5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  note: '<path d="M9 18.5V5.5l10-2v12"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
};

export function icon(name, size = 24) {
  const span = document.createElement("span");
  span.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ""}</svg>`;
  return span.firstChild;
}

// ---------- modal ----------
let modalOnClose = null;   // fires exactly once however the modal closes
let modalReturnFocus = null;

export function openModal(...children) {
  let opts = {};
  if (children[0] && !children[0].nodeType && typeof children[0] === "object") opts = children.shift();
  closeModal();
  modalOnClose = opts.onClose || null;
  modalReturnFocus = document.activeElement;
  const root = document.getElementById("modal-root");
  const modal = el("div", { class: "modal", role: "dialog", "aria-modal": "true" },
    el("button", { class: "link modal-close", onclick: closeModal, "aria-label": "Close" }, "Close"),
    ...children
  );
  const backdrop = el("div", {
    class: "modal-backdrop",
    onclick: (e) => { if (e.target === backdrop) closeModal(); },
  }, modal);
  // keep Tab inside the dialog
  modal.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [...modal.querySelectorAll("button, input, select, textarea, [tabindex]")].filter((x) => !x.disabled);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });
  root.append(backdrop);
  document.getElementById("app").inert = true;
  document.body.style.overflow = "hidden";
  modal.querySelector("input, textarea, select, button:not(.modal-close)")?.focus();
  return modal;
}
export function closeModal() {
  const done = modalOnClose; modalOnClose = null;
  document.getElementById("modal-root").replaceChildren();
  document.getElementById("app").inert = false;
  document.body.style.overflow = "";
  if (done) done();
  if (modalReturnFocus && document.contains(modalReturnFocus)) modalReturnFocus.focus();
  modalReturnFocus = null;
}
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!document.getElementById("modal-root").hasChildNodes()) return;
  closeModal();
});

// ---------- toast ----------
export function toast(msg) {
  const t = el("div", { class: "toast" }, msg);
  document.getElementById("toast-root").append(t);
  setTimeout(() => t.remove(), 3200);
}

// ---------- sparkline (single series; title names it, so no legend needed) ----------
// values: array of {x: label, y: 1..5 | null}; renders 2px line, 8px end marker,
// direct label on the latest value. Ink for text, chart colour for the mark only.
export function sparkline(values, { min = 1, max = 5, label = "" } = {}) {
  const W = 320, H = 64, PAD = 8;
  const pts = values.filter((v) => v.y !== null && v.y !== undefined);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "spark-svg");
  svg.setAttribute("role", "img");
  if (label) svg.setAttribute("aria-label", label);
  if (!pts.length) {
    svg.innerHTML = `<text x="${W / 2}" y="${H / 2 + 4}" text-anchor="middle" font-size="12" fill="var(--ink-3)">No entries yet</text>`;
    return svg;
  }
  const n = values.length;
  const x = (i) => PAD + (n === 1 ? (W - 2 * PAD) / 2 : (i * (W - 2 * PAD)) / (n - 1));
  const y = (v) => H - PAD - ((v - min) / (max - min)) * (H - 2 * PAD);
  let d = "";
  values.forEach((v, i) => {
    if (v.y === null || v.y === undefined) return;
    d += (d ? " L" : "M") + `${x(i).toFixed(1)} ${y(v.y).toFixed(1)}`;
  });
  const last = values.map((v, i) => [v, i]).filter(([v]) => v.y != null).pop();
  svg.innerHTML = `
    <line x1="${PAD}" y1="${y(3)}" x2="${W - PAD}" y2="${y(3)}" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 4"/>
    <path d="${d}" fill="none" stroke="var(--chart-line)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${last ? `<circle cx="${x(last[1])}" cy="${y(last[0].y)}" r="4" fill="var(--chart-line)" stroke="var(--surface)" stroke-width="2"/>` : ""}
  `;
  return svg;
}

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
