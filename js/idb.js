// Harta · IndexedDB for journal media (photos, voice notes, text entries).
// Blobs are too heavy for localStorage; they live here, still only on this device.

const DB_NAME = "alma-journal";
const STORE = "entries";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "id" });
        os.createIndex("t", "t");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

export async function addJournalEntry(entry) {
  const db = await openDB();
  const full = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2),
    t: new Date().toISOString(),
    ...entry, // { type: "photo"|"audio"|"text", blob?, text?, tags?, prompt? }
  };
  await new Promise((res, rej) => {
    const r = tx(db, "readwrite").add(full);
    r.onsuccess = res; r.onerror = () => rej(r.error);
  });
  return full.id;
}

export async function listJournalEntries(limit = 200) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const out = [];
    const idx = tx(db, "readonly").index("t");
    const cur = idx.openCursor(null, "prev");
    cur.onsuccess = () => {
      const c = cur.result;
      if (c && out.length < limit) { out.push(c.value); c.continue(); }
      else res(out);
    };
    cur.onerror = () => rej(cur.error);
  });
}

export async function getJournalEntry(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const r = tx(db, "readonly").get(id);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  });
}

export async function deleteJournalEntry(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const r = tx(db, "readwrite").delete(id);
    r.onsuccess = res; r.onerror = () => rej(r.error);
  });
}

// Export every entry; blobs become base64 so a single JSON file can hold the lot.
export async function exportJournal() {
  const entries = await listJournalEntries(10000);
  const out = [];
  for (const e of entries) {
    const copy = { ...e };
    if (copy.blob instanceof Blob) {
      copy.blobB64 = await blobToB64(copy.blob);
      copy.blobType = copy.blob.type;
      delete copy.blob;
    }
    out.push(copy);
  }
  return out;
}

export async function importJournal(entries) {
  const db = await openDB();
  let n = 0;
  for (const e of entries) {
    const copy = { ...e };
    if (copy.blobB64) {
      copy.blob = b64ToBlob(copy.blobB64, copy.blobType || "application/octet-stream");
      delete copy.blobB64; delete copy.blobType;
    }
    await new Promise((res) => { const r = tx(db, "readwrite").put(copy); r.onsuccess = res; r.onerror = res; });
    n++;
  }
  return n;
}

function blobToB64(blob) {
  return new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result.split(",")[1]);
    fr.onerror = () => res(null); // one unreadable blob must not hang the whole backup
    fr.readAsDataURL(blob);
  });
}
function b64ToBlob(b64, type) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
}
