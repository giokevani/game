// Browser-side language helpers: Russian help in Cyrillic or Latin letters,
// and English read-aloud through the phone's built-in voice.
import { translit } from './text.js';

let settings = { script: 'cyr', voice: true, rate: 0.85, help: true };
export function setLangSettings(s) { settings = s; }

// Russian helper text in the chosen alphabet
export const ru = (s) => (settings.script === 'lat' ? translit(s) : s);

let voice = null;
function pickVoice() {
  const vs = window.speechSynthesis?.getVoices?.() || [];
  voice = vs.find((v) => /en[-_]US/i.test(v.lang) && /samantha|female|zira|aria|jenny/i.test(v.name))
    || vs.find((v) => /en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

export const canSpeak = () => typeof window !== 'undefined' && !!window.speechSynthesis;

// speak English. force = the child tapped 🔊 (always speaks even if auto voice is off)
export function speak(text, force = false) {
  if (!canSpeak() || (!settings.voice && !force) || !text) return;
  try {
    const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s,.!?'-]/gu, ''));
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    u.rate = settings.rate || 0.85;
    u.pitch = 1.1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    window.__spoken = (window.__spoken || 0) + 1;
    window.__lastSpoken = text;
  } catch { /* speech is optional */ }
}

// iOS needs the first utterance inside a tap
export function primeSpeech() {
  if (!canSpeak() || primeSpeech.done) return;
  primeSpeech.done = true;
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); } catch { /* ignore */ }
}
