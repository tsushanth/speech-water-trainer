let words = [];
let currentIndex = 0;

// ---------------------------------------------------------------------
// Familiar-voice recording (parent-recorded clip per word), stored in
// localStorage as base64 data URLs — same pattern as any locally-stored
// image/blob in this app. No backend, no API cost.
//
// We deliberately do NOT do real-time AI voice cloning here: that needs a
// server (to run the cloning/TTS model) and per-call API cost, which
// breaks this app's "standalone static page, zero backend" requirement.
// A single pre-recorded clip per word, played back verbatim, gets the
// "familiar voice" engagement benefit without any of that.
// ---------------------------------------------------------------------

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

// Decide how to play a word: use the stored clip if present, else fall
// back to speech synthesis. Pure/testable — no DOM or audio APIs inside.
function resolvePlaybackSource(clips, word) {
  const clip = getVoiceClip(clips, word);
  return clip ? { type: 'clip', dataUrl: clip } : { type: 'tts', word };
}

let voiceClips = loadVoiceClips();

const pictureEl = document.getElementById('picture');
const wordEl = document.getElementById('word');
const hearBtn = document.getElementById('hearBtn');
const micBtn = document.getElementById('micBtn');
const statusEl = document.getElementById('status');
const wordScreen = document.getElementById('wordScreen');
const rewardScreen = document.getElementById('rewardScreen');
const rewardVideoWrap = document.getElementById('rewardVideoWrap');
const againBtn = document.getElementById('againBtn');
const rewardNowBtn = document.getElementById('rewardNowBtn');
const wordListInput = document.getElementById('wordListInput');
const applyWordsBtn = document.getElementById('applyWords');
const youtubeUrlInput = document.getElementById('youtubeUrlInput');
const applyVideoBtn = document.getElementById('applyVideo');
const recordBtn = document.getElementById('recordBtn');
const clearClipBtn = document.getElementById('clearClipBtn');
const voiceClipStatusEl = document.getElementById('voiceClipStatus');

let youtubeVideoId = '';
let canUseSpeechRecognition = false;

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return '';
}

applyVideoBtn.addEventListener('click', () => {
  const id = extractYouTubeId(youtubeUrlInput.value.trim());
  if (id) {
    youtubeVideoId = id;
    localStorage.setItem('rewardYoutubeId', id);
    statusEl.textContent = 'Reward video set.';
  } else {
    statusEl.textContent = 'Could not parse that YouTube URL.';
  }
});

const savedId = localStorage.getItem('rewardYoutubeId');
if (savedId) {
  youtubeVideoId = savedId;
  youtubeUrlInput.value = `https://www.youtube.com/watch?v=${savedId}`;
} else {
  youtubeVideoId = extractYouTubeId(youtubeUrlInput.value.trim());
}

function parseWordList(text) {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const [word, emoji] = line.split(',').map(s => s.trim());
      return { word, emoji: emoji || '❓' };
    });
}

function loadWord(i) {
  const w = words[i];
  if (!w) {
    wordEl.textContent = 'NO WORDS';
    pictureEl.textContent = '❓';
    statusEl.textContent = 'Add at least one word below, then tap Apply.';
    return;
  }
  wordEl.textContent = w.word;
  pictureEl.textContent = w.emoji;
  statusEl.textContent = canUseSpeechRecognition ? '' : 'Speech recognition not supported — use Chrome, or use Reward manually.';
  refreshVoiceClipUi();
}

function refreshVoiceClipUi() {
  const w = words[currentIndex];
  if (!w) {
    voiceClipStatusEl.textContent = '';
    clearClipBtn.classList.add('hidden');
    return;
  }
  const hasClip = Boolean(getVoiceClip(voiceClips, w.word));
  voiceClipStatusEl.textContent = hasClip ? 'Using recorded voice for this word.' : 'Using computer voice for this word.';
  clearClipBtn.classList.toggle('hidden', !hasClip);
  recordBtn.textContent = hasClip ? '🎙️ Re-record my voice' : '🎙️ Record my voice';
}

let currentClipAudio = null;

function speakWord(word) {
  const source = resolvePlaybackSource(voiceClips, word);
  if (source.type === 'clip') {
    if (currentClipAudio) {
      currentClipAudio.pause();
    }
    currentClipAudio = new Audio(source.dataUrl);
    currentClipAudio.play().catch(() => {
      // Autoplay/decoding failed for some reason — fall back to TTS so
      // the app still works.
      const utter = new SpeechSynthesisUtterance(word);
      utter.rate = 0.7;
      speechSynthesis.speak(utter);
    });
    return;
  }
  const utter = new SpeechSynthesisUtterance(word);
  utter.rate = 0.7;
  speechSynthesis.speak(utter);
}

hearBtn.addEventListener('click', () => {
  const current = words[currentIndex];
  if (current) {
    speakWord(current.word);
  } else {
    statusEl.textContent = 'Add at least one word below, then tap Apply.';
  }
});

