// Hero animation and the five interactive science figures. Each animates only while on screen.
(function () {
  'use strict';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOT = ['#b3202a', '#f05a28', '#ff9f43', '#ffd166', '#fff3c4'], COOL = '#5fd4e6', INK = '#b9c3d6';

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // Calls frame(dt, t) every animation frame while el is on screen and the tab is visible.
  function animate(el, frame) {
    var on = false, last = 0, t = 0, id = 0;
    function tick(now) { var dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; frame(dt, t); if (on) id = requestAnimationFrame(tick); }
    function set(v) { if (v === on) return; on = v; if (on) { last = performance.now(); id = requestAnimationFrame(tick); } else cancelAnimationFrame(id); }
    frame(0, 0);
    if (reduced) return;
    new IntersectionObserver(function (es) { set(es[0].isIntersecting && !document.hidden); }, { threshold: 0.15 }).observe(el);
    document.addEventListener('visibilitychange', function () { if (document.hidden) set(false); });
  }
  function fig(id) { var f = document.getElementById(id); return f && { root: f, canvas: f.querySelector('canvas'), ctx: f.querySelector('canvas').getContext('2d'), out: f.querySelector('.fig__readout') }; }
  function ringPoint(cx, cy, R, x, y, a) { // where a ray from (x,y) at angle a leaves a circle
    var dx = Math.cos(a), dy = Math.sin(a), ox = x - cx, oy = y - cy, b = ox * dx + oy * dy;
    var k = -b + Math.sqrt(b * b - (ox * ox + oy * oy - R * R)); return [x + dx * k, y + dy * k];
  }

  // ---- Hero: a detector ring catching photon pairs
  (function () {
    var c = document.getElementById('hero-canvas'); if (!c) return;
    var ctx = c.getContext('2d'), pairs = [], r = rng(3), w = 0, h = 0, spawn = 0;
    function size() { w = c.width = c.clientWidth; h = c.height = c.clientHeight; }
    size(); addEventListener('resize', size);
    animate(c, function (dt) {
      var cx = w * (w > 800 ? 0.74 : 0.5), cy = h * 0.5, R = Math.min(w, h) * (w > 800 ? 0.36 : 0.42);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = w > 800 ? 1 : 0.35;
      for (var i = 0; i < 40; i++) { var a = i / 40 * Math.PI * 2; ctx.save(); ctx.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.rotate(a);
        ctx.fillStyle = '#1a2640'; ctx.fillRect(0, -R * 0.065, R * 0.11, R * 0.13); ctx.restore(); }
      spawn -= dt;
      if (spawn <= 0 || !pairs.length) { spawn = 0.35; var g = r() * 6.28, d = r() * R * 0.25; pairs.push({ x: cx + R * 0.15 + Math.cos(g) * d, y: cy - R * 0.1 + Math.sin(g) * d, a: r() * Math.PI, p: reduced ? 1 : 0 }); }
      pairs = pairs.filter(function (p) { return p.p < 2.2; });
      pairs.forEach(function (p) {
        p.p += dt * 1.4;
        var e1 = ringPoint(cx, cy, R, p.x, p.y, p.a), e2 = ringPoint(cx, cy, R, p.x, p.y, p.a + Math.PI), k = Math.min(1, p.p);
        ctx.strokeStyle = 'rgba(255,159,67,' + 0.5 * Math.max(0, 1 - (p.p - 1)) + ')'; ctx.lineWidth = 1.2; ctx.beginPath();
        ctx.moveTo(p.x + (e1[0] - p.x) * k, p.y + (e1[1] - p.y) * k); ctx.lineTo(p.x + (e2[0] - p.x) * k, p.y + (e2[1] - p.y) * k); ctx.stroke();
        if (p.p < 1) [e1, e2].forEach(function (e) { ctx.fillStyle = HOT[4]; ctx.beginPath(); ctx.arc(p.x + (e[0] - p.x) * k, p.y + (e[1] - p.y) * k, 3, 0, 7); ctx.fill(); });
      });
      ctx.globalAlpha = 1;
    });
  })();

  // ---- Figure 2: decay of fluorine-18
  (function () {
    var f = fig('fig-decay'); if (!f) return;
    var slider = f.root.querySelector('input'), order = [], r = rng(11), HALF = 109.8;
    for (var i = 0; i < 100; i++) order.push([r(), i]); order.sort(function (a, b) { return a[0] - b[0]; });
    var rank = []; order.forEach(function (o, k) { rank[o[1]] = k; });
    function draw() {
      var min = +slider.value, frac = Math.pow(0.5, min / HALF), lit = Math.round(frac * 100), ctx = f.ctx;
      ctx.clearRect(0, 0, 520, 300);
      for (var i = 0; i < 100; i++) { var on = rank[i] < lit, x = 34 + (i % 10) * 24, y = 36 + Math.floor(i / 10) * 24;
        ctx.fillStyle = on ? HOT[3] : '#1a2338'; ctx.shadowColor = HOT[2]; ctx.shadowBlur = on ? 10 : 0; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); }
      ctx.shadowBlur = 0; ctx.strokeStyle = '#25314d'; ctx.strokeRect(300, 36, 200, 216);
      ctx.strokeStyle = HOT[2]; ctx.lineWidth = 2; ctx.beginPath();
      for (var m = 0; m <= 600; m += 10) ctx.lineTo(300 + m / 3, 252 - 216 * Math.pow(0.5, m / HALF)); ctx.stroke();
      ctx.fillStyle = HOT[4]; ctx.beginPath(); ctx.arc(300 + min / 3, 252 - 216 * frac, 6, 0, 7); ctx.fill();
      ctx.fillStyle = INK; ctx.font = '13px Segoe UI, sans-serif'; ctx.fillText('0 h', 296, 272); ctx.fillText('10 h', 478, 272); ctx.fillText('amount left', 306, 30);
      var hh = Math.floor(min / 60), mm = min % 60;
      f.out.textContent = 'After ' + (hh ? hh + ' h ' : '') + mm + ' min, ' + (frac * 100).toFixed(frac < 0.1 ? 1 : 0) + '% of the fluorine-18 is left.';
      f.root.dataset.percent = Math.round(frac * 100);
    }
    slider.addEventListener('input', draw);
    f.root.querySelector('button').addEventListener('click', function () { slider.value = Math.min(600, Math.round((+slider.value + HALF) / 5) * 5); draw(); });
    draw();
  })();

  // ---- Figure 3: positron annihilation
  (function () {
    var f = fig('fig-annihilation'); if (!f) return;
    var seed = 1, path, ang, t0 = 0, now = 0;
    var CAP = ['A fluorine-18 nucleus decays and throws out a positron.', 'The positron wanders, losing speed, for less than a millimetre.', 'It meets an electron. Matter and antimatter annihilate.', 'Two photons, 511 keV each, fly apart back to back.'];
    function reset() { var r = rng(seed++), x = 150, y = 150, a = r() * 6.28, step = 26; path = [[x, y]];
      for (var i = 0; i < 9; i++) { a += (r() - 0.5) * 2.6; x += Math.cos(a) * step; y += Math.sin(a) * step * 0.8; step *= 0.86; x = Math.max(120, Math.min(400, x)); y = Math.max(50, Math.min(250, y)); path.push([x, y]); }
      ang = r() * Math.PI; t0 = now; }
    function dot(ctx, x, y, r, col, label) { ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      if (label) { ctx.fillStyle = '#05080f'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x, y + 4); ctx.textAlign = 'left'; } }
    f.root.querySelector('button').addEventListener('click', function () { reset(); if (reduced) draw(8); });
    function draw(t) {
      var ctx = f.ctx, end = path[path.length - 1], stage = t < 1.2 ? 0 : t < 4.2 ? 1 : t < 5 ? 2 : 3;
      ctx.clearRect(0, 0, 520, 300);
      for (var i = 0; i < 18; i++) dot(ctx, 150 + Math.cos(i * 2.4) * (4 + i % 5 * 4), 150 + Math.sin(i * 2.4) * (4 + i % 5 * 4), 6, i % 2 ? '#c2504a' : '#6b7896');
      ctx.fillStyle = INK; ctx.font = '13px Segoe UI, sans-serif'; ctx.fillText('fluorine-18', 114, 200);
      if (stage < 3) dot(ctx, end[0] + 14, end[1] + 6, 7, COOL, '−');
      if (stage >= 1) { var k = Math.min(1, (t - 1.2) / 3) * (path.length - 1), n = Math.floor(k);
        ctx.strokeStyle = 'rgba(255,90,40,.5)'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(path[0][0], path[0][1]);
        for (var j = 1; j <= n; j++) ctx.lineTo(path[j][0], path[j][1]);
        var px = end[0], py = end[1];
        if (n < path.length - 1) { px = path[n][0] + (path[n + 1][0] - path[n][0]) * (k - n); py = path[n][1] + (path[n + 1][1] - path[n][1]) * (k - n); ctx.lineTo(px, py); }
        ctx.stroke(); ctx.setLineDash([]);
        if (stage < 2) dot(ctx, px, py, 7, HOT[1], '+');
      }
      if (stage === 2) { var g = (t - 4.2) / 0.8; ctx.fillStyle = 'rgba(255,243,196,' + (1 - g) + ')'; ctx.beginPath(); ctx.arc(end[0] + 7, end[1] + 3, 10 + g * 50, 0, 7); ctx.fill(); }
      if (stage === 3) { var d = Math.min(1, (t - 5) / 1.6) * 330; [0, Math.PI].forEach(function (o) {
        var a = ang + o; ctx.strokeStyle = HOT[3]; ctx.lineWidth = 2; ctx.beginPath();
        for (var s = 0; s < d; s += 3) { var wv = Math.sin(s / 6) * 5; ctx.lineTo(end[0] + Math.cos(a) * s - Math.sin(a) * wv, end[1] + Math.sin(a) * s + Math.cos(a) * wv); }
        ctx.stroke(); dot(ctx, end[0] + Math.cos(a) * d, end[1] + Math.sin(a) * d, 5, HOT[4]); });
        ctx.fillStyle = HOT[4]; ctx.fillText('511 keV', end[0] + Math.cos(ang) * 60 + 8, end[1] + Math.sin(ang) * 60 - 8); }
      f.out.textContent = (stage + 1) + ' of 4: ' + CAP[stage]; f.root.dataset.stage = stage + 1;
    }
    reset();
    animate(f.canvas, function (dt, t) { now = t; if (reduced) return draw(8); if (t - t0 > 9) reset(); draw(t - t0); });
  })();

  // ---- Figure 4: coincidence detection
  (function () {
    var f = fig('fig-ring'); if (!f) return;
    var W = 520, H = 420, cx = 260, cy = 210, R = 180, lines = document.createElement('canvas'), lc = lines.getContext('2d');
    lines.width = W; lines.height = H;
    var seed = 5, r, hot, count, auto = false, reveal = false, flash = [], single = null;
    function fresh() { r = rng(seed++); var a = r() * 6.28, d = 30 + r() * 70; hot = [cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7]; count = 0; lc.clearRect(0, 0, W, H); single = null; }
    function decay() { var x, y;
      if (r() < 0.7) { var a = r() * 6.28, d = Math.sqrt(-2 * Math.log(1 - r())) * 9; x = hot[0] + Math.cos(a) * d; y = hot[1] + Math.sin(a) * d; }
      else { var b = r() * 6.28, q = Math.sqrt(r()); x = cx + Math.cos(b) * q * 130; y = cy + Math.sin(b) * q * 95; }
      var ang = r() * Math.PI; return { x: x, y: y, e1: ringPoint(cx, cy, R, x, y, ang), e2: ringPoint(cx, cy, R, x, y, ang + Math.PI) }; }
    function record(d) { lc.strokeStyle = 'rgba(255,140,50,.07)'; lc.lineWidth = 2; lc.beginPath(); lc.moveTo(d.e1[0], d.e1[1]); lc.lineTo(d.e2[0], d.e2[1]); lc.stroke(); count++; flash.push([d.e1, 0.3], [d.e2, 0.3]); }
    function draw(dt) {
      var ctx = f.ctx; ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0d1424'; ctx.beginPath(); ctx.ellipse(cx, cy, 135, 100, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#25314d'; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(lines, 0, 0); ctx.globalCompositeOperation = 'source-over';
      for (var i = 0; i < 48; i++) { var a = (i + 0.5) / 48 * 6.283; ctx.save(); ctx.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.rotate(a); ctx.fillStyle = '#2a3a5c'; ctx.fillRect(0, -10, 16, 20); ctx.restore(); }
      flash = flash.filter(function (fl) { fl[1] -= dt; return fl[1] > 0; });
      flash.slice(-40).forEach(function (fl) { ctx.fillStyle = 'rgba(255,243,196,' + fl[1] * 3 + ')'; ctx.beginPath(); ctx.arc(fl[0][0], fl[0][1], 9, 0, 7); ctx.fill(); });
      if (single) { single.p += dt * 1.6; var k = Math.min(1, single.p), d = single.d;
        [d.e1, d.e2].forEach(function (e) { ctx.fillStyle = HOT[4]; ctx.beginPath(); ctx.arc(d.x + (e[0] - d.x) * k, d.y + (e[1] - d.y) * k, 5, 0, 7); ctx.fill(); });
        if (single.p >= 1) { record(d); single = null; } }
      if (reveal) { ctx.strokeStyle = COOL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hot[0], hot[1], 22, 0, 7); ctx.stroke(); }
      if (auto) for (var n = 0; n < 2; n++) record(decay());
      f.out.textContent = 'Pairs detected: ' + count + (count > 400 ? '. The hot spot is showing.' : count ? '. Keep going.' : '. Fire some decays.');
      f.root.dataset.count = count;
    }
    f.root.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () {
      var a = b.dataset.a;
      if (a === 'one') single = { d: decay(), p: reduced ? 1 : 0 };
      if (a === 'hundred') for (var i = 0; i < 100; i++) record(decay());
      if (a === 'auto') { auto = !auto; b.setAttribute('aria-pressed', String(auto)); }
      if (a === 'reveal') { reveal = !reveal; b.setAttribute('aria-pressed', String(reveal)); }
      if (a === 'new') fresh();
      if (reduced) draw(1);
    }); });
    fresh(); animate(f.canvas, draw);
  })();

  // ---- Figure 5: attenuation
  (function () {
    var f = fig('fig-atten'); if (!f) return;
    var MATS = [['Air', 0.0002, '#0f1830'], ['Lung', 0.05, '#27445c'], ['Fat', 0.18, '#7d6a3e'], ['Water', 0.19, '#2f5f8a'], ['Muscle', 0.2, '#8a3f4a'], ['Bone', 0.5, '#d9d2bf']];
    var mat = 3, slider = f.root.querySelector('input'), seg = f.root.querySelector('.seg'), photons = [], through = 0, seed = 20;
    MATS.forEach(function (m, i) { var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn--small'; b.textContent = m[0]; b.dataset.mat = m[0];
      b.addEventListener('click', function () { mat = i; fire(); }); seg.append(b); });
    function fire() { var r = rng(seed++), cm = +slider.value, mu = MATS[mat][1], wpx = cm * 8; through = 0; photons = [];
      for (var i = 0; i < 200; i++) { var depth = -Math.log(1 - r()) / mu, ok = depth >= cm; if (ok) through++;
        photons.push({ y: 30 + r() * 240, stop: ok ? 9999 : 140 + depth * 8, x: reduced ? 9999 : -r() * 160, face: i === 7 }); }
      seg.querySelectorAll('button').forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === mat)); });
      f.out.textContent = through + ' of 200 photons got through ' + cm + ' cm of ' + MATS[mat][0].toLowerCase() + ' (' + Math.round(through / 2) + '%). Theory: ' + (Math.exp(-mu * cm) * 100).toFixed(1) + '%.';
      f.root.dataset.through = through; f.root.dataset.w = wpx; if (reduced) draw(0); }
    function draw(dt) { var ctx = f.ctx, wpx = +slider.value * 8; ctx.clearRect(0, 0, 520, 300);
      ctx.fillStyle = MATS[mat][2]; ctx.fillRect(140, 20, wpx, 260); ctx.fillStyle = '#2a3a5c'; ctx.fillRect(492, 20, 12, 260);
      ctx.fillStyle = INK; ctx.font = '13px Segoe UI, sans-serif'; ctx.fillText('X-rays in', 12, 16); ctx.fillText('detector', 452, 16);
      photons.forEach(function (p) { p.x = Math.min(p.x + dt * 420, Math.min(p.stop, 488)); if (p.x < 0) return;
        var dead = p.x >= p.stop; ctx.fillStyle = dead ? 'rgba(240,90,40,.45)' : COOL; ctx.beginPath(); ctx.arc(p.x, p.y, p.face ? 7 : 3, 0, 7); ctx.fill();
        if (p.face) { ctx.fillStyle = '#05080f'; ctx.fillRect(p.x - 3, p.y - 2, 2, 2); ctx.fillRect(p.x + 1, p.y - 2, 2, 2); } }); }
    slider.addEventListener('input', fire); fire(); animate(f.canvas, draw);
  })();

  // ---- Figure 6: PET/CT fusion (a drawn slice)
  (function () {
    var f = fig('fig-fusion'); if (!f) return;
    var slider = f.root.querySelector('input'), ctx = f.ctx;
    function ell(x, y, rx, ry, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); }
    function glow(x, y, r, strength) { var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,243,196,' + strength + ')'); g.addColorStop(0.35, 'rgba(255,159,67,' + strength * 0.8 + ')'); g.addColorStop(0.7, 'rgba(179,32,42,' + strength * 0.5 + ')'); g.addColorStop(1, 'rgba(179,32,42,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    function draw() { var b = slider.value / 100, ct = Math.min(1, (1 - b) * 2), pet = Math.min(1, b * 2);
      ctx.clearRect(0, 0, 520, 360); ctx.globalAlpha = ct;
      ell(260, 185, 215, 150, '#8f8f8f'); ell(260, 185, 200, 136, '#6c6c6c');
      ell(165, 170, 78, 100, '#161616'); ell(360, 170, 74, 100, '#161616'); ell(285, 165, 62, 56, '#7d7d7d');
      ell(260, 280, 30, 26, '#f2f2f2'); ell(260, 306, 10, 8, '#555'); ell(260, 52, 26, 9, '#eee');
      for (var i = 0; i < 8; i++) { var a = 0.5 + i * 0.75 + (i > 3 ? 0.35 : 0); ell(260 + Math.cos(a) * 205, 185 + Math.sin(a) * 141, 13, 7, '#eee'); }
      ctx.fillStyle = '#ddd'; ctx.font = '13px Segoe UI, sans-serif'; ctx.fillText('lung', 150, 250); ctx.fillText('heart', 268, 168); ctx.fillText('spine', 300, 300);
      ctx.globalAlpha = pet; ctx.globalCompositeOperation = 'lighter';
      glow(260, 185, 230, 0.16); glow(285, 165, 70, 0.75); glow(140, 130, 34, 1); glow(260, 250, 40, 0.25);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      if (pet > 0.3) { ctx.strokeStyle = COOL; ctx.fillStyle = COOL; ctx.beginPath(); ctx.moveTo(96, 86); ctx.lineTo(122, 112); ctx.stroke(); ctx.fillText('tumour', 60, 80); }
      f.out.textContent = b < 0.15 ? 'CT only: sharp anatomy, but the tumour in the lung is easy to miss.' : b > 0.85 ? 'PET only: two bright spots, but where exactly are they?' : 'Fused: the bright spot sits in the upper part of one lung. The other is the heart, which always burns sugar.';
      f.root.dataset.blend = slider.value; }
    slider.addEventListener('input', draw); draw();
  })();
})();
