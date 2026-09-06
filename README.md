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
