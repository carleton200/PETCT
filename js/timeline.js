// History timeline: data, filter chips, a scrollable strip of dots, and a detail card.
(function () {
  'use strict';
  var CATS = { xray: ['X-ray & CT', '#5fd4e6'], pet: ['PET & nuclear', '#ff9f43'], mri: ['MRI', '#b79cff'], physics: ['Physics', '#7ee0a1'] };
  var EVENTS = [
    { y: '1895', c: 'xray', t: 'X-rays discovered', who: 'Wilhelm Röntgen · Würzburg, Germany',
      s: 'Working with a glass vacuum tube in a darkened lab, Röntgen notices a coated screen across the room glowing. Some unknown ray is passing through the tube\'s black cardboard cover. Weeks later he photographs the bones of his wife\'s hand, ring and all. He wins the first Nobel Prize in Physics in 1901.',
      w: 'Every CT scan is still made with Röntgen\'s rays.' },
    { y: '1896', c: 'physics', t: 'Radioactivity discovered', who: 'Henri Becquerel · Paris',
      s: 'Becquerel leaves uranium salts on a wrapped photographic plate in a drawer. With no sunlight at all, the plate fogs. The uranium is giving off radiation by itself.',
      w: 'PET depends on atoms that emit radiation from inside the body.' },
    { y: '1913', c: 'xray', t: 'The modern X-ray tube', who: 'William Coolidge · General Electric',
      s: 'Coolidge builds a high-vacuum tube with a heated tungsten filament. For the first time the strength and energy of the X-ray beam can be set precisely and held steady.',
      w: 'The tube spinning inside a CT scanner is a direct descendant.' },
    { y: '1917', c: 'physics', t: 'The mathematics arrives early', who: 'Johann Radon · Vienna',
      s: 'Radon proves that a shape can be rebuilt exactly from the complete set of its shadows taken along straight lines. Nobody connects it to medicine for about fifty years.',
      w: 'This is the mathematics inside every CT and PET image.' },
    { y: '1931', c: 'pet', t: 'The cyclotron', who: 'Ernest Lawrence · Berkeley',
      s: 'Lawrence and his student Stanley Livingston get a palm-sized machine to whirl charged particles in a spiral, gaining speed on every turn. Bigger versions soon make new radioactive atoms to order.',
      w: 'Hospital cyclotrons make the short-lived tracers PET needs.' },
    { y: '1932', c: 'physics', t: 'The positron is found', who: 'Carl Anderson · Caltech',
      s: 'In a photograph of cosmic-ray tracks, Anderson sees a particle that curves like an electron but the wrong way: an electron with positive charge. Paul Dirac\'s equations had hinted at it a few years earlier.',
      w: 'It is the P in PET.' },
    { y: '1958', c: 'pet', t: 'The gamma camera', who: 'Hal Anger · Berkeley',
      s: 'Anger shows a camera that pictures a whole organ at once from the gamma rays leaving it, instead of scanning point by point. It becomes the workhorse of nuclear medicine.',
      w: 'It proved that tracers inside the body could be turned into pictures.' },
    { y: '1971', c: 'xray', t: 'First CT scan of a patient', who: 'Godfrey Hounsfield, James Ambrose · London',
      s: 'On 1 October, at Atkinson Morley\'s Hospital, a scanner built by EMI engineer Godfrey Hounsfield images the brain of a woman with a suspected tumour. The picture is coarse, but the tumour is plainly there.',
      w: 'For the first time doctors see a slice of a living body.' },
    { y: '1973', c: 'mri', t: 'First MRI image', who: 'Paul Lauterbur · Stony Brook, New York',
      s: 'Lauterbur publishes a picture of two thin tubes of water made with magnets and radio waves, with no X-rays at all. Whole-body scanners follow within the decade.',
      w: 'MRI becomes CT\'s great rival and, later, a partner for PET.' },
    { y: '1975', c: 'pet', t: 'PET scanners for people', who: 'Michel Ter-Pogossian, Michael Phelps, Edward Hoffman · St. Louis',
      s: 'At Washington University, a team builds ring-shaped scanners that catch pairs of photons and reconstruct slices from them. Their mid-1970s machine, PETT III, is built to scan humans.',
      w: 'This is the design every PET scanner since has followed.' },
    { y: '1976', c: 'pet', t: 'FDG, the tracer that stuck', who: 'Brookhaven National Laboratory and the University of Pennsylvania',
      s: 'Chemists at Brookhaven make a glucose look-alike tagged with fluorine-18. In August it is flown to Philadelphia, where the first volunteers are injected and their brains\' sugar use is imaged.',
      w: 'FDG is still used in the great majority of PET scans.' },
    { y: '1979', c: 'xray', t: 'A Nobel Prize for CT', who: 'Godfrey Hounsfield and Allan Cormack',
      s: 'The Nobel Prize in Physiology or Medicine goes to the engineer who built the first scanner and to the physicist who had worked out the reconstruction mathematics a decade before him.',
      w: 'CT units of density are still called Hounsfield units.' },
    { y: '1998', c: 'pet', t: 'The first PET/CT', who: 'David Townsend, Ronald Nutt · Pittsburgh',
      s: 'A prototype that bolts a PET scanner and a CT scanner onto one bed starts scanning cancer patients at the University of Pittsburgh. For the first time the two pictures line up without guesswork.',
      w: 'The machine this page is about.' },
    { y: '2000', c: 'pet', t: 'PET/CT goes on sale', who: 'TIME magazine; scanner makers',
      s: 'TIME names the PET/CT scanner its medical invention of the year. Commercial machines reach hospitals in 2001, and within a few years almost nobody buys a PET scanner without a CT attached.',
      w: 'The combined scanner becomes the standard.' },
    { y: '2018', c: 'pet', t: 'Total-body PET', who: 'Simon Cherry, Ramsey Badawi · UC Davis',
      s: 'The EXPLORER scanner, about two metres long, images the whole body at once instead of a section at a time. It catches far more of the photon pairs, so scans can be much faster or use much less tracer.',
      w: 'It shows where PET is heading: more signal, less dose.' }
  ];

  var root = document.getElementById('timeline');
  if (!root) return;
  var sel = 0, cat = 'all';
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  root.textContent = '';
  var filters = h('div', 'tl__filters'), track = h('div', 'tl__track'), card = h('article', 'tl__card');
  filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', 'Filter events');
  card.setAttribute('aria-live', 'polite');
  root.append(filters, track, card);

  [['all', 'All']].concat(Object.keys(CATS).map(function (k) { return [k, CATS[k][0]]; })).forEach(function (f) {
    var b = h('button', 'btn btn--small', f[1]); b.type = 'button'; b.dataset.cat = f[0];
    b.addEventListener('click', function () { cat = f[0]; if (!shown(sel)) sel = EVENTS.findIndex(function (e, i) { return shown(i); }); render(); });
    filters.append(b);
  });
  var dots = EVENTS.map(function (e, i) {
    var b = h('button', 'tl__dot'); b.type = 'button'; b.style.setProperty('--c', CATS[e.c][1]);
    b.append(h('b', '', e.y), h('i'), h('span', '', e.t));
    b.addEventListener('click', function () { sel = i; render(true); });
    track.append(b); return b;
  });
  function shown(i) { return cat === 'all' || EVENTS[i].c === cat; }
  function move(d) { for (var i = sel + d; i >= 0 && i < EVENTS.length; i += d) if (shown(i)) { sel = i; render(true); dots[i].focus(); return; } }
  track.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowRight') { move(1); ev.preventDefault(); }
    if (ev.key === 'ArrowLeft') { move(-1); ev.preventDefault(); }
  });

  function render(scroll) {
    var e = EVENTS[sel];
    filters.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cat === cat)); });
    dots.forEach(function (d, i) {
      d.classList.toggle('is-dim', !shown(i)); d.tabIndex = i === sel ? 0 : -1;
      d.setAttribute('aria-current', String(i === sel));
    });
    if (scroll) track.scrollTo({ left: dots[sel].offsetLeft - track.clientWidth / 2 + 52, behavior: 'smooth' });
    card.textContent = ''; card.style.setProperty('--c', CATS[e.c][1]);
    var left = h('div'), right = h('div'), nav = h('div', 'tl__nav');
    left.append(h('div', 'tl__year', e.y), h('span', 'tl__tag', CATS[e.c][0]));
    var prev = h('button', 'btn btn--small', '← Earlier'), next = h('button', 'btn btn--small', 'Later →');
    prev.type = next.type = 'button';
    prev.addEventListener('click', function () { move(-1); }); next.addEventListener('click', function () { move(1); });
    nav.append(prev, next);
    right.append(h('h3', '', e.t), h('p', 'tl__who', e.who), h('p', '', e.s), h('p', 'tl__why', 'Why it matters for PET/CT: ' + e.w), nav);
    card.append(left, right);
    root.dataset.selected = e.y;
  }
  render();
})();
