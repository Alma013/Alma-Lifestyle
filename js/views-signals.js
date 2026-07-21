// Harta · fasting (with safety gates) and signals (glucose, ketones, labs).
// The rule of this file: numbers are shown kindly, trends over verdicts,
// and nothing here ever interprets diagnostically. The doctor does that.

import { el, toast, openModal, closeModal, sparkline } from "./ui.js";
import { store, uid, todayISO, fmtDay, startFast, endFast, adjustFastStart, fastElapsedHours, addReading, toMmol, displayGlucose, latestMetabolicPair, mealResponseSummary, localDayOf } from "./store.js";
import { FAST_PROTOCOLS, FASTING_SAFETY } from "./data2.js";
import { interpretGlucose, interpretKetone, interpretGKI, interpretLab, LAB_GUIDE, personalGlucose } from "./interpret.js";
import { openWhy } from "./views-track.js";

// ---------- fasting ----------
let fastTick = null;
export function leaveFasting() { clearInterval(fastTick); fastTick = null; }

export function renderFasting(main) {
  clearInterval(fastTick);
  const s = store.get();

  // the safety gate comes first, every account, once
  if (!s.fasting.safetyAccepted) {
    main.replaceChildren(
      el("div", { class: "page-head" },
        el("span", { class: "eyebrow" }, "Read once, properly"),
        el("h1", {}, FASTING_SAFETY.title),
      ),
      el("div", { class: "card" },
        ...FASTING_SAFETY.lines.map((l) => el("p", { class: "muted", style: "font-size:0.92rem" }, l)),
        el("div", { class: "notice warm" }, "If any line above is about you, close this page with a clear conscience. Eating regularly is a legitimate health strategy."),
        el("button", { class: "btn", onclick: () => { store.mutate((st) => { st.fasting.safetyAccepted = true; }); renderFasting(main); } }, "I've checked: none of this is me"),
      ),
    );
    return;
  }

  const protocol = FAST_PROTOCOLS.find((p) => p.id === s.fasting.protocol) || null;
  const active = !!s.fasting.activeStart;

  const timeEl = el("div", { class: "f-time" }, "0:00");
  const subEl = el("div", { class: "f-sub" }, protocol ? `${protocol.label} window` : "No protocol chosen; the timer still works");
  const RING_R = 78, CIRC = 2 * Math.PI * RING_R;
  const prog = document.createElementNS("http://www.w3.org/2000/svg", "circle");

  function paintTick() {
    const h = fastElapsedHours();
    const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    timeEl.textContent = `${hh}:${String(mm).padStart(2, "0")}`;
    const target = protocol ? protocol.fastH : 16;
    const frac = Math.min(1, h / target);
    prog.setAttribute("stroke-dashoffset", String(CIRC * (1 - frac)));
    if (protocol && h >= protocol.fastH) subEl.textContent = `${protocol.label} complete. Break it gently: something small and savoury first.`;
  }

  const ring = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  ring.setAttribute("viewBox", "0 0 180 180");
  ring.setAttribute("class", "fast-ring");
  ring.innerHTML = `<circle class="track" cx="90" cy="90" r="${RING_R}" fill="none" stroke-width="7"/>`;
  prog.setAttribute("cx", "90"); prog.setAttribute("cy", "90"); prog.setAttribute("r", String(RING_R));
  prog.setAttribute("fill", "none"); prog.setAttribute("stroke-width", "7");
  prog.setAttribute("class", "prog");
  prog.setAttribute("stroke-dasharray", String(CIRC));
  prog.setAttribute("stroke-dashoffset", String(CIRC));
  prog.setAttribute("transform", "rotate(-90 90 90)");
  ring.append(prog);

  if (active) { paintTick(); fastTick = setInterval(paintTick, 30000); }

  const protocolChips = FAST_PROTOCOLS.map((p) =>
    el("button", {
      class: "chip" + (s.fasting.protocol === p.id ? " on" : ""),
      title: p.sub,
      onclick: () => { store.mutate((st) => { st.fasting.protocol = st.fasting.protocol === p.id ? null : p.id; }); renderFasting(main); },
    }, p.label));

  const log = s.fasting.log.slice(0, 10);

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "Time-restricted eating"),
      el("h1", {}, "Fasting"),
      el("p", {}, "The gentle version: a daily eating window, mostly closed while you sleep. ",
        el("button", { class: "link", onclick: () => openWhy("fasting-evidence") }, "What the evidence says")),
    ),
    el("div", { class: "card" },
      el("div", { class: "chip-row" }, protocolChips),
      protocol ? el("p", { class: "tiny" }, protocol.sub) : null,
      el("div", { class: "fast-dial" }, ring, timeEl, subEl),
      el("div", { class: "btn-row", style: "justify-content:center;margin-top:0.8rem" },
        active
          ? el("button", { class: "btn", onclick: () => {
              openModal(
                el("h2", {}, "End this fast?"),
                el("p", { class: "muted" }, "It will be logged as it stands. A mis-tap here would lose a long fast, so Harta asks once."),
                el("div", { class: "btn-row" },
                  el("button", { class: "btn", onclick: () => { clearInterval(fastTick); endFast(); closeModal(); toast("Fast ended and logged"); renderFasting(main); } }, "End and log"),
                  el("button", { class: "btn ghost", onclick: closeModal }, "Keep fasting"),
                ),
              );
            } }, "End the fast")
          : el("button", { class: "btn", onclick: () => { startFast(); renderFasting(main); } }, "Start fasting now"),
        active ? el("button", { class: "btn ghost small", onclick: () => {
            const dt = el("input", { type: "datetime-local" });
            const st = new Date(s.fasting.activeStart);
            dt.value = new Date(st.getTime() - st.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            openModal(
              el("h2", {}, "When did it really start?"),
              el("p", { class: "muted" }, "Dinner often ends before the timer begins. Set the honest start and the log stays true."),
              el("div", { class: "field" }, dt),
              el("button", { class: "btn", onclick: () => { if (dt.value) { adjustFastStart(new Date(dt.value).toISOString()); closeModal(); renderFasting(main); toast("Start time corrected"); } } }, "Save"),
            );
          } }, "Adjust start time") : null,
      ),
      el("p", { class: "tiny center", style: "margin-top:0.6rem" }, "Water, black coffee and plain tea are fine company for a fast. Feeling unwell always outranks the timer: eat."),
    ),
    el("div", { class: "card flat" },
      el("h3", {}, "Your eating window"),
      el("p", { class: "tiny" }, "Tell Harta when dinner usually ends and Today will show when the kitchen closes and reopens, live."),
      (() => {
        const inp = el("input", { type: "time", value: s.fasting.kitchenCloses || "19:30", "aria-label": "Time dinner usually ends" });
        inp.addEventListener("change", () => { store.mutate((st) => { st.fasting.kitchenCloses = inp.value; }); toast("Window anchored at " + inp.value); });
        return el("div", { class: "field", style: "max-width:10rem" }, el("label", {}, "Dinner usually ends at"), inp);
      })(),
    ),
    el("div", { class: "card flat" },
      el("h3", {}, "Recent fasts"),
      log.length
        ? el("div", {}, ...log.map((f) => el("div", { class: "reading-row" },
            el("span", { class: "r-val" }, f.hours + " h"),
            el("span", { class: "r-meta" }, fmtDay(localDayOf(f.start)) + " → " + fmtDay(localDayOf(f.end))),
            el("span", {}),
          )))
        : el("p", { class: "muted" }, "No fasts logged yet. 12:12 tonight is a perfectly honourable start."),
    ),
    el("div", { class: "notice warm" },
      "Longer water-only fasting exists, and Harta deliberately does not run a timer for it: beyond about 24 hours it belongs under medical supervision. If that path interests you, it starts with a conversation with your doctor, not with an app."),
  );
}

