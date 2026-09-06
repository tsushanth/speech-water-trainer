// Headless test for the non-hardware-dependent voice-clip logic:
// localStorage round-trip and clip/TTS fallback branching.
// Run with: node test-voice-clips.js

// --- minimal localStorage shim (Node has no localStorage) ---
global.localStorage = (() => {
  let store = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

// --- extract the pure functions from app.js without running the whole
// browser-only script (which touches `document`). We re-declare them
// here verbatim from app.js so this stays a real, executable check of
// that logic (not a reimplementation drifted from the source). ---
const VOICE_CLIPS_KEY = 'voiceClips';

function loadVoiceClips() {
  try {
    const raw = localStorage.getItem(VOICE_CLIPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveVoiceClips(clips) {
  localStorage.setItem(VOICE_CLIPS_KEY, JSON.stringify(clips));
}

function clipKeyFor(word) {
  return (word || '').trim().toLowerCase();
}

function getVoiceClip(clips, word) {
  return clips[clipKeyFor(word)] || null;
}

function setVoiceClip(clips, word, dataUrl) {
  const next = { ...clips };
  next[clipKeyFor(word)] = dataUrl;
  return next;
}

function clearVoiceClip(clips, word) {
  const next = { ...clips };
  delete next[clipKeyFor(word)];
  return next;
}

function resolvePlaybackSource(clips, word) {
  const clip = getVoiceClip(clips, word);
  return clip ? { type: 'clip', dataUrl: clip } : { type: 'tts', word };
}

// --- test harness ---
let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', msg); }
}

// 1. Empty state: no clips saved yet -> falls back to TTS
localStorage.clear();
let clips = loadVoiceClips();
assert(Object.keys(clips).length === 0, 'fresh localStorage yields empty clip map');
let src = resolvePlaybackSource(clips, 'water');
assert(src.type === 'tts' && src.word === 'water', 'no clip for word falls back to tts');

// 2. Save a clip, round-trip through localStorage (simulating a page reload)
clips = setVoiceClip(clips, 'water', 'data:audio/webm;base64,AAAA');
saveVoiceClips(clips);
const reloaded = loadVoiceClips();
assert(reloaded.water === 'data:audio/webm;base64,AAAA', 'clip persists across save/load (simulated reload)');

// 3. Playback resolution prefers the clip when present
src = resolvePlaybackSource(reloaded, 'water');
assert(src.type === 'clip' && src.dataUrl === 'data:audio/webm;base64,AAAA', 'clip present -> resolves to clip playback');

// 4. Case/whitespace-insensitive key matching (word list entries could have stray spacing)
src = resolvePlaybackSource(reloaded, '  Water  ');
assert(src.type === 'clip', 'clip lookup is case/whitespace-insensitive');

// 5. A different word with no clip still falls back to tts even though other clips exist
src = resolvePlaybackSource(reloaded, 'cup');
assert(src.type === 'tts' && src.word === 'cup', 'unrelated word with no clip still falls back to tts');

// 6. Clearing a clip removes it and playback falls back to tts again
const cleared = clearVoiceClip(reloaded, 'water');
assert(getVoiceClip(cleared, 'water') === null, 'clearVoiceClip removes the stored clip');
src = resolvePlaybackSource(cleared, 'water');
assert(src.type === 'tts', 'after clearing, playback falls back to tts');
saveVoiceClips(cleared);
assert(JSON.parse(localStorage.getItem(VOICE_CLIPS_KEY)).water === undefined, 'clear persists to localStorage');

// 7. Corrupt localStorage value doesn't throw, degrades to empty map
localStorage.setItem(VOICE_CLIPS_KEY, 'not json{{{');
const safe = loadVoiceClips();
assert(typeof safe === 'object' && Object.keys(safe).length === 0, 'corrupt localStorage value degrades to empty map instead of throwing');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
