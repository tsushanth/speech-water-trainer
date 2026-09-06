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

## Known limitations

- Web Speech API is tuned for clear adult speech; it may misrecognize unclear
  child speech. Treat this as a v1 to field-test, not a clinical tool.
- Requires Chrome + internet connection (Chrome's speech recognition is cloud-based
  even though the rest of the app is local; the reward video is also fetched from
  YouTube, so it's not usable fully offline).
- `Mic error: network` usually means Chrome could not reach its speech service,
  even if the rest of the internet works. Reload Chrome and retry, then check
  VPN/privacy extensions and `chrome://settings/content/microphone` for localhost.
