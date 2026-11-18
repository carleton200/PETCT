// Photon Run: drawing, input, screens and sound. The rules live in game-core.js.
(function () {
  'use strict';
  var core = window.PETCT.core, C = core.C, level = core.level;
  var canvas = document.getElementById('game-canvas'), panel = document.getElementById('game-panel');
  var muteBtn = document.getElementById('game-mute'), status = document.getElementById('game-status');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var screen = 'title', state = core.createState(level), keys = {}, targetY = null, trail = [], bits = [], shake = 0, clock = 0, last = 0, toast = null, lastRegion = '';

  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem('petct.' + k)); localStorage.setItem('petct.' + k, JSON.stringify(v)); } catch (e) { return null; } }
  var muted = !!store('muted'), best = store('best');

  // ---- sound: tiny synthesised blips, silent if audio is unavailable
  var ac = null;
  function beep(freq, dur, type, vol, slide) {
    if (muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur);
    } catch (e) { /* no sound, no problem */ }
  }
  function setMute(m) { muted = m; store('muted', m); muteBtn.textContent = m ? 'Sound off' : 'Sound on'; muteBtn.setAttribute('aria-pressed', String(m)); }
  muteBtn.addEventListener('click', function () { setMute(!muted); });
  setMute(muted);

  // ---- screens
  var STUCK = ['Absorbed. You are now a tiny bit of warmth.', 'Bonk. That bone is very slightly warmer, thanks to you.', 'Stuck. On the image, this spot will look white.', 'The bone wins this one. It usually does.'];
  var stuckN = 0;
  function show(html, btn) {
    panel.hidden = false; panel.innerHTML = '<div>' + html + '<br><button class="btn btn--primary" type="button">' + btn + '</button></div>';
    panel.querySelector('button').addEventListener('click', go);
  }
  function title() { screen = 'title'; show('<h3>Photon Run</h3><p>Slip between the bones and reach the detector.</p><p>Organs are squishy: they only slow you down.</p>' + (best ? '<p>Best: ' + stars(best.stars) + ' in ' + best.time + ' s</p>' : ''), 'Launch'); }
  function stars(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
  function go() {
    if (screen === 'paused') { screen = 'playing'; panel.hidden = true; canvas.focus(); return; }
    state = core.createState(level); trail = []; bits = []; targetY = null; lastRegion = ''; toast = null;
    screen = 'playing'; panel.hidden = true; canvas.focus({ preventScroll: true }); beep(180, 0.35, 'sawtooth', 0.06, 900);
  }
  function pause() { if (screen !== 'playing') return; screen = 'paused'; show('<h3>Paused</h3>', 'Resume'); }
  function finish() {
    var s = core.summary(state, level);
    if (s.won) {
      if (!best || s.stars > best.stars || (s.stars === best.stars && s.timeSec < best.time)) { best = { stars: s.stars, time: s.timeSec }; store('best', best); }
      screen = 'won';
      show('<h3>Detected!</h3><p class="stars">' + stars(s.stars) + '</p><p>' + s.timeSec + ' seconds · ' + s.sparkles + ' of ' + s.total + ' sparkles</p><p>You are one bright pixel in the image.</p>', 'Play again');
      status.textContent = 'You reached the detector in ' + s.timeSec + ' seconds with ' + s.stars + ' stars.';
      [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { beep(f, 0.25, 'triangle', 0.08); }, i * 110); });
    } else {
      screen = 'stuck';
      var where = core.regionAt(level, state.x).label.toLowerCase();
      show('<h3>Stuck!</h3><p>' + STUCK[stuckN++ % STUCK.length] + '</p><p>You made it ' + Math.round(s.progress * 100) + '% of the way, as far as the ' + where + '.</p>', 'Try again');
      status.textContent = 'Stuck on bone at ' + Math.round(s.progress * 100) + ' percent.';
      beep(140, 0.3, 'square', 0.09, 50); shake = reduced ? 0 : 0.35;
    }
  }

  // ---- input
  var STEER = { ArrowUp: -1, KeyW: -1, ArrowDown: 1, KeyS: 1 };
  addEventListener('keydown', function (e) {
    var inGame = document.activeElement === canvas || panel.contains(document.activeElement);
    if (screen === 'playing') {
      if (e.code in STEER) { keys[e.code] = true; e.preventDefault(); }
      else if (e.code === 'Space') e.preventDefault();
      else if (e.code === 'KeyP' || e.code === 'Escape') pause();
    } else if ((e.code === 'Space' || e.code === 'Enter') && inGame && e.target.tagName !== 'BUTTON') { e.preventDefault(); go(); }
    else if (e.code === 'KeyP' && screen === 'paused') go();
  });
  addEventListener('keyup', function (e) { delete keys[e.code]; });
  function pointerY(e) { var r = canvas.getBoundingClientRect(); return (e.clientY - r.top) / r.height * C.H; }
  canvas.addEventListener('pointerdown', function (e) { if (screen === 'playing') { targetY = pointerY(e); canvas.setPointerCapture(e.pointerId); } });
  canvas.addEventListener('pointermove', function (e) { if (targetY !== null) targetY = pointerY(e); });
  ['pointerup', 'pointercancel'].forEach(function (n) { canvas.addEventListener(n, function () { targetY = null; }); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  addEventListener('blur', function () { keys = {}; pause(); });

  // ---- drawing
  function face(x, y, r, mood, look) {
    ctx.fillStyle = '#20140a';
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.1 + look, r * 0.14, 0, 7); ctx.arc(x + r * 0.35, y - r * 0.1 + look, r * 0.14, 0, 7); ctx.fill();
    ctx.strokeStyle = '#20140a'; ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.beginPath();
    if (mood === 'happy') ctx.arc(x, y + r * 0.15, r * 0.35, 0.2, Math.PI - 0.2);
    else if (mood === 'grump') { ctx.arc(x, y + r * 0.6, r * 0.3, Math.PI + 0.4, -0.4); ctx.moveTo(x - r * 0.6, y - r * 0.5); ctx.lineTo(x - r * 0.15, y - r * 0.3); ctx.moveTo(x + r * 0.6, y - r * 0.5); ctx.lineTo(x + r * 0.15, y - r * 0.3); }
    else ctx.arc(x, y + r * 0.35, r * 0.16, 0, 7);
    ctx.stroke();
  }
  function draw() {
    var cam = Math.max(0, Math.min(level.length - C.W, state.x - 270)), t = clock, i;
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 30, (Math.random() - 0.5) * shake * 30);
    var bg = ctx.createLinearGradient(0, 0, 0, C.H); bg.addColorStop(0, '#1a0b14'); bg.addColorStop(0.5, '#2a1220'); bg.addColorStop(1, '#1a0b14');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, C.W, C.H);
    ctx.translate(-cam, 0);
    // air on both sides, skin bands, drifting specks
    ctx.fillStyle = '#070b16'; ctx.fillRect(-100, 0, 620, C.H); ctx.fillRect(6850, 0, 600, C.H);
    ctx.fillStyle = '#c98d74'; ctx.fillRect(520, 0, 50, C.H); ctx.fillRect(6800, 0, 50, C.H);
    ctx.fillStyle = '#e3c48a'; ctx.fillRect(570, 0, 110, C.H); ctx.fillRect(6690, 0, 110, C.H);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (i = Math.floor(cam / 90); i < (cam + C.W) / 90 + 1; i++) { ctx.beginPath(); ctx.arc(i * 90 + (i * 37 % 50), (i * 173 % 500) + 20 + Math.sin(t + i) * 8, 3 + i % 4, 0, 7); ctx.fill(); }
    // X-ray tube and detector
    ctx.fillStyle = '#2a3a5c'; ctx.fillRect(-20, 210, 90, 120); ctx.fillStyle = '#5fd4e6'; ctx.fillRect(70, 255, 14, 30);
    for (i = 0; i < 18; i++) { ctx.fillStyle = (screen === 'won' && Math.abs(i * 30 + 15 - state.y) < 15) ? '#fff3c4' : (i % 2 ? '#22304f' : '#2a3a5c'); ctx.fillRect(level.detectorX + 12, i * 30, 60, 29); }
    // organs
    level.organs.forEach(function (o, n) {
      if (o.cx + o.rx < cam || o.cx - o.rx > cam + C.W) return;
      var inside = state.organ === o.name && core.organAt(level, state.x, state.y) === o, wob = inside && !reduced ? Math.sin(t * 14) * 5 : Math.sin(t * 1.5 + n) * 2;
      ctx.globalAlpha = inside ? 0.6 : 0.42; ctx.fillStyle = o.color; ctx.beginPath(); ctx.ellipse(o.cx, o.cy, o.rx + wob, o.ry - wob, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      face(o.cx, o.cy, Math.min(34, o.ry * 0.4), 'happy', 0);
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '600 15px Segoe UI, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(o.name, o.cx, o.cy + Math.min(60, o.ry * 0.75)); ctx.textAlign = 'left';
    });
    // bones
    level.bones.forEach(function (b) {
      if (Math.abs(b.x - cam - C.W / 2) > C.W / 2 + 80) return;
      core.boneShapes(b, state.t).forEach(function (s, k) {
        ctx.fillStyle = state.bone === b.id ? '#ffb199' : '#efe9d6'; ctx.strokeStyle = '#a79f86'; ctx.lineWidth = 2; ctx.beginPath();
        if (s.circle) { ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); ctx.stroke(); face(s.x, s.y, s.r, 'grump', 0); }
        else { ctx.roundRect(s.x, s.y, s.w, s.h, 14); ctx.fill(); ctx.stroke(); face(s.x + s.w / 2, k ? s.y + 26 : s.y + s.h - 26, Math.min(16, s.w * 0.45), 'grump', 0); }
      });
    });
    // sparkles
    level.sparkles.forEach(function (sp, n) {
      if (state.taken[n] || sp.x < cam - 20 || sp.x > cam + C.W + 20) return;
      var r = 7 + Math.sin(t * 5 + n) * 2; ctx.fillStyle = '#ffd166'; ctx.beginPath();
      for (var a = 0; a < 8; a++) { var rr = a % 2 ? r * 0.4 : r, ang = a * Math.PI / 4 + t; ctx.lineTo(sp.x + Math.cos(ang) * rr, sp.y + Math.sin(ang) * rr); }
      ctx.fill();
    });
    // photon
    trail.forEach(function (p, n) { ctx.fillStyle = 'rgba(255,209,102,' + (n / trail.length) * 0.35 + ')'; ctx.beginPath(); ctx.arc(p[0], p[1], 4 + n / trail.length * 9, 0, 7); ctx.fill(); });
    bits = bits.filter(function (p) { p[4] -= 0.02; p[0] += p[2]; p[1] += p[3]; return p[4] > 0; });
    bits.forEach(function (p) { ctx.fillStyle = 'rgba(255,243,196,' + p[4] + ')'; ctx.fillRect(p[0], p[1], 4, 4); });
    var squish = state.organ ? 0.85 : 1, px = state.x, py = state.y;
    ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 24; ctx.fillStyle = state.phase === 'stuck' ? '#ff9f43' : '#fff3c4';
    ctx.beginPath(); ctx.ellipse(px, py, 17 / squish, 17 * squish, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    face(px, py, 17, state.phase === 'stuck' ? 'oh' : 'happy', Math.max(-3, Math.min(3, state.vy / 90)));
    ctx.restore();
    // HUD
    var s = core.summary(state, level);
    ctx.fillStyle = 'rgba(5,8,15,.6)'; ctx.fillRect(0, 0, C.W, 40);
    ctx.fillStyle = '#25314d'; ctx.fillRect(150, 17, 520, 6); ctx.fillStyle = '#ff9f43'; ctx.fillRect(150, 17, 520 * s.progress, 6);
    ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(150 + 520 * s.progress, 20, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#eef2f8'; ctx.font = '600 16px Segoe UI, sans-serif';
    ctx.fillText(core.regionAt(level, state.x).label, 14, 26); ctx.fillText(state.t.toFixed(1) + ' s', 694, 26); ctx.fillText('✦ ' + s.sparkles + '/' + s.total, 780, 26);
    if (state.organ && screen === 'playing') { ctx.fillStyle = '#ffd166'; ctx.fillText('squish…', 870, 26); }
    if (toast && toast[1] > 0) { ctx.globalAlpha = Math.min(1, toast[1]); ctx.font = '600 24px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff3c4'; ctx.fillText(toast[0], C.W / 2, 80); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
  }

  var TIPS = { 'Rib cage': 'Rib cage: thread the gaps', 'Lungs & heart': 'Lungs are airy. The heart is not.', 'Belly': 'Belly: squishy organs slow you down', 'Spine': 'The spine. Time it!', 'Back': 'Nearly through' };
  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000 || 0); last = now; clock += dt; shake = Math.max(0, shake - dt);
    if (screen === 'playing') {
      var dir = (keys.ArrowUp || keys.KeyW ? -1 : 0) + (keys.ArrowDown || keys.KeyS ? 1 : 0);
      core.advance(state, level, { dir: dir, targetY: targetY }, dt).forEach(function (e) {
        if (e.type === 'sparkle') { beep(700 + state.sparkles * 35, 0.12, 'triangle', 0.07); for (var i = 0; i < 6; i++) bits.push([state.x, state.y, Math.random() * 4 - 1, Math.random() * 4 - 2, 1]); }
        if (e.type === 'enterOrgan') beep(220, 0.18, 'sine', 0.06, 140);
      });
      trail.push([state.x, state.y]); if (trail.length > 16) trail.shift();
      var reg = core.regionAt(level, state.x).label;
      if (reg !== lastRegion) { lastRegion = reg; if (TIPS[reg]) toast = [TIPS[reg], 2.2]; }
      if (toast) toast[1] -= dt;
      if (state.phase !== 'running') finish();
    }
    draw();
    requestAnimationFrame(frame);
  }

  window.PETCT.game = { get state() { return Object.assign({ screen: screen }, core.clone(state), core.summary(state, level)); }, start: go, pause: pause };
  title();
  requestAnimationFrame(frame);
})();
