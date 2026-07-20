// Alma · journal (photos, voice, words) and the time capsule (letters that wait).
// Everything stays on this device. The journal is for the present you;
// the capsule is for the future you, and for the people you love.

import { el, icon, toast, openModal, closeModal } from "./ui.js";
import { store, todayISO, fmtDay, uid } from "./store.js";
import { addJournalEntry, listJournalEntries, getJournalEntry, deleteJournalEntry, exportJournal } from "./idb.js";

// ---------- journal ----------
export function renderJournal(main, navigate) {
  let recorder = null, chunks = [], recStart = 0;

  const grid = el("div", { class: "journal-grid" }, el("p", { class: "muted" }, "Loading…"));

  async function paintGrid() {
    const entries = await listJournalEntries(120);
    if (!entries.length) {
      grid.replaceChildren(el("p", { class: "muted" }, "Nothing here yet. The first photo of a meal you were proud of is a fine beginning."));
      return;
    }
    grid.replaceChildren(...entries.map((e) => {
      const body = el("div", { class: "j-body" },
        el("div", { class: "j-date" }, new Date(e.t).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) + (e.tags?.length ? " · " + e.tags.join(", ") : "")),
        e.type === "audio" ? el("div", { class: "j-text" }, "Voice note" + (e.text ? ": " + e.text : "")) :
        e.text ? el("div", { class: "j-text" }, e.text) : null,
      );
      const entry = el("button", { class: "j-entry", onclick: () => openEntry(e.id) }, body);
      if (e.type === "photo" && e.blob) {
        const img = el("img", { alt: e.text || "Journal photo" });
        img.src = URL.createObjectURL(e.blob);
        entry.prepend(img);
      }
      return entry;
    }));
  }

  async function openEntry(id) {
    const e = await getJournalEntry(id);
    if (!e) return;
    const parts = [
      el("h2", {}, new Date(e.t).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })),
    ];
    if (e.prompt) parts.push(el("p", { class: "tiny" }, "Prompt: " + e.prompt));
    if (e.type === "photo" && e.blob) {
      const img = el("img", { style: "width:100%;border-radius:12px", alt: "Journal photo" });
      img.src = URL.createObjectURL(e.blob);
      parts.push(img);
    }
    if (e.type === "audio" && e.blob) {
      const au = el("audio", { controls: true, style: "width:100%" });
      au.src = URL.createObjectURL(e.blob);
      parts.push(au);
    }
    if (e.text) parts.push(el("p", { style: "margin-top:0.8rem;white-space:pre-wrap" }, e.text));
    parts.push(el("div", { class: "btn-row", style: "margin-top:0.8rem" },
      el("button", { class: "btn danger small", onclick: async () => {
        await deleteJournalEntry(id);
        store.mutate((s) => { s.journalIndex = s.journalIndex.filter((j) => j.id !== id); });
        closeModal(); paintGrid(); toast("Entry removed");
      } }, "Delete"),
    ));
    openModal(...parts);
  }

  // photo input (hidden, triggered by button)
  const photoInput = el("input", { type: "file", accept: "image/*", style: "display:none" });
  photoInput.addEventListener("change", async () => {
    const file = photoInput.files[0];
    if (!file) return;
    const note = await askForNote("A line to remember it by (optional)");
    await addJournalEntry({ type: "photo", blob: file, text: note || "", tags: ["photo"] });
    toast("Kept. The future you says thank you.");
    paintGrid();
  });

  const recBtnLabel = el("span", {}, "Record a voice note");
  const recBtn = el("button", { class: "btn secondary", onclick: async () => {
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const secs = Math.round((Date.now() - recStart) / 1000);
        const note = await askForNote("What is this note about? (optional)");
        await addJournalEntry({ type: "audio", blob, text: note || "", tags: ["voice"], seconds: secs });
        recBtnLabel.textContent = "Record a voice note";
        recBtn.classList.remove("danger");
        toast(`Voice note kept (${secs}s)`);
        paintGrid();
      };
      recorder.start();
      recStart = Date.now();
      recBtnLabel.replaceChildren(el("span", { class: "record-dot" }), " Recording… tap to stop");
      recBtn.classList.add("danger");
    } catch {
      toast("Microphone permission was declined");
    }
  } }, recBtnLabel);

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "Private"),
      el("h1", {}, "Journal"),
      el("p", {}, "Photos of real plates, voice notes on hard days, lines that deserve keeping. A repository for the future you."),
    ),
    el("div", { class: "card" },
      el("div", { class: "btn-row" },
        el("button", { class: "btn", onclick: () => photoInput.click() }, "Add a photo"),
        recBtn,
        el("button", { class: "btn ghost", onclick: () => writeEntry(paintGrid) }, "Write"),
      ),
      photoInput,
    ),
    grid,
    el("div", { class: "card flat", style: "margin-top:1rem" },
      el("div", { class: "card-title-row" }, el("h3", {}, "The capsule"),
        el("button", { class: "link", onclick: () => navigate("#/capsule") }, "Open")),
      el("p", { class: "muted" }, "Letters that wait: for the future you, or for your family. Your print, kept safely."),
    ),
  );
  paintGrid();
}

