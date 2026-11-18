# PET/CT Explorer

A single-page site about PET/CT scanners, built with Claude.

1. **History:** an interactive timeline from the first X-ray (1895) to total-body PET (2018).
2. **The science:** six figures, five of them interactive: tracer decay, positron annihilation, catching photon pairs, how CT sees, and PET/CT fusion.
3. **Play: Photon Run:** you are an X-ray photon trying to cross the body and reach the detector. Bones stop you; organs slow you down. A run takes about 25 seconds.

## Open it

Double-click `index.html`, or serve the folder:

```
python -m http.server 8765
```

There is no build step and nothing to install. All drawings are original and nothing loads from other sites.

## Test the game rules

```
node --test tests/game-core.test.js
```

## Publish on GitHub Pages

In the repository on GitHub: Settings → Pages → Deploy from a branch → `main`, folder `/ (root)`.

## Files

- `index.html`, `css/styles.css`: the page
- `js/timeline.js`: timeline events and behaviour
- `js/figures.js`: hero animation and science figures
- `js/game-core.js`: game rules and level (no drawing, tested in Node)
- `js/game.js`: game drawing, input, screens and sound
- `docs/superpowers/specs/`: the original design. The built site is a simplified version of it: 15 timeline events, six figures, original drawings only.
