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
