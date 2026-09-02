let words = [];
let currentIndex = 0;

const pictureEl = document.getElementById('picture');
const wordEl = document.getElementById('word');
const hearBtn = document.getElementById('hearBtn');
const micBtn = document.getElementById('micBtn');
const statusEl = document.getElementById('status');
const wordScreen = document.getElementById('wordScreen');
const rewardScreen = document.getElementById('rewardScreen');
const rewardVideoWrap = document.getElementById('rewardVideoWrap');
const againBtn = document.getElementById('againBtn');
const wordListInput = document.getElementById('wordListInput');
const applyWordsBtn = document.getElementById('applyWords');
const youtubeUrlInput = document.getElementById('youtubeUrlInput');
const applyVideoBtn = document.getElementById('applyVideo');

let youtubeVideoId = '';

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
  wordEl.textContent = w.word;
  pictureEl.textContent = w.emoji;
  statusEl.textContent = '';
}

function speakWord(word) {
  const utter = new SpeechSynthesisUtterance(word);
  utter.rate = 0.7;
  speechSynthesis.speak(utter);
}

hearBtn.addEventListener('click', () => speakWord(words[currentIndex].word));

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

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;

  recognition.addEventListener('result', (event) => {
    const target = words[currentIndex].word;
    const alternatives = Array.from(event.results[0]).map(r => r.transcript);
    const matched = alternatives.some(alt => isCloseEnough(alt, target));

    if (matched) {
      showReward();
    } else {
      statusEl.textContent = `Heard: "${alternatives[0]}" — try again!`;
    }
  });

  recognition.addEventListener('end', () => {
    listening = false;
    micBtn.classList.remove('listening');
  });

  recognition.addEventListener('error', (e) => {
    statusEl.textContent = 'Mic error: ' + e.error;
    listening = false;
    micBtn.classList.remove('listening');
  });
} else {
  statusEl.textContent = 'Speech recognition not supported — use Chrome.';
  micBtn.disabled = true;
}

micBtn.addEventListener('click', () => {
  if (!recognition || listening) return;
  listening = true;
  micBtn.classList.add('listening');
  statusEl.textContent = 'Listening...';
  recognition.start();
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
  currentIndex = (currentIndex + 1) % words.length;
  loadWord(currentIndex);
  rewardScreen.classList.add('hidden');
  wordScreen.classList.remove('hidden');
  rewardVideoWrap.innerHTML = '';
}

function prevWord() {
  currentIndex = (currentIndex - 1 + words.length) % words.length;
  loadWord(currentIndex);
}

againBtn.addEventListener('click', nextWord);
document.getElementById('nextWordBtn').addEventListener('click', nextWord);
document.getElementById('prevBtn').addEventListener('click', prevWord);

applyWordsBtn.addEventListener('click', () => {
  words = parseWordList(wordListInput.value);
  currentIndex = 0;
  loadWord(0);
});

// init
words = parseWordList(wordListInput.value);
loadWord(0);