// ---------- signals ----------
export function renderSignals(main) {
  const s = store.get();
  const readings = s.signals.readings;
  const pair = latestMetabolicPair();
  const meal = mealResponseSummary();

  // last 24h of glucose as a chart; readings are stored newest-first
  const dayAgo = Date.now() - 24 * 36e5;
  const gDay = readings.filter((r) => r.type === "glucose" && new Date(r.t).getTime() > dayAgo).reverse();
  const chartVals = gDay.map((r) => ({ x: r.t, y: r.v }));
  const gMin = Math.min(3.5, ...chartVals.map((v) => v.y));
  const gMax = Math.max(9, ...chartVals.map((v) => v.y));

  const latestG = readings.find((r) => r.type === "glucose");
  const latestK = readings.find((r) => r.type === "ketone");

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "Your numbers, kindly"),
      el("h1", {}, "Signals"),
      el("p", {}, "Glucose, ketones and lab results, read for patterns and explained in plain English against the published ranges. Decisions stay with your doctor; you arrive understanding. ",
        el("button", { class: "link", onclick: () => openWhy("cgm") }, "Sensors without anxiety")),
    ),
    el("div", { class: "card" },
      el("div", { class: "big-stat" },
        el("div", { class: "b" }, el("span", { class: "v" }, latestG ? String(displayGlucose(latestG.v).v) : "–"),
          el("span", { class: "l" }, "glucose " + (latestG ? displayGlucose(latestG.v).unit : ""))),
        el("div", { class: "b" }, el("span", { class: "v" }, latestK ? String(latestK.v) : "–"),
          el("span", { class: "l" }, "ketones mmol/L")),
        pair ? el("div", { class: "b" }, el("span", { class: "v" }, String(pair.gki)),
          el("span", { class: "l" }, "GKI")) : null,
        pair ? el("div", { class: "b" }, el("span", { class: "v" }, String(pair.boz)),
          el("span", { class: "l" }, "Dr Boz ratio")) : null,
      ),
      pair ? el("p", { class: "tiny", style: "margin-top:0.5rem" },
        "Ratios from your latest same-day pair (" + fmtDay(pair.date) + "). Trend tools from research and clinical practice, not verdicts. ",
        el("button", { class: "link", onclick: () => openWhy("gki") }, "What they mean")) : null,
      el("div", { class: "btn-row", style: "margin-top:0.6rem" },
        el("button", { class: "btn", onclick: () => addReadingModal(main) }, "Add a reading"),
        el("button", { class: "btn secondary", onclick: () => openImportCSV(main) }, "Import sensor CSV"),
        el("button", { class: "btn ghost small", onclick: () => { store.mutate((st) => { st.signals.unit = st.signals.unit === "mmol" ? "mgdl" : "mmol"; }); renderSignals(main); } },
          "Show " + (s.signals.unit === "mmol" ? "mg/dL" : "mmol/L")),
      ),
    ),
    ...[(() => {
      if (!latestG && !latestK) return null;
      const cards = [];
      if (latestG) {
        const gi = interpretGlucose(latestG.v, latestG.ctx);
        const pg = personalGlucose(latestG.v, latestG.ctx || "fasting", readings);
        cards.push([`Glucose ${displayGlucose(latestG.v).v} ${displayGlucose(latestG.v).unit}` + (latestG.ctx ? ` (${latestG.ctx === "post" ? "after a meal" : latestG.ctx})` : ""), gi, pg]);
      }
      if (latestK) cards.push([`Ketones ${latestK.v} mmol/L`, interpretKetone(latestK.v), null]);
      if (pair) cards.push([`GKI ${pair.gki}`, interpretGKI(pair.gki), null]);
      return el("div", { class: "card" },
        el("h2", {}, "What your numbers are saying"),
        ...cards.map(([title, it, personal]) => el("div", { style: "margin-bottom:1.1rem" },
          el("div", { class: "card-title-row" },
            el("h3", {}, title),
            el("span", { class: "tag " + (it.urgent ? "warm" : it.band.includes("Typical") || it.band.includes("Light") || it.band.includes("nutritional") ? "green" : "amber") }, it.band)),
          personal?.headline ? el("p", { style: "font-weight:600;margin:0.2rem 0" }, personal.headline) : null,
          personal?.trend ? el("p", { class: "muted", style: "font-size:0.88rem" }, personal.trend) : null,
          it.urgent ? el("div", { class: "notice warm" }, el("strong", {}, "Take this seriously: "), it.plain) : el("p", { class: "muted", style: "font-size:0.9rem" }, it.plain),
          it.why ? el("div", { style: "margin:0.4rem 0" },
            el("strong", { style: "font-size:0.84rem" }, "Why it can look like this"),
            el("ul", { style: "margin:0.15rem 0 0;padding-left:1.1rem;font-size:0.86rem;color:var(--ink-2)" }, it.why.map((a) => el("li", {}, a)))) : null,
          el("div", { style: "margin:0.4rem 0" },
            el("strong", { style: "font-size:0.84rem" }, "Next"),
            el("ul", { style: "margin:0.15rem 0 0;padding-left:1.1rem;font-size:0.86rem;color:var(--ink-2)" }, it.actions.map((a) => el("li", {}, a)))),
          it.avoid ? el("div", { style: "margin:0.4rem 0" },
            el("strong", { style: "font-size:0.84rem" }, "Avoid"),
            el("ul", { style: "margin:0.15rem 0 0;padding-left:1.1rem;font-size:0.86rem;color:var(--ink-2)" }, it.avoid.map((a) => el("li", {}, a)))) : null,
          el("div", { class: "source-line" }, "Ranges: " + it.source + "."),
        )),
        el("p", { class: "tiny" }, "Ranges explained is not a person diagnosed: home readings drift, single numbers mislead, and the decisions that matter belong in a consult with the full picture. Harta's job is that you walk in already understanding."),
      );
    })()].filter(Boolean),
    el("div", { class: "card" },
      el("div", { class: "card-title-row" }, el("h2", {}, "Last 24 hours"),
        el("span", { class: "tiny" }, gDay.length + " glucose readings")),
      sparkline(chartVals, { min: gMin, max: gMax }),
      meal && meal.n >= 3 ? el("div", { class: "notice", style: "margin-top:0.7rem" },
        `Across ${meal.n} logged meals, your after-meal readings run about ${displayGlucose(Math.abs(meal.rise)).v} ${displayGlucose(0).unit} ${meal.rise >= 0 ? "above" : "below"} your before-meal ones. ` +
        (meal.rise > 2 ? "If you want to soften that curve, the best-tested gentle moves are vegetables first, carbs last, and a ten-minute walk after eating (Inchauspé; small trials). Options, not homework." : "That is a gentle curve. Whatever you are doing with meals, it is working."))
        : null,
    ),
    el("div", { class: "card flat" },
      el("div", { class: "card-title-row" }, el("h2", {}, "Lab results"),
        el("button", { class: "link", onclick: () => addLabModal(main) }, "Add")),
      el("p", { class: "tiny" }, "HbA1c, lipids, CRP, vitamin D: type them in from your reports and watch the trend between check-ups. Bring the questions to the doctor; Harta keeps the timeline."),
      s.signals.labs.length
        ? el("div", {}, ...groupLabs(s.signals.labs).map(([name, rows]) =>
            el("div", { style: "margin-bottom:0.8rem" },
              el("h3", {}, name),
              ...rows.slice(0, 4).map((l) => el("div", { class: "reading-row" },
                el("span", { class: "r-val" }, l.value + " " + (l.unit || "")),
                el("span", { class: "r-meta" }, fmtDay(l.date)),
                el("span", {},
                  LAB_GUIDE[name] ? el("button", { class: "link", onclick: () => {
                    const it = interpretLab(name, l.value);
                    const series = rows.slice().reverse();
                    const trendLine = series.length >= 2
                      ? "Your own trail: " + series.map((x) => x.value).join(" \u2192 ") + (series[series.length - 1].value < series[0].value ? ". Moving down." : series[series.length - 1].value > series[0].value ? ". Moving up." : ". Holding steady.")
                      : null;
                    openModal(
                      el("h2", {}, name + ": " + l.value + " " + (l.unit || LAB_GUIDE[name].unit)),
                      trendLine ? el("p", { style: "font-weight:600" }, trendLine) : null,
                      el("span", { class: "tag " + (it.band.includes("Typical") || it.band.includes("Sufficient") || it.band.includes("target") || it.band.includes("better") || it.band.includes("Low") && name === "CRP" ? "green" : "amber") }, it.band),
                      el("p", { style: "margin-top:0.8rem" }, it.plain),
                      el("ul", { style: "padding-left:1.1rem" }, it.actions.map((a) => el("li", { style: "margin-bottom:0.3rem" }, a))),
                      el("div", { class: "source-line" }, "Ranges: " + it.source + "."),
                    );
                  } }, "explain") : null,
                  " ",
                  el("button", { class: "link", onclick: () => { store.mutate((st) => { st.signals.labs = st.signals.labs.filter((x) => x.id !== l.id); }); renderSignals(main); } }, "remove"),
                ),
              )),
            )))
        : el("p", { class: "muted" }, "No labs recorded yet."),
    ),
    ...(readings.length ? [el("div", { class: "card flat" },
      el("h3", {}, "Recent readings"),
      ...readings.slice(0, 8).map((r) => el("div", { class: "reading-row" },
        el("span", { class: "r-val" }, r.type === "glucose" ? displayGlucose(r.v).v + " " + displayGlucose(r.v).unit : r.v + " mmol/L ketones"),
        el("span", { class: "r-meta" }, new Date(r.t).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) + (r.ctx ? " · " + r.ctx : "")),
        el("span", {}),
      )),
    )] : []),
    el("p", { class: "tiny center" }, "Harta charts so the patterns jump out; your doctor interprets so nothing gets missed. That split is what makes these numbers useful instead of frightening. A reading that worries you is worth a call today, not Friday."),
  );
}

