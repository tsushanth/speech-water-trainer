# Speech Water Trainer

Local, no-backend web app: shows a word + picture, speaks it aloud, listens via mic,
and plays a reward video (default: water running) when the spoken attempt is close
enough to the target word.

## Setup

1. Serve the folder locally (Chrome requires a server, not `file://`, for mic access):
   ```
   cd speech-water-trainer
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000` in **Chrome** (Web Speech API support is best there).
3. Allow microphone access when prompted.
4. Paste a YouTube URL (any water-running clip) into the "Reward YouTube URL" field
   at the bottom and hit Apply — it's saved in the browser (localStorage) so you
   only need to set it once per device.

## Using it

- Tap "Hear the word" to have it spoken aloud.
- Tap "Your turn" and have him attempt the word into the mic.
- Tap "Reward" when an adult wants to reinforce the attempt manually, or when
  Chrome speech recognition is unavailable/flaky.
- Matching is lenient (edit-distance based), not exact — partial/approximate
  attempts can pass. If it's too strict or too loose for him, adjust the
  `threshold` logic in `app.js` (`isCloseEnough`).
- Edit the word list at the bottom of the page (word,emoji per line) and hit Apply
  to customize vocabulary — swap in his real photos later by replacing the emoji
  display with `<img>` tags in `index.html`/`app.js`.

## Why these words? (default word list rationale)

The original ~40-word default list was picked informally — mostly nouns and a
few obvious action words. This version was rebuilt against real, published
research from the AAC (Augmentative and Alternative Communication) field on
what young/early communicators actually need to say, plus one adjustment
specific to him: since he's working on single-syllable articulation, most
words below are one syllable on purpose — easier to attempt and easier to
judge as "close enough."

**What "core vocabulary" means, and why it matters here:** SLP research
repeatedly finds that a small set of ~200-400 high-frequency words —
disproportionately verbs, pronouns, and other function words rather than
nouns — accounts for the large majority of what people actually say. For
someone starting from non-verbal, teaching a few of *those* words first
pays off more than teaching object names, because words like "more," "go,"
"stop," "open," and "help" can be reused across nearly every situation,
while a noun like "ball" is only useful when a ball is actually present.
This is the standard argument for "core vs. fringe" vocabulary in AAC
practice (see AssistiveWare's explanation, a mainstream AAC software
vendor's clinical-education material, linked below).

**Real sources checked (not assumed from memory):**
- Banajee, M., DiCarlo, C., & Stricklin, S. (2003). *Core Vocabulary
  Determination for Toddlers.* Augmentative and Alternative Communication,
  19, 67–73. — a published study identifying the words toddlers actually
  used most across different routines/activities. I could not get the full
  original text (it's paywalled), but its word list is summarized and
  reproduced in the PRC-Saltillo AAC Language Lab document below, which
  cites it directly.
- PRC-Saltillo / AAC Language Lab, *"100 Frequently Used Core Words"*
  (2020) — https://aaclanguagelab.com/resources/100-high-frequency-core-word-list
  (PDF: https://aaclanguagelab.com/materials/100highfrequencycorewords21.pdf).
  This is a real, citeable clinical resource (PRC-Saltillo makes AAC
  devices used by SLPs) that explicitly compiles its list from the Banajee
  toddler study, Gail Van Tatenhove's "First 50 Words" (a well-known AAC
  clinician/researcher), LAMP starter words, PRC core starter sets, and the
  Dolch sight-word list. Most of the verbs, prepositions, and social words
  in the new default list below (go, stop, more, want, help, open, close,
  look, get, put, give, come, done, up, down, in, out, on, off, no, yes)
  come directly from this compiled list.
- AssistiveWare, *"Do's and Don'ts of AAC — Core Words"* and *"Teaching
  with core words"* — https://www.assistiveware.com/blog/dos-and-donts-aac-core-words
  and https://www.assistiveware.com/blog/teaching-core-words-building-blocks-communication-and-curriculum.
  AssistiveWare makes a major AAC app (Proloquo2Go) and publishes
  clinician-facing education material. Used here for the general
  core-vs-fringe framing and for the "don't drop fringe words entirely —
  keep a few personally relevant ones" guidance, which is why the list
  below still keeps some concrete nouns (mom, dad, water, milk, dog, cat,
  etc.) rather than going all-function-words.
- PrAACtical AAC (praacticalaac.org) — a well-known AAC clinician-run
  resource site — confirms the general framing that core vocabulary is
  "high-frequency, multipurpose" words that make up the bulk of everyday
  communication, and that the goal is enabling a person to generate novel
  messages, not just requests. Used for general framing only; I did not
  pull specific word-list content from this site into the default list.

What I did **not** verify and am not claiming: I did not get direct access
to the full original Banajee et al. 2003 paper (it's behind an academic
paywall) — the specific toddler word list here is taken from PRC-Saltillo's
published summary/compilation of it, not from reading the original study
myself. I'm citing the compilation, not the primary source, and flagging
that distinction rather than pretending otherwise.

**Category-by-category rationale for the new default list:**

- **Core requesting/action verbs** — `more, stop, go, want, help, eat,
  drink, open, close, look, get, put, give, come, done, play` — these are
  the words that show up across nearly every published core list above.
  They're reusable in any context (you can say "more" about food, a video,
  or a game) and are exactly the kind of "generative" vocabulary the AAC
  research argues for over single-purpose object names.
- **Social/response words** — `no, yes` — near-universal on every core
  list; the fastest way to give him a way to answer a yes/no question
  before longer words are reliable.
- **Prepositions/spatial words** — `up, down, in, out, on, off` — these
  appear on essentially every published list (PRC-Saltillo, Van
  Tatenhove) because they combine with almost any verb or noun ("go up,"
  "ball in") and are short, single-syllable, and physically demonstrable,
  which helps with articulation practice specifically.
- **Descriptors** — `big, small, hot, cold` — kept from the original list;
  they're common on core lists (PRC-Saltillo includes big/little, and
  hot/cold are frequent safety-relevant early descriptors in general AAC
  practice, though I did not find them called out as core in the specific
  sources above — flagging that as a judgment call, not a cited claim).
