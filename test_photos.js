// Minimal headless test for the photo-storage logic in app.js.
// Simulates localStorage and a DOM stub, loads app.js in a vm context,
// and exercises setPhotoForWord/getPhotoForWord/removePhotoForWord
// round-trip plus emoji fallback when no photo exists.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// --- localStorage stub ---
function makeLocalStorage() {
  const store = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _dump: () => ({ ...store }),
  };
}

// --- minimal DOM element stub ---
function makeEl(id) {
  const listeners = {};
  return {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    className: '',
    classList: {
      add() {}, remove() {}, contains() { return false; }, toggle() {},
    },
    files: [],
    disabled: false,
    appendChild(child) { this._children = this._children || []; this._children.push(child); },
    addEventListener(evt, fn) { listeners[evt] = listeners[evt] || []; listeners[evt].push(fn); },
    _fire(evt, arg) { (listeners[evt] || []).forEach(fn => fn(arg)); },
  };
}

const ids = [
  'picture', 'word', 'hearBtn', 'micBtn', 'status', 'wordScreen', 'rewardScreen',
  'rewardVideoWrap', 'againBtn', 'rewardNowBtn', 'wordListInput', 'applyWords',
  'youtubeUrlInput', 'applyVideo', 'photoInput', 'removePhotoBtn', 'nextWordBtn', 'prevBtn',
  'recordBtn', 'clearClipBtn', 'voiceClipStatus',
];
const elements = {};
ids.forEach(id => { elements[id] = makeEl(id); });
elements.wordListInput.value = 'water,💧\ncup,🥤';

const documentStub = {
  getElementById: (id) => elements[id],
  createElement: (tag) => makeEl('created-' + tag),
};

const localStorageStub = makeLocalStorage();

const sandbox = {
  document: documentStub,
  localStorage: localStorageStub,
  window: {},
  console,
  SpeechSynthesisUtterance: function (text) { this.text = text; },
  speechSynthesis: { speak() {} },
};
sandbox.window.SpeechRecognition = undefined;
sandbox.window.webkitSpeechRecognition = undefined;

vm.createContext(sandbox);
const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
vm.runInContext(code, sandbox, { filename: 'app.js' });

// --- Tests ---
let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (e) {
    failures++;
    console.log(`FAIL: ${name} -- ${e.message}`);
  }
}

check('no photo set -> getPhotoForWord returns null (fallback to emoji)', () => {
  assert.strictEqual(sandbox.getPhotoForWord('water'), null);
});

check('setPhotoForWord persists to localStorage as JSON map', () => {
  sandbox.setPhotoForWord('water', 'data:image/png;base64,AAAA');
  const raw = localStorageStub.getItem('wordPhotos');
  assert.ok(raw, 'expected wordPhotos key to be set');
  const parsed = JSON.parse(raw);
  assert.strictEqual(parsed.water, 'data:image/png;base64,AAAA');
});

check('getPhotoForWord round-trips the stored data URL (case-insensitive)', () => {
  assert.strictEqual(sandbox.getPhotoForWord('Water'), 'data:image/png;base64,AAAA');
});

check('removePhotoForWord clears it, falls back to null again', () => {
  sandbox.removePhotoForWord('water');
  assert.strictEqual(sandbox.getPhotoForWord('water'), null);
});

check('multiple words keep independent photo entries', () => {
  sandbox.setPhotoForWord('cup', 'data:image/png;base64,BBBB');
  sandbox.setPhotoForWord('ball', 'data:image/png;base64,CCCC');
  assert.strictEqual(sandbox.getPhotoForWord('cup'), 'data:image/png;base64,BBBB');
  assert.strictEqual(sandbox.getPhotoForWord('ball'), 'data:image/png;base64,CCCC');
  assert.strictEqual(sandbox.getPhotoForWord('water'), null);
});

check('renderPicture uses <img> when photo exists, emoji text otherwise', () => {
  const w1 = { word: 'cup', emoji: '🥤' };
  sandbox.renderPicture(w1);
  assert.strictEqual(elements.picture.innerHTML, '');
  assert.ok(elements.picture._children && elements.picture._children.length === 1, 'expected an appended img element');
  assert.strictEqual(elements.picture._children[0].src, 'data:image/png;base64,BBBB');

  elements.picture._children = [];
  const w2 = { word: 'nophoto', emoji: '❓' };
  sandbox.renderPicture(w2);
  assert.strictEqual(elements.picture.textContent, '❓');
});

check('loadPhotoMap survives corrupted localStorage gracefully', () => {
  localStorageStub.setItem('wordPhotos', 'not-json{{{');
  const map = sandbox.loadPhotoMap();
  assert.strictEqual(Object.keys(map).length, 0);
});

if (failures) {
  console.log(`\n${failures} test(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll photo-storage tests passed.');
}