function groupLabs(labs) {
  const by = {};
  for (const l of labs) (by[l.name] ||= []).push(l);
  for (const k in by) by[k].sort((a, b) => b.date.localeCompare(a.date));
  return Object.entries(by);
}

function addReadingModal(main) {
  const s = store.get();
  const type = el("select", {}, el("option", { value: "glucose" }, "Glucose"), el("option", { value: "ketone" }, "Ketones (blood)"));
  const val = el("input", { type: "number", step: "0.1", placeholder: s.signals.unit === "mgdl" ? "e.g. 95" : "e.g. 5.3" });
  const ctx = el("select", {},
    el("option", { value: "" }, "No context"),
    el("option", { value: "fasting" }, "Fasting (morning)"),
    el("option", { value: "pre" }, "Before a meal"),
    el("option", { value: "post" }, "1-2 h after a meal"));
  openModal(
    el("h2", {}, "Add a reading"),
    el("div", { class: "field" }, el("label", {}, "Type"), type),
    el("div", { class: "field" }, el("label", {}, "Value" + (s.signals.unit === "mgdl" ? " (glucose in mg/dL)" : " (mmol/L)")), val),
    el("div", { class: "field" }, el("label", {}, "Context"), ctx),
    el("div", { class: "btn-row" },
      el("button", { class: "btn", onclick: () => {
        const v = parseFloat(val.value);
        if (!v || v <= 0) { toast("A number would help"); return; }
        const stored = type.value === "glucose" ? toMmol(v, s.signals.unit === "mgdl" ? "mgdl" : "mmol") : v;
        addReading(type.value, Math.round(stored * 100) / 100, ctx.value);
        closeModal(); renderSignals(main); toast("Logged");
      } }, "Save"),
    ),
  );
}

