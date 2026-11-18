# PET/CT Explorer — Design

Date: 2026-11-18
Status: approved by the user 2026-11-18 (game style: fly and steer; git: commit and push on `main`)

## Intent

A single-page website about PET/CT scanners, hosted on GitHub Pages, built as a class
assignment whose purpose is to **demonstrate what Claude can do**. A visitor (instructor,
classmates, a general audience with no physics background) should come away having
learned something real and thinking "an AI built *this*?"

So polish beats breadth: smooth motion, original figures you can play with, and a game
that feels good in the hand.

## Goals

- One page, three sections, in this order: **History**, **Science**, **Play**.
- Everything a visitor needs loads from this repo. No build step.
- Facts are correct and sourced.
- Works on a laptop (primary) and on a phone (must not break; game playable by touch).

## Non-goals

- No framework, bundler, backend, accounts, analytics, or saved high scores on a server.
- Not a clinical reference. No medical advice.
- No light/dark theme toggle. One theme.
- No multiple game levels, difficulty settings, or leaderboards.

## Anti-goals (would be a failure even if it "works")

- A wall of text with stock photos. The figures must carry the explanation.
- A game that is frustrating, runs longer than ~40 seconds, or needs instructions to
  be read before it is fun.
- Wrong physics presented as fact. Where the game bends reality for fun, the page says so.
- Images used without a clear license and credit.

## Constraints

- Repo: `origin` is `https://github.com/carleton200/PETCT.git`, branch `main`, currently
  no commits. GitHub Pages will serve from the repo root, so `index.html` lives at the root.
  The builder commits and pushes on `main` (see Publishing).
- Must also work when `index.html` is opened straight from disk (double-click). That
  rules out ES modules (`type="module"` fails on `file://`). Use classic
  `<script defer>` files sharing one `window.PETCT` namespace.
- Pure game logic must be loadable in Node for tests: each logic file ends with
  `if (typeof module !== 'undefined') module.exports = …`.
- Available tooling: Node 24, Python 3.11, git, and the Playwright browser tool attached
  to the Claude Code session. No `gh` CLI. No Playwright package is installed and none
  gets added: the repo stays free of `package.json` and `node_modules`.
- GitHub Pages on a free account needs a public repo. The `ai-log/` folder holds full
  conversation transcripts, so `ai-log/` and `.claude/settings.local.json` go in
  `.gitignore`. The log is submitted to Canvas as a file, not published.
- Requests to outside services (image downloads) carry no personal details.

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Plain HTML/CSS/JS, hand-written Canvas game, original SVG figures, public-domain photos for history | More hand-written code; everything custom, fast, no dependencies |
| B | Same site, game on Phaser from a CDN | Ready-made physics, but a heavy library for a 30-second game, generic feel, outside dependency |
| C | React + Vite | Needs a build-and-deploy pipeline for a static page; ruled out |

The user picked A.

## Look and feel (my call)

"Radiology reading room": a near-black navy background, CT-grey text, and accents taken
from the classic PET "hot" colour map (deep red → orange → yellow → white). Figures glow
against the dark. One display typeface for headings and one for body, both open-licensed
(SIL OFL) and saved in `fonts/` with their license files, with system fallbacks. Nothing
is fetched from another site when the page loads.

Page skeleton:

```
┌──────────────────────────────────────────────────────────────┐
│ PET/CT Explorer            History   Science   Play          │  sticky nav
├──────────────────────────────────────────────────────────────┤
│  HERO: animated detector ring, photon pairs flying apart,    │
│  lines of response fading in.  "Seeing inside, two ways."    │
│  [ Start with the history ↓ ]   [ Skip to the game ]         │
├──────────────────────────────────────────────────────────────┤
│ 1 · HISTORY   filter chips: All · X-ray & CT · PET & nuclear │
│               · MRI & ultrasound · Physics                   │
│  1895 ●───●───●────●──●───●────●───●──●────●───● 2020s  ⟷    │
│  ┌─────────────────────────────────────────────┐             │
│  │ [photo]  1971 · First clinical CT scan      │  detail card│
│  │          what happened / why it matters     │             │
│  └─────────────────────────────────────────────┘             │
├──────────────────────────────────────────────────────────────┤
│ 2 · SCIENCE   figure, text, figure, text … (9 figures)       │
├──────────────────────────────────────────────────────────────┤
│ 3 · PLAY      [ game canvas 16:9 ]   + "Reality check" card  │
├──────────────────────────────────────────────────────────────┤
│ Sources · Image credits · "Built with Claude"                │
└──────────────────────────────────────────────────────────────┘
```

## Section 1 — History (interactive timeline)

A horizontal timeline you can drag, scroll, or step through with ← → keys. Each dot is
an event; selecting one opens a detail card with a photo or illustration, a two-to-three
sentence story, and a "why it matters for PET/CT" line. Filter chips dim events outside
the chosen category. On narrow screens the timeline turns vertical.

