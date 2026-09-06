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