// CSV import: works with Libre/Dexcom/Keto-Mojo style exports or anything with
// a date column and a numeric column. The user confirms which columns are which.
export function openImportCSV(main) {
  const file = el("input", { type: "file", accept: ".csv,text/csv" });
  const type = el("select", {}, el("option", { value: "glucose" }, "Glucose readings"), el("option", { value: "ketone" }, "Ketone readings"));
  const unit = el("select", {}, el("option", { value: "mmol" }, "mmol/L"), el("option", { value: "mgdl" }, "mg/dL"));
  openModal(
    el("h2", {}, "Import from a sensor export"),
    el("p", { class: "muted" }, "Export a CSV from LibreView, Dexcom Clarity, Keto-Mojo or similar, then choose it here. Harta reads it right here on the device: your glucose history becomes insight for you, and never marketing data for anyone."),
    el("div", { class: "field" }, el("label", {}, "File"), file),
    el("div", { class: "field" }, el("label", {}, "These are"), type),
    el("div", { class: "field" }, el("label", {}, "Unit in the file"), unit),
    el("div", { class: "btn-row" },
      el("button", { class: "btn", onclick: async () => {
        const f = file.files[0];
        if (!f) { toast("Choose a file first"); return; }
        const text = await f.text();
        const n = importCSV(text, type.value, unit.value);
        closeModal(); renderSignals(main);
        toast(n ? `Imported ${n} readings` + (importCSV.lastDup ? `, skipped ${importCSV.lastDup} already here` : "") : (importCSV.lastDup ? "All of those readings are already here" : "No readable rows found; check the column layout"));
      } }, "Import"),
    ),
  );
}