// Levenshtein distance for lenient matching against unclear speech
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function isCloseEnough(said, target) {
  said = said.toLowerCase().trim();
  target = target.toLowerCase().trim();
  if (!said) return false;
  if (said.includes(target) || target.includes(said)) return true;
  const dist = levenshtein(said, target);
  const threshold = Math.max(1, Math.floor(target.length / 2));
  return dist <= threshold;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;
canUseSpeechRecognition = Boolean(SpeechRecognition);

function stopListening() {
  listening = false;
  micBtn.classList.remove('listening');
}

function speechErrorMessage(error) {
  const messages = {
    'network': 'Mic error: network. Chrome sends speech recognition to a Google service; reload Chrome and retry, then check VPN/privacy extensions and microphone permission for localhost.',
    'not-allowed': 'Mic blocked. Allow microphone access for localhost in Chrome settings, then reload.',
    'service-not-allowed': 'Speech service blocked. Check Chrome speech/microphone permissions, VPN, and privacy extensions, then reload.',
    'audio-capture': 'No microphone found. Check the Mac input device and Chrome microphone permission.',
    'no-speech': 'Did not hear speech. Try again close to the mic.',
    'aborted': 'Listening stopped. Try again.'
  };
  return messages[error] || `Mic error: ${error}`;
}

function createRecognition() {
  const nextRecognition = new SpeechRecognition();
  nextRecognition.lang = 'en-US';
  nextRecognition.interimResults = false;
  nextRecognition.maxAlternatives = 5;

  nextRecognition.addEventListener('result', (event) => {
    const current = words[currentIndex];
    if (!current) {
      statusEl.textContent = 'Add at least one word below, then tap Apply.';
      return;
    }
    const target = current.word;
    const alternatives = Array.from(event.results[0]).map(r => r.transcript);
    const matched = alternatives.some(alt => isCloseEnough(alt, target));

    if (matched) {
      showReward();
    } else {
      statusEl.textContent = `Heard: "${alternatives[0]}" — try again!`;
    }
  });

  nextRecognition.addEventListener('end', stopListening);

  nextRecognition.addEventListener('error', (e) => {
    statusEl.textContent = speechErrorMessage(e.error);
    stopListening();
  });

  return nextRecognition;
}

if (SpeechRecognition) {
  recognition = createRecognition();
} else {
  micBtn.disabled = true;
}

micBtn.addEventListener('click', () => {
  if (!SpeechRecognition || listening) return;
  recognition = createRecognition();
  listening = true;
  micBtn.classList.add('listening');
  statusEl.textContent = 'Listening...';
  try {
    recognition.start();
  } catch (e) {
    statusEl.textContent = 'Could not start listening. Reload Chrome and try again.';
    stopListening();
  }
});

function showReward() {
  wordScreen.classList.add('hidden');
  rewardScreen.classList.remove('hidden');

  if (!youtubeVideoId) {
    rewardVideoWrap.innerHTML = '<p>Set a reward YouTube URL below first.</p>';
    return;
  }
  rewardVideoWrap.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&loop=1&playlist=${youtubeVideoId}&controls=0"
      allow="autoplay; encrypted-media"
      allowfullscreen></iframe>`;
}

function nextWord() {
  if (!words.length) return;
  currentIndex = (currentIndex + 1) % words.length;
  loadWord(currentIndex);
  rewardScreen.classList.add('hidden');
  wordScreen.classList.remove('hidden');
  rewardVideoWrap.innerHTML = '';
}

function prevWord() {
  if (!words.length) return;
  currentIndex = (currentIndex - 1 + words.length) % words.length;
  loadWord(currentIndex);
}

againBtn.addEventListener('click', nextWord);
rewardNowBtn.addEventListener('click', showReward);
document.getElementById('nextWordBtn').addEventListener('click', nextWord);
document.getElementById('prevBtn').addEventListener('click', prevWord);

applyWordsBtn.addEventListener('click', () => {
  words = parseWordList(wordListInput.value);
  currentIndex = 0;
  loadWord(0);
});

// ---------------------------------------------------------------------
// Recording UI: hold to record isn't needed here — click to start,
// click again to stop (simpler for a parent to operate one-handed).
// ---------------------------------------------------------------------

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    statusEl.textContent = 'Recording is not supported in this browser.';
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    });
    mediaRecorder.addEventListener('stop', async () => {
      stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      const dataUrl = await blobToDataUrl(blob);
      const current = words[currentIndex];
      if (current) {
        voiceClips = setVoiceClip(voiceClips, current.word, dataUrl);
        saveVoiceClips(voiceClips);
        refreshVoiceClipUi();
        statusEl.textContent = 'Saved your recording for this word.';
      }
    });
    mediaRecorder.start();
    isRecording = true;
    recordBtn.textContent = '⏹️ Stop recording';
    statusEl.textContent = 'Recording... say the word, then tap Stop.';
  } catch (e) {
    statusEl.textContent = 'Could not access the microphone. Check browser permissions.';
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
  }
  isRecording = false;
}

recordBtn.addEventListener('click', () => {
  const current = words[currentIndex];
  if (!current) {
    statusEl.textContent = 'Add at least one word below, then tap Apply.';
    return;
  }
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

clearClipBtn.addEventListener('click', () => {
  const current = words[currentIndex];
  if (!current) return;
  voiceClips = clearVoiceClip(voiceClips, current.word);
  saveVoiceClips(voiceClips);
  refreshVoiceClipUi();
  statusEl.textContent = 'Cleared the recorded clip for this word.';
});

// init
words = parseWordList(wordListInput.value);
loadWord(0);
