// Harta · the human voice.
// Synthetic speech is gone by request: nothing in this app speaks with a robot
// voice any more. In its place: the user's own recordings (kept on-device in
// the journal store) and, unchanged, the microphone for dictation.

import { store } from "./store.js";
import { listJournalEntries, addJournalEntry, deleteJournalEntry } from "./idb.js";

export const HUMAN_READINGS = [
  ["morning-blessing", "Morning blessing", "A few sentences to greet the day. Played, if you wish, when the arrival passage shows."],
  ["evening-blessing", "Evening blessing", "Words for closing the day. Offered beside vespers."],
  ["breathe-with-me", "Breathe with me", "Your own voice guiding a round: in for four, out for six. Offered at the breathing circle."],
];

const cache = {};
export async function getReading(key) {
  if (cache[key] !== undefined) return cache[key];
  const entries = await listJournalEntries(500);
  const e = entries.find((x) => (x.tags || []).includes("human-reading") && x.text === key);
  cache[key] = e || null;
  return cache[key];
}
export async function saveReading(key, blob) {
  const old = await getReading(key);
  if (old) await deleteJournalEntry(old.id);
  await addJournalEntry({ type: "audio", blob, text: key, tags: ["human-reading"] });
  cache[key] = undefined;
}
export async function removeReading(key) {
  const old = await getReading(key);
  if (old) await deleteJournalEntry(old.id);
  cache[key] = undefined;
}

let playing = null;
export async function playReading(key) {
  const e = await getReading(key);
  if (!e || !e.blob) return false;
  stopReading();
  playing = new Audio(URL.createObjectURL(e.blob));
  playing.onended = () => { if (playing) URL.revokeObjectURL(playing.src); playing = null; };
  playing.play();
  return true;
}
export function stopReading() {
  if (playing) { playing.pause(); URL.revokeObjectURL(playing.src); playing = null; }
}

// dictation, unchanged: the microphone still listens when asked
export function listenAvailable() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
export function listenOnce({ onText, onEnd, interim = true }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = "en-AU";
  rec.interimResults = interim;
  rec.continuous = true;
  let finalText = "";
  rec.onresult = (e) => {
    let interimText = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
      else interimText += e.results[i][0].transcript;
    }
    onText(finalText.trim(), interimText.trim());
  };
  rec.onend = () => onEnd(finalText.trim());
  rec.onerror = () => onEnd(finalText.trim());
  rec.start();
  return rec;
}