function importCSV(text, type, unit) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return 0;
  // semicolon-region exports: normalise the delimiter first
  const semi = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length;
  if (semi) lines.forEach((l, i) => { lines[i] = l.replace(/;/g, ","); });
  // find the header row (Libre files start with a title line)
  let headIdx = lines.findIndex((l) => /time|date/i.test(l) && /,/.test(l));
  if (headIdx < 0) headIdx = 0;
  const head = splitCSV(lines[headIdx]).map((h) => h.toLowerCase());
  const tCol = head.findIndex((h) => /timestamp|time|date/.test(h));
  let vCol = head.findIndex((h) => (type === "glucose" ? /glucose|sgv|bg\b/ : /ketone|bhb/).test(h));
  if (vCol < 0) vCol = head.findIndex((h, i) => i !== tCol && /value|reading|result|mmol|mg\/dl/.test(h));
  if (tCol < 0 || vCol < 0) return 0;
  let n = 0, dup = 0;
  const parseWhen = (cell) => {
    // DD-MM-YYYY or DD/MM/YYYY (Libre in AU/EU regions) parsed explicitly, never guessed
    const m = cell.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})[ T](\d{1,2}):(\d{2})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
    return new Date(cell);
  };
  store.mutate((s) => {
    const seen = new Set(s.signals.readings.map((r) => r.type + "|" + r.t));
    for (let i = headIdx + 1; i < lines.length && n < 2000; i++) {
      const cells = splitCSV(lines[i]);
      const t = parseWhen(cells[tCol]);
      const v = parseFloat(String(cells[vCol]).replace(/^(\d+),(\d+)$/, "$1.$2"));
      if (isNaN(t.getTime()) || !v || v <= 0) continue;
      const key = type + "|" + t.toISOString();
      if (seen.has(key)) { dup++; continue; } // re-importing overlapping exports must not double history
      seen.add(key);
      const stored = type === "glucose" ? toMmol(v, unit) : v;
      s.signals.readings.push({ id: uid(), t: t.toISOString(), type, v: Math.round(stored * 100) / 100, ctx: "", note: "import" });
      n++;
    }
    s.signals.readings.sort((a, b) => b.t.localeCompare(a.t));
    s.signals.readings = s.signals.readings.slice(0, 2000);
  });
  importCSV.lastDup = dup;
  return n;
}
function splitCSV(line) {
  return line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')).slice(0, -1);
}