- **People** — `mom, dad, me` — not "core" in the technical
  high-frequency-function-word sense, but every source above explicitly
  says to keep some personally meaningful fringe words alongside core
  words rather than an all-function-word list (this is the AssistiveWare
  "don't throw the baby out with the bathwater" guidance). These are also
  the words with the highest day-to-day communicative payoff for a
  specific child.
- **A handful of concrete/motivating fringe nouns** — `water, cup, milk,
  juice, ball, book, bath, bed, shoe, dog, cat` — trimmed down from the
  original list (dropped `sock`, `run`, `jump`, `sit`, `push`, `pull`,
  `mine` to keep the total list from growing much past its original size —
  AAC practice also emphasizes starting with a small vocabulary rather
  than an overwhelming one). These are kept specifically because they're
  concrete, motivating, and mostly single-syllable, which matters more for
  articulation drilling than for AAC-completeness.

The list is 42 words, close to the original's ~40, on purpose — this isn't
meant to become a full AAC vocabulary, just a better-grounded starter set.
Edit the textarea on the page (word,emoji per line) to add/remove words as
he progresses; the "start small, add more later" approach is itself a
documented AAC practice, not just a convenience of this app.

## Real photos instead of emoji

Each word can optionally have a real photo attached instead of its emoji —
use the photo upload control under the picture on the current word. Photos
are stored as data URLs in `localStorage` (same pattern as the reward video
URL, no server/upload). Falls back to the emoji automatically for any word
without a stored photo. Note: `localStorage` has a small quota (typically
5-10MB per browser origin) — a handful of full-resolution photos could hit
that ceiling; there's no compression step, so prefer smaller images.

## Familiar-voice recordings (parent's own voice per word)

Instead of always using the robotic browser TTS voice, you can record yourself
saying each word once, and the app will play that clip back instead:

- Tap "🎙️ Record my voice" on the current word, say the word, tap "⏹️ Stop
  recording". The clip is saved immediately (base64-encoded, in
  `localStorage`, the same way the reward-video URL is saved — no server,
  no account, no upload).
- "Hear the word" and the reward flow both play your recorded clip when one
  exists for the current word, falling back to the computer voice
  automatically for any word that doesn't have one.
- "🗑️ Clear clip" removes the recording for the current word and reverts it
  to the computer voice.
- Clips are stored per-word (matched by the word's text, case/whitespace
  insensitive), not per-browser-session, so they persist across reloads on
  the same device/browser. They live only in that browser's `localStorage`
  — clearing browser data, using a different browser, or a different
  device will lose them (there's no sync/backend to back them up).

### Why not real AI voice cloning?

Actual voice-cloning TTS (e.g. feeding a short reference clip into a model
to synthesize *new* words in that voice) needs a server to run the cloning
model and costs money per call — that breaks this app's "zero backend, zero
API cost, fully static page" constraint. What's built instead is simpler and
free: a single real recording of you saying each specific word, played back
verbatim. It only works for words you've actually recorded (no on-the-fly
synthesis of new words in your voice), but it's the honest zero-backend
option and still gets the "familiar voice" engagement benefit.