function askForNote(placeholder) {
  return new Promise((resolve) => {
    const ta = el("textarea", { placeholder });
    openModal(
      el("h2", {}, "One line"),
      el("div", { class: "field" }, ta),
      el("div", { class: "btn-row" },
        el("button", { class: "btn", onclick: () => { const v = ta.value.trim(); closeModal(); resolve(v); } }, "Keep"),
        el("button", { class: "btn ghost", onclick: () => { closeModal(); resolve(""); } }, "Skip"),
      ),
    );
  });
}

function writeEntry(after) {
  const ta = el("textarea", { placeholder: "Whatever is true today.", style: "min-height:8rem" });
  openModal(
    el("h2", {}, "Write"),
    el("div", { class: "field" }, ta),
    el("div", { class: "btn-row" },
      el("button", { class: "btn", onclick: async () => {
        const text = ta.value.trim();
        if (!text) return;
        await addJournalEntry({ type: "text", text, tags: [] });
        closeModal(); toast("Kept"); after();
      } }, "Keep"),
    ),
  );
}

// ---------- the capsule ----------
export function renderCapsule(main, navigate) {
  const s = store.get();
  const today = todayISO();

  const fmtFull = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  const list = s.capsules.length
    ? s.capsules.map((c) => {
        const sealed = !c.opened && c.openOn && c.openOn > today;
        return el("div", { class: "capsule" + (sealed ? " sealed" : "") },
          el("div", { class: "c-to" }, "For " + c.to),
          el("div", { class: "c-title" }, c.title),
          el("div", { class: "c-when" },
            c.opened ? "Opened " + fmtFull(c.opened)
              : sealed ? "Sealed until " + fmtFull(c.openOn)
              : "Ready to open"),
          el("div", { class: "btn-row", style: "margin-top:0.6rem" },
            sealed
              ? el("span", { class: "tiny" }, "It waits. That is the point.")
              : el("button", { class: "btn small" + (c.opened ? " ghost" : ""), onclick: () => {
                  if (!c.opened) store.mutate((st) => { const x = st.capsules.find((y) => y.id === c.id); if (x) x.opened = today; });
                  openModal(
                    el("span", { class: "tag green" }, "For " + c.to),
                    el("h2", {}, c.title),
                    el("p", { class: "tiny" }, "Written " + fmtDay(c.created)),
                    el("p", { style: "white-space:pre-wrap;margin-top:0.8rem" }, c.body),
                  );
                  renderCapsule(main, navigate);
                } }, c.opened ? "Read again" : "Open now"),
          ),
        );
      })
    : [el("p", { class: "muted" }, "No letters yet. The first one is usually to yourself, one year from now.")];

  main.replaceChildren(
    el("div", { class: "page-head" },
      el("span", { class: "eyebrow" }, "Private"),
      el("h1", {}, "The capsule"),
      el("p", {}, "Words sealed for later: for the you of next year, or the people who will want your voice one day. Leaving a print is not morbid; it is generous."),
    ),
    el("div", { class: "card flat" },
      el("button", { class: "btn", onclick: () => writeCapsule(() => renderCapsule(main, navigate)) }, "Write a letter"),
    ),
    ...list,
    el("p", { class: "tiny center", style: "margin-top:1rem" }, "Letters live only on this device. Export a backup in Settings and keep it somewhere your family can find."),
  );
}

function writeCapsule(after) {
  const to = el("input", { type: "text", placeholder: "Myself, one year on · My children · Us" });
  const title = el("input", { type: "text", placeholder: "A title the future will recognise" });
  const body = el("textarea", { placeholder: "Write as if they are in the room.", style: "min-height:9rem" });
  const openOn = el("input", { type: "date", min: todayISO() });
  openModal(
    el("h2", {}, "A letter for later"),
    el("div", { class: "field" }, el("label", {}, "For"), to),
    el("div", { class: "field" }, el("label", {}, "Title"), title),
    el("div", { class: "field" }, el("label", {}, "The letter"), body),
    el("div", { class: "field" }, el("label", {}, "Sealed until"), openOn,
      el("div", { class: "hint" }, "Leave empty to keep it open from day one.")),
    el("div", { class: "btn-row" },
      el("button", { class: "btn", onclick: () => {
        if (!to.value.trim() || !body.value.trim()) { toast("It needs a person and some words"); return; }
        store.mutate((s) => {
          s.capsules.unshift({
            id: uid(), to: to.value.trim(),
            title: title.value.trim() || "A letter",
            body: body.value, openOn: openOn.value || null,
            created: todayISO(), opened: null,
          });
        });
        closeModal(); toast("Sealed and kept"); after();
      } }, "Seal it"),
    ),
  );
}