function addLabModal(main) {
  const name = el("input", { type: "text", placeholder: "e.g. HbA1c, LDL, CRP, Vitamin D", list: "lab-names" });
  const datalist = el("datalist", { id: "lab-names" },
    ...["HbA1c", "Fasting glucose", "Total cholesterol", "LDL", "HDL", "Triglycerides", "CRP", "Vitamin D", "Ferritin", "TSH"].map((n) => el("option", { value: n })));
  const value = el("input", { type: "number", step: "0.01", placeholder: "Value" });
  const unitI = el("input", { type: "text", placeholder: "%, mmol/L, mg/L…" });
  const date = el("input", { type: "date", value: todayISO() });
  openModal(
    el("h2", {}, "Add a lab result"),
    datalist,
    el("div", { class: "field" }, el("label", {}, "Test"), name),
    el("div", { class: "field" }, el("label", {}, "Value"), value),
    el("div", { class: "field" }, el("label", {}, "Unit"), unitI),
    el("div", { class: "field" }, el("label", {}, "Date"), date),
    el("div", { class: "btn-row" },
      el("button", { class: "btn", onclick: () => {
        if (!name.value.trim() || !value.value) { toast("Test and value needed"); return; }
        store.mutate((s) => { s.signals.labs.push({ id: uid(), date: date.value, name: name.value.trim(), value: parseFloat(value.value), unit: unitI.value.trim() }); });
        closeModal(); renderSignals(main); toast("Recorded");
      } }, "Save"),
    ),
  );
}