### Constraints this depends on

- Recording requires a **secure context** — `https://` or `localhost`.
  Serving over plain `http://` from a LAN IP (e.g. `http://192.168.x.x:8000`)
  will NOT be allowed to use the microphone; use `localhost` on the device
  running the browser, or serve over HTTPS.
- The browser will prompt for microphone permission on first use; it must
  be allowed for the page to record.
- Needs a browser that supports `getUserMedia` + `MediaRecorder` (all
  current Chrome/Safari/Firefox desktop and mobile do).

## Known limitations

- Web Speech API is tuned for clear adult speech; it may misrecognize unclear
  child speech. Treat this as a v1 to field-test, not a clinical tool.
- Requires Chrome + internet connection (Chrome's speech recognition is cloud-based
  even though the rest of the app is local; the reward video is also fetched from
  YouTube, so it's not usable fully offline).
- `Mic error: network` usually means Chrome could not reach its speech service,
  even if the rest of the internet works. Reload Chrome and retry, then check
  VPN/privacy extensions and `chrome://settings/content/microphone` for localhost.

## Mic `network` error investigation (2026-09-05)

The earlier fix (recreate a fresh `SpeechRecognition` object on every mic click
instead of reusing one stale/exhausted object) is already merged into `main`.
**It has not been confirmed working in a real live Chrome session with a real
microphone** — this investigation was done in an environment with no real
browser or microphone available, so that fix remains unverified in practice. A
human needs to actually click the mic button in Chrome, on the target device,
and confirm the error stops recurring.

Research findings (via web search, not hands-on testing):

- The `network` error from `webkitSpeechRecognition`/`SpeechRecognition` is a
  known, long-standing Chrome quirk (see Chromium issue 570976 and related
  chromium-dev threads) where the browser's round-trip to Google's cloud speech
  backend fails for reasons that aren't surfaced to the page — flaky
  connectivity to that specific Google service, VPNs/privacy extensions
  interfering, or an out-of-date Chrome build. There is no documented
  Chrome flag or `chrome://settings` toggle that reliably fixes it beyond what
  the app already tells the user (retry, disable VPN/extensions, check the mic
  permission, update Chrome).
- Serving over `localhost` already counts as a secure context in Chrome, same
  as real HTTPS — moving off `localhost` to a real TLS cert should not change
  this error. Not something worth spending effort on.
- The genuinely new option: **Chrome 139+ (shipped August 2025) supports
  fully on-device speech recognition** via `SpeechRecognition.available()`,
  `SpeechRecognition.install()`, and a `processLocally` flag on the
  recognition object (MDN: `SpeechRecognition/processLocally`,
  `available_static`, `install_static`). When available and enabled, audio
  never leaves the device and Chrome's cloud speech service (the thing
  throwing this `network` error) is bypassed entirely for that path.
  - This is genuinely new (2025/2026) and, per Chromium issue 444393111, has
    been reported broken on macOS in some builds — so it cannot be assumed to
    reliably work, only attempted opportunistically.
  - `app.js` now calls `SpeechRecognition.available({ langs: ['en-US'],
    processLocally: true })` on each mic click before starting, and sets
    `processLocally = true` when it reports `'available'`. If it reports
    `'downloadable'`/`'downloading'`, it kicks off `install()` for next time
    but still falls back to the existing cloud path for the current attempt.
    If `available()` isn't supported at all in the installed Chrome build (older
    Chrome), it silently falls back to the exact behavior that existed before
    this change — nothing is removed or made stricter for the no-support case.
  - The `network` error message now also reports whether the failed attempt
    was already on-device (meaning this isn't the usual cloud issue — worth
    checking the actual Mac microphone input) or was on-device-unavailable
    (meaning it used the cloud fallback as before).
  - **This on-device path has not been exercised against a real Chrome build
    or a real language-pack download in this investigation** — there's no
    headless/real browser available here to click through the permission and
    download flow. Whether the target Mac's Chrome version actually offers
    `'available'` (rather than `'downloadable'` or unsupported) needs to be
    checked by hand: open DevTools console and run
    `SpeechRecognition.available({langs:['en-US'], processLocally:true})`.