Planned events (builder verifies every date and name against a reliable source before
it ships, and lists the sources in the footer):

| Year | Event | Category |
|---|---|---|
| 1895 | Röntgen discovers X-rays; first X-ray of a hand | X-ray & CT |
| 1896 | Becquerel discovers radioactivity | Physics |
| 1913 | Coolidge hot-cathode X-ray tube; de Hevesy's tracer principle | X-ray & CT / PET |
| 1917 | Radon's transform: the maths of rebuilding an image from projections | Physics |
| 1928–32 | Dirac predicts the positron; Anderson finds it | Physics |
| 1930s | Lawrence's cyclotron; Joliot-Curies make artificial radioactivity | PET & nuclear |
| 1946 | Nuclear magnetic resonance (Bloch, Purcell) | MRI & ultrasound |
| early 1950s | First positron imaging of brain tumours (Brownell & Sweet, MGH) | PET & nuclear |
| 1957–58 | Anger's gamma camera; Donald's medical ultrasound | PET / MRI & ultrasound |
| 1963 | Cormack's reconstruction maths; Kuhl's emission tomography | X-ray & CT / PET |
| 1971 | First clinical CT scan (Hounsfield, EMI) | X-ray & CT |
| 1973 | Lauterbur's first MRI images | MRI & ultrasound |
| 1973–75 | First PET scanners for humans (Phelps, Hoffman, Ter-Pogossian) | PET & nuclear |
| 1976 | FDG first used in a person | PET & nuclear |
| 1979 | Nobel Prize for CT (Hounsfield & Cormack) | X-ray & CT |
| 1989 | Spiral (helical) CT | X-ray & CT |
| 1998 | First PET/CT prototype (Townsend & Nutt) | PET & nuclear |
| 2000–01 | PET/CT named invention of the year; first commercial scanners | PET & nuclear |
| 2006 | Time-of-flight PET goes commercial | PET & nuclear |
| 2010–11 | Whole-body PET/MRI | MRI & ultrasound |
| 2018 | EXPLORER total-body PET | PET & nuclear |
| 2020s | Photon-counting CT and AI reconstruction | X-ray & CT |

If a fact cannot be confirmed, the event is corrected or dropped, never guessed.

**Images:** public-domain or Creative Commons photos from Wikimedia Commons, saved into
`images/` (not hot-linked), each with author, license, and source link in a visible
"Image credits" list and in `images/CREDITS.md`. Events with no clearly licensed photo
get a small original illustration instead.

## Section 2 — Science (figures first)

Nine original figures, drawn as SVG or Canvas so they are crisp and can move. Each has a
short caption and one or two plain-language paragraphs beside it. Real numbers are used
(511 keV, ~110-minute half-life of fluorine-18, Hounsfield units).

1. **Anatomy of a PET/CT scanner.** Cutaway: CT ring (X-ray tube + detector arc) in
   front, PET ring behind, patient bed sliding through. Hover or tap the labelled parts.
2. **The tracer.** FDG as "glucose with a radioactive tag"; hungry cells trap it.
   Slider: watch fluorine-18 decay away over hours.
3. **Positron meets electron.** Animation: nucleus emits a positron, it wanders about a
   millimetre, annihilates, two 511 keV photons fly off back-to-back.
4. **Catching the pair.** Interactive detector ring: press to fire decays; each
   coincidence draws a line; the lines pile up and reveal a hidden hot spot.
5. **Inside a detector.** Photon → scintillator crystal flash → light sensor → pulse.
6. **How CT sees.** X-ray tube circling the body; a slider for tissue type and thickness
   shows how much of the beam survives (Beer–Lambert law), with the Hounsfield scale from
   air to bone. This figure sets up the game.
7. **From shadows to a slice.** Live reconstruction: a simple phantom, its projections
   stacking into a sinogram, and back-projection rebuilding the picture angle by angle,
   with a toggle between blurry (unfiltered) and sharp (filtered).
8. **Better together.** A blend slider between a stylised CT slice (anatomy) and PET
   (activity), with a note on how the CT also corrects the PET for attenuation.
9. **A patient's hour.** Strip showing injection → quiet wait → CT pass (seconds) → PET
   pass (minutes) → fused images.

Plus two or three real photos where licensing allows (a modern scanner, a real fused
PET/CT image), credited as above.

Animations start when scrolled into view and stop when out of view. With "reduce motion"
set in the visitor's system, they show a still frame with a play button.

## Section 3 — Play: "Photon Run"

You are a CT X-ray photon with a face. The X-ray tube fires you from the left; the
detector waits on the right; a body is in the way.

```
 TUBE ▶  air │skin│  ribs    lungs+heart    ribs   belly organs   SPINE  │skin│ air  ▐ DETECTOR
  (•ᴗ•)~~~>  │    │ ▮  ▮      ( squish )    ▮ ▮     ( squish )    ▮▮▮▮   │    │      ▐
             │    │   ▮  ▮                 ▮   ▮                  ▮ ▮▮   │    │      ▐
```

