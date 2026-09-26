import { migrate, newState } from './state.js';

const KEY = 'blossombay.save.v1';
const BACKUP = 'blossombay.save.backup';

function storage() {
  try {
    const s = window.localStorage;
    s.setItem('__t', '1');
    s.removeItem('__t');
    return s;
  } catch {
    return null;
  }
}

export function loadGame() {
  const s = storage();
  if (!s) return { state: newState(), fresh: true };
  for (const k of [KEY, BACKUP]) {
    try {
      const raw = s.getItem(k);
      if (raw) return { state: migrate(JSON.parse(raw)), fresh: false };
    } catch { /* try backup */ }
  }
  return { state: newState(), fresh: true };
}

let last = '';
export function saveGame(state) {
  const s = storage();
  if (!s) return false;
  try {
    const json = JSON.stringify(state);
    if (json === last) return true;
    if (last) s.setItem(BACKUP, last);
    s.setItem(KEY, json);
    last = json;
    return true;
  } catch {
    return false;
  }
}

export function wipeGame() {
  const s = storage();
  s?.removeItem(KEY);
  s?.removeItem(BACKUP);
  last = '';
}

// Backup code the parent can copy somewhere safe
export function exportCode(state) {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return 'BB1:' + btoa(bin);
}

export function importCode(code) {
  const c = code.trim();
  if (!c.startsWith('BB1:')) throw new Error('Not a Blossom Bay code');
  const bin = atob(c.slice(4));
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return migrate(JSON.parse(new TextDecoder().decode(bytes)));
}

export async function requestPersistence() {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch { /* not supported */ }
}
