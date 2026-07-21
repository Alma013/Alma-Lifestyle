// Harta · the reading voice. Uses the device's own speech engine, so nothing
// leaves the phone. The voice quality is whatever the device offers; iPhones
// and Macs carry genuinely warm ones. Off by default; the user chooses.

import { store } from "./store.js";

let chosen = null;

// the warmest voices a device offers, best first
export function rankedVoices() {
  const voices = speechSynthesis.getVoices().filter((x) => /^en/i.test(x.lang));
  const score = (x) => {
    let s = 0;
    if (/premium|enhanced|natural|neural/i.test(x.name)) s += 4;
    if (/siri/i.test(x.name)) s += 3;
    if (/karen|catherine|matilda/i.test(x.name)) s += 3; // the Australian voices
    if (/samantha|serena|martha|moira|ava|allison|zoe/i.test(x.name)) s += 2;
    if (/en[-_]AU/i.test(x.lang)) s += 2;
    if (/compact|espeak|fred|albert|zarvox|bells|boing|bubbles|cellos|organ|trinoids|whisper|wobble|bad news|good news|jester|superstar/i.test(x.name)) s -= 6; // the robots and novelties
    return s;
  };
  return voices.sort((a, b) => score(b) - score(a));
}
function pickVoice() {
  const wanted = store.get().voiceName;
  const all = speechSynthesis.getVoices();
  if (wanted) { const m = all.find((x) => x.name === wanted); if (m) return m; }
  return rankedVoices()[0] || all[0] || null;
}
export function setVoiceByName(name) {
  store.update({ voiceName: name });
  chosen = pickVoice();
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

// ---------- listening: the device's own speech recognition ----------
// Honesty note surfaced in the UI: on most platforms recognition is performed by
// the operating system's speech service, which may process audio off-device.
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
