// Harta · the reading voice. Uses the device's own speech engine, so nothing
// leaves the phone. The voice quality is whatever the device offers; iPhones
// and Macs carry genuinely warm ones. Off by default; the user chooses.

import { store } from "./store.js";

let chosen = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefer = [
    (v) => /en[-_]AU/i.test(v.lang) && /karen|catherine|natural|premium|enhanced/i.test(v.name),
    (v) => /en[-_]AU/i.test(v.lang),
    (v) => /samantha|serena|martha|moira|natural|premium|enhanced/i.test(v.name) && /^en/i.test(v.lang),
    (v) => /^en/i.test(v.lang),
  ];
  for (const test of prefer) { const v = voices.find(test); if (v) return v; }
  return voices[0];
}
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => { chosen = pickVoice(); };
  chosen = pickVoice();
}

export function voiceAvailable() { return "speechSynthesis" in window; }
export function voiceOn() { return !!store.get().voiceOn; }

export function speak(text) {
  if (!voiceAvailable()) return false;
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text);
  if (!chosen) chosen = pickVoice();
  if (chosen) u.voice = chosen;
  u.rate = 0.88;   // unhurried
  u.pitch = 1.0;
  u.volume = 1;
  speechSynthesis.speak(u);
  return true;
}
export function stopSpeaking() {
  if (voiceAvailable()) speechSynthesis.cancel();
}
