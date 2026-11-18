// Photon Run rules: movement, collisions, win/lose. No drawing, so Node can test it.
(function (root) {
  'use strict';

  var C = { W: 960, H: 540, DT: 1 / 120, SPEED: 300, STEER: 340, R: 10, Y_MIN: 26, Y_MAX: 514, MAX_FRAME: 0.1 };

  // A gate is a column of bone with one gap. bob makes the gap slide up and down.
  function gate(id, x, gapY, gapH, w, bob) {
    return { id: id, type: 'gate', x: x, w: w || 30, gapY: gapY, gapH: gapH, bob: bob || null };
  }
  function chip(id, x, y, r, bob) { return { id: id, type: 'chip', x: x, y: y, r: r, bob: bob || null }; }
  function organ(name, cx, cy, rx, ry, slow, color) { return { name: name, cx: cx, cy: cy, rx: rx, ry: ry, slow: slow, color: color }; }

  var level = {
    length: 7300, startX: 100, startY: 270, detectorX: 7100,
    regions: [
      { label: 'Air', from: 0, to: 520 }, { label: 'Skin', from: 520, to: 680 },
      { label: 'Rib cage', from: 680, to: 1900 }, { label: 'Lungs & heart', from: 1900, to: 3350 },
      { label: 'Lower ribs', from: 3350, to: 4000 }, { label: 'Belly', from: 4000, to: 5400 },
      { label: 'Spine', from: 5400, to: 6150 }, { label: 'Back', from: 6150, to: 6850 },
      { label: 'Air', from: 6850, to: 7300 }
    ],
    bones: [
      gate('rib1', 800, 210, 170), gate('rib2', 1100, 350, 160), gate('rib3', 1400, 190, 160), gate('rib4', 1700, 330, 150),
      chip('chip1', 2150, 270, 22, { a: 90, p: 3.2, ph: 0 }), chip('chip2', 2480, 110, 20),
      chip('chip3', 2900, 290, 22, { a: 100, p: 3.6, ph: 1.5 }), chip('chip4', 3150, 440, 20),
      gate('rib5', 3500, 310, 150), gate('rib6', 3800, 170, 150),
      chip('chip5', 4350, 400, 20, { a: 60, p: 3, ph: 0.5 }), chip('chip6', 4750, 160, 20, { a: 70, p: 3.4, ph: 2 }),
      chip('chip7', 5050, 300, 18),
      gate('spine1', 5600, 270, 140, 64, { a: 80, p: 4, ph: 0 }), gate('spine2', 5950, 270, 140, 64, { a: 80, p: 4, ph: 2.2 }),
      gate('rib7', 6300, 200, 150), gate('rib8', 6600, 350, 150)
    ],
    organs: [
      organ('Lung', 2550, 130, 560, 105, 0.88, '#6fb7d9'), organ('Lung', 2550, 420, 560, 100, 0.88, '#6fb7d9'),
      organ('Heart', 2600, 275, 150, 85, 0.7, '#e8556d'),
      organ('Liver', 4350, 170, 240, 125, 0.7, '#b5652f'), organ('Stomach', 4750, 390, 200, 110, 0.7, '#e59ac0'),
      organ('Kidney', 5130, 160, 110, 70, 0.7, '#c2504a'), organ('Gut', 5160, 420, 170, 80, 0.7, '#e8a86b')
    ],
    sparkles: [
      [400, 200], [560, 320], [800, 210], [950, 280], [1100, 350], [1250, 270], [1400, 190], [1700, 330],
      [1950, 180], [2350, 200], [2700, 170], [3000, 180], [3500, 310], [3800, 170], [4050, 330], [4500, 320],
      [4900, 270], [5300, 290], [6300, 200], [6450, 280], [6600, 350], [6850, 270]
    ].map(function (p, i) { return { id: i, x: p[0], y: p[1] }; })
  };

  function bobOffset(b, t) { return b.bob ? b.bob.a * Math.sin((2 * Math.PI * t) / b.bob.p + b.bob.ph) : 0; }

  // Rectangles (gates) and circles (chips) for a bone at time t. Drawing uses this too.
  function boneShapes(b, t) {
    var off = bobOffset(b, t);
    if (b.type === 'chip') return [{ circle: true, x: b.x, y: b.y + off, r: b.r }];
    var top = b.gapY + off - b.gapH / 2, bottom = b.gapY + off + b.gapH / 2;
    return [
      { x: b.x - b.w / 2, y: -200, w: b.w, h: top + 200 },
      { x: b.x - b.w / 2, y: bottom, w: b.w, h: C.H + 200 - bottom }
    ];
  }

  function hits(shape, x, y, r) {
    if (shape.circle) { var dx = x - shape.x, dy = y - shape.y, rr = r + shape.r; return dx * dx + dy * dy < rr * rr; }
    var nx = Math.max(shape.x, Math.min(x, shape.x + shape.w)), ny = Math.max(shape.y, Math.min(y, shape.y + shape.h));
    return (x - nx) * (x - nx) + (y - ny) * (y - ny) < r * r;
  }

  function organAt(lv, x, y) {
    var best = null;
    for (var i = 0; i < lv.organs.length; i++) {
      var o = lv.organs[i], dx = (x - o.cx) / o.rx, dy = (y - o.cy) / o.ry;
      if (dx * dx + dy * dy <= 1 && (!best || o.slow < best.slow)) best = o;
    }
    return best;
  }

  function createState(lv) {
    return { phase: 'running', t: 0, acc: 0, x: lv.startX, y: lv.startY, vy: 0, speed: C.SPEED, organ: null, bone: null,
      taken: lv.sparkles.map(function () { return false; }), sparkles: 0 };
  }

  // One fixed tick. input: { dir: -1|0|1, targetY: number|null }. Returns events for sound and effects.
  function step(s, lv, input) {
    var ev = [];
    if (s.phase !== 'running') return ev;
    var want = (input && input.dir) || 0;
    if (input && input.targetY != null) want = Math.max(-1, Math.min(1, (input.targetY - s.y) / 30));
    s.vy += (want * C.STEER - s.vy) * Math.min(1, C.DT * 16);
    s.y = Math.max(C.Y_MIN, Math.min(C.Y_MAX, s.y + s.vy * C.DT));

    var o = organAt(lv, s.x, s.y), name = o ? o.name : null;
    if (name !== s.organ) { ev.push({ type: o ? 'enterOrgan' : 'exitOrgan', name: name || s.organ }); s.organ = name; }
    s.speed += (C.SPEED * (o ? o.slow : 1) - s.speed) * Math.min(1, C.DT * 8);
    s.x += s.speed * C.DT;
    s.t += C.DT;

    for (var i = 0; i < lv.bones.length; i++) {
      var b = lv.bones[i];
      if (Math.abs(b.x - s.x) > 120) continue;
      var shapes = boneShapes(b, s.t);
      for (var k = 0; k < shapes.length; k++) {
        if (hits(shapes[k], s.x, s.y, C.R)) { s.phase = 'stuck'; s.bone = b.id; ev.push({ type: 'stuck', id: b.id }); return ev; }
      }
    }
    for (var j = 0; j < lv.sparkles.length; j++) {
      var sp = lv.sparkles[j];
      if (!s.taken[j] && Math.abs(sp.x - s.x) < 30 && Math.abs(sp.y - s.y) < 30) { s.taken[j] = true; s.sparkles++; ev.push({ type: 'sparkle' }); }
    }
    if (s.x >= lv.detectorX) { s.phase = 'won'; ev.push({ type: 'won' }); }
    return ev;
  }

  // Feed real frame time; runs whole ticks so speed is the same on any screen.
  function advance(s, lv, input, dt) {
    var ev = [];
    s.acc += Math.min(dt, C.MAX_FRAME);
    while (s.acc >= C.DT) { s.acc -= C.DT; ev = ev.concat(step(s, lv, input)); }
    return ev;
  }

  function summary(s, lv) {
    var won = s.phase === 'won', total = lv.sparkles.length;
    var stars = !won ? 0 : s.sparkles >= total * 0.8 ? 3 : s.sparkles >= total * 0.5 ? 2 : 1;
    return { won: won, timeSec: Math.round(s.t * 10) / 10, sparkles: s.sparkles, total: total, stars: stars,
      progress: Math.max(0, Math.min(1, (s.x - lv.startX) / (lv.detectorX - lv.startX))) };
  }

  function regionAt(lv, x) {
    for (var i = 0; i < lv.regions.length; i++) if (x < lv.regions[i].to) return lv.regions[i];
    return lv.regions[lv.regions.length - 1];
  }

  function clone(s) { return JSON.parse(JSON.stringify(s)); }

  var api = { C: C, level: level, createState: createState, step: step, advance: advance, summary: summary,
    boneShapes: boneShapes, organAt: organAt, regionAt: regionAt, clone: clone };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.PETCT = root.PETCT || {}; root.PETCT.core = api; }
})(typeof self !== 'undefined' ? self : this);
