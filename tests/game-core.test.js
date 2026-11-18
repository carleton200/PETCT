const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../js/game-core.js');
const { C, level } = core;

function run(policy) {
  const s = core.createState(level);
  while (s.phase === 'running' && s.t < 60) core.step(s, level, { dir: policy(s), targetY: null });
  return s;
}

// A simple look-ahead player: try each direction, keep the one that survives longest.
function bot(s) {
  let best = 0, bestScore = -1;
  for (const d1 of [0, -1, 1]) for (const d2 of [0, -1, 1]) {
    const c = core.clone(s);
    let n = 0;
    while (c.phase === 'running' && n < 170) { core.step(c, level, { dir: n < 30 ? d1 : d2, targetY: null }); n++; }
    const score = n + (c.phase === 'won' ? 1000 : 0) + c.sparkles * 3 - Math.abs(d1) * 0.5;
    if (score > bestScore) { bestScore = score; best = d1; }
  }
  return best;
}

test('every finished run lasts 20 to 40 seconds', () => {
  const dist = level.detectorX - level.startX;
  const minSlow = Math.min(...level.organs.map((o) => o.slow));
  assert.ok(dist / C.SPEED >= 20);
  assert.ok(dist / (C.SPEED * minSlow) <= 40);
});

test('doing nothing, holding up, or holding down gets you stuck on bone', () => {
  for (const d of [0, -1, 1]) assert.equal(run(() => d).phase, 'stuck');
});

test('a careful player reaches the detector in 20 to 40 seconds', () => {
  let decision = 0, n = 0;
  const s = run((st) => { if (n++ % 6 === 0) decision = bot(st); return decision; });
  assert.equal(s.phase, 'won');
  const sum = core.summary(s, level);
  assert.ok(sum.timeSec >= 20 && sum.timeSec <= 40, 'time ' + sum.timeSec);
  assert.ok(sum.stars >= 1);
});

test('organs slow the photon, and it recovers afterwards', () => {
  const lv = { ...level, bones: [], sparkles: [], organs: [{ name: 'Blob', cx: 600, cy: 270, rx: 200, ry: 300, slow: 0.7 }] };
  const s = core.createState(lv);
  let inside = 0;
  while (s.x < 1200) { core.step(s, lv, { dir: 0 }); if (s.x > 550 && s.x < 750) inside = s.speed; }
  assert.ok(Math.abs(inside - 210) < 5, 'speed inside ' + inside);
  assert.ok(Math.abs(s.speed - 300) < 5);
});

test('touching bone freezes the run', () => {
  const s = run(() => 0);
  const x = s.x;
  core.step(s, level, { dir: 1 });
  assert.equal(s.x, x);
  assert.ok(s.bone);
});

test('speed does not depend on frame rate, and a long stall is capped', () => {
  const lv = { ...level, bones: [], organs: [], sparkles: [] };
  const xs = [60, 144, 30].map((fps) => { const s = core.createState(lv); for (let i = 0; i < fps * 2; i++) core.advance(s, lv, { dir: 0 }, 1 / fps); return s.x; });
  assert.ok(Math.max(...xs) - Math.min(...xs) < 6);
  const s = core.createState(lv);
  core.advance(s, lv, { dir: 0 }, 5);
  assert.ok(s.t <= C.MAX_FRAME + C.DT);
});

test('sparkles sit clear of bone', () => {
  for (const sp of level.sparkles) for (const b of level.bones) for (let t = 0; t < 8; t += 0.1)
    for (const sh of core.boneShapes(b, t)) {
      const hit = sh.circle ? Math.hypot(sp.x - sh.x, sp.y - sh.y) < sh.r + C.R + 4
        : sp.x > sh.x - 14 && sp.x < sh.x + sh.w + 14 && sp.y > sh.y - 14 && sp.y < sh.y + sh.h + 14;
      assert.ok(!hit || b.type === 'gate' && b.bob, `sparkle ${sp.id} touches ${b.id}`);
    }
});