**How it plays (decided by the user, 2026-11-18): fly and steer.** A side-scrolling
obstacle run. The photon flies forward on its own and the player steers it up and down
through the gaps between bone fragments. There is no gravity, no floor, and no jump
button. Run-and-jump and flap-against-gravity were offered and turned down.

Rules, as you gave them:

- **Bone is the obstacle.** Touch a bone fragment and you are stuck: absorbed, run over,
  you never reach the detector.
- **Organs slow you down a little.** Inside an organ the photon moves at about 70 % speed,
  with a jelly wobble. Slower means a lower score, not a loss.
- **20–40 seconds.** One fixed, hand-built level. A clean run takes about 25 seconds; a
  run through every organ takes about 35. It cannot exceed 40.
- **Reach the detector to win.**

My additions, for fun (cut any you dislike):

- Controls: ↑/↓ or W/S; on touch screens hold the upper or lower half. Space or tap to
  start and to retry instantly. P or Esc pauses. The game pauses itself if you switch tabs.
- Whimsy: the photon has a face and a sparkle trail; bones scowl; organs jiggle and
  blush when you pass through; the detector cheers. Losing shows a one-liner ("Absorbed
  by a rib. You are now a tiny bit of warmth."), winning shows "Detected! You are one
  bright pixel," and your pixel lights up in a little X-ray image.
- Optional sparkles to collect for score, and a one-to-three-star rating from time and
  sparkles. Best score is remembered in the browser only.
- Sound: short synthesised blips (no audio files), on once you press Play, with a mute
  button.
- Forgiving collisions: the hit area is smaller than the drawn photon.
- A **Reality check** card next to the game: real photons cannot steer and do not slow
  down. Each one either gets through or is absorbed or scattered, by chance, and bone
  stops far more of them than soft tissue. That is why bone looks white on a CT image.
  It links back to figure 6.

## Files

```
index.html
css/styles.css
js/timeline-data.js     events (plain data)
js/timeline.js          timeline behaviour
js/figures/*.js         one file per interactive figure
js/game/level.js        level layout (plain data)
js/game/core.js         movement, collisions, win/lose, scoring — no drawing, testable in Node
js/game/render.js       drawing, particles
js/game/audio.js        synthesised sound
js/game/main.js         input, game loop, screens
js/reconstruct.js       projection / back-projection maths for figure 7 — testable in Node
images/                 photos + CREDITS.md
fonts/                  two typefaces (woff2) + their license files
tests/                  Node unit tests
README.md               what this is, how to run it, how to publish on Pages
.gitignore              ai-log/, .claude/settings.local.json, node_modules/
.nojekyll
```

## How we know it works

- **Unit tests** (`node --test`, no packages to install): game core (bone contact ends the
  run, organs slow the photon, reaching the detector wins, the level is winnable, a
  scripted perfect run and a scripted slowest run both finish inside 20–40 s), the
  reconstruction maths, and timeline data (every event has year, title, text, category,
  and image credit or illustration).
- **In a real browser, with Playwright:** load the page from a local server and from
  disk; no console errors; nav links land on the right sections; timeline responds to
  click, keys, and filters; each figure animates and its controls respond; the game
  starts, a bone hit ends it, a steered run wins, and the time lands in range. Screenshots
  at laptop and phone widths get looked at, not just taken. The game exposes a small
  read-only test hook (`window.PETCT.game.state`) so a script can steer it.
- **How the browser checks are run (my call):** through the session's Playwright browser
  tool, against `python -m http.server` in the repo root. They are done during the build
  and their results reported; they are not saved as re-runnable scripts (the unit tests
  are the re-runnable part). If the session browser refuses `file://` pages, the
  opened-from-disk check is done with headless Edge (`msedge --headless --dump-dom`),
  and failing that by checking the rules that make it work: no `type="module"`, no
  `fetch()` of local files, only relative asset paths.

## Publishing

**Git (decided by the user, 2026-11-18):** the builder commits on `main` and pushes to
`origin` as needed. (The user first chose "no git at all", then reversed it: "you can
push and update the git on main as you need".) Work happens directly on `main`, in small
commits. Pushes happen at points where the site is in a working state, never mid-change.

`.gitignore` keeps `ai-log/` (full conversation transcripts), `.claude/settings.local.json`
and browser-tool scratch folders out of the repo. Nothing from those is ever staged.

Turning on GitHub Pages is a setting in the GitHub website and stays with the user.
`README.md` carries the steps: Settings → Pages → deploy from `main` / root.

## Left to the builder

Exact wording, typefaces, colour values, figure styling, level layout and tuning, which
specific Wikimedia photos to use, sound design, particle counts, file-internal structure.
