// Ctrl Leo Del logo screen: the logo, full screen, with an occasional
// neon flicker, glitch or key press. Options come from the link, e.g.
// index.html?fx=flicker,glitch&every=20&bg=000000 (see README).
(() => {
  'use strict';

  // ---- Options -------------------------------------------------------------
  const params = new URLSearchParams(location.search);
  const number = (key, fallback, min, max) => {
    const v = parseFloat(params.get(key));
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
  };
  const ALL_EFFECTS = ['flicker', 'glitch', 'press'];
  const fxParam = (params.get('fx') || 'all').toLowerCase();
  const enabled = fxParam === 'all' ? ALL_EFFECTS
    : fxParam === 'none' ? []
    : fxParam.split(',').map(s => s.trim()).filter(f => ALL_EFFECTS.includes(f));
  const every = number('every', 12, 1, 3600); // average seconds between effects
  const size = number('size', 60, 10, 100); // % of the screen's shorter side
  const bg = params.get('bg');
  const powerOn = params.get('boot') !== '0';

  const root = document.documentElement;
  if (bg && /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(bg)) root.style.setProperty('--bg', '#' + bg.replace('#', ''));
  root.style.setProperty('--size', size + 'vmin');
  document.body.classList.toggle('drift', params.get('drift') === '1');

  // ---- Helpers -------------------------------------------------------------
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = list => list[Math.floor(Math.random() * list.length)];

  const logo = document.getElementById('logo');
  const main = logo.querySelector('svg.main');
  const letters = [...main.querySelectorAll('.letter')];
  const words = [...main.querySelectorAll('.word')];

  // Copies of the logo used by the glitch: "slice" copies show torn strips,
  // "tint" copies (letters only) give the red/cyan colour split.
  let copies = 0;
  function makeCopy(...classes) {
    const svg = main.cloneNode(true);
    svg.classList.replace('main', 'fx');
    svg.classList.add(...classes);
    svg.removeAttribute('role');
    svg.removeAttribute('aria-label');
    svg.setAttribute('aria-hidden', 'true');
    const id = `tile-gradient-${++copies}`;
    svg.querySelector('linearGradient').id = id;
    svg.querySelector('.tile').setAttribute('fill', `url(#${id})`);
    if (classes.includes('tint')) svg.querySelectorAll('.tile, .tile-edge').forEach(n => n.remove());
    logo.appendChild(svg);
    return svg;
  }
  const slices = [makeCopy('slice'), makeCopy('slice'), makeCopy('slice')];
  const [red, cyan] = [makeCopy('tint', 'red'), makeCopy('tint', 'cyan')];

  // Camera tip: every state below lasts at least ~50 ms so a 24-30 fps
  // camera always catches it instead of showing a half-frame.

  // ---- Effects -------------------------------------------------------------
  async function flicker() {
    const roll = Math.random();
    let targets;
    if (roll < 0.6) targets = Math.random() < 0.3 ? [pick(letters), pick(letters)] : [pick(letters)];
    else if (roll < 0.85) targets = [...pick(words).querySelectorAll('.letter')];
    else targets = letters;
    const set = value => targets.forEach(t => { t.style.opacity = value; });
    const blinks = Math.round(rand(2, 6));
    for (let i = 0; i < blinks; i++) {
      set(pick([0.1, 0.22, 0.4, 0.65]));
      await sleep(rand(55, 130));
      set('');
      await sleep(rand(50, 170));
    }
    if (Math.random() < 0.25) { // a tube that takes a moment to come back
      set(0.3);
      await sleep(rand(250, 600));
      set('');
    }
  }

  async function glitch() {
    const frames = Math.round(rand(3, 7));
    for (let f = 0; f < frames; f++) {
      const split = rand(0.6, 2.4) * (Math.random() < 0.5 ? -1 : 1); // % of logo width
      red.style.transform = `translate(${-split}%, ${rand(-0.4, 0.4)}%)`;
      cyan.style.transform = `translate(${split}%, ${rand(-0.4, 0.4)}%)`;
      red.style.visibility = cyan.style.visibility = 'visible';
      for (const s of slices) {
        if (Math.random() < 0.7) {
          const top = rand(0, 90);
          const height = rand(2, 14);
          s.style.clipPath = `inset(${top}% 0 ${Math.max(0, 100 - top - height)}% 0)`;
          s.style.transform = `translateX(${rand(-7, 7)}%)`;
          s.style.visibility = 'visible';
        } else {
          s.style.visibility = 'hidden';
        }
      }
      main.style.transform = Math.random() < 0.4 ? `translateX(${rand(-0.8, 0.8)}%)` : '';
      await sleep(rand(55, 110));
    }
    for (const n of [red, cyan, ...slices]) n.style.visibility = 'hidden';
    main.style.transform = '';
  }

  // The whole tile goes down and springs back up, like a key being hit.
  async function press() {
    const times = Math.random() < 0.2 ? 2 : 1;
    for (let i = 0; i < times; i++) {
      await logo.animate([
        { transform: 'none', filter: 'none' },
        { transform: 'translateY(0.7%) scale(0.965)', filter: 'brightness(0.82)', offset: 0.3 },
        { transform: 'translateY(-0.15%) scale(1.006)', filter: 'none', offset: 0.72 },
        { transform: 'none', filter: 'none' },
      ], { duration: 340, easing: 'ease-out' }).finished;
      if (i < times - 1) await sleep(rand(90, 160));
    }
  }

  // Letters strike on one by one when the page opens, like neon tubes.
  async function bootUp() {
    letters.forEach(l => { l.style.opacity = 0; });
    await logo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' }).finished;
    await Promise.all(letters.map(async l => {
      await sleep(rand(0, 1100));
      for (let i = Math.round(rand(1, 3)); i > 0; i--) {
        l.style.opacity = pick([0.3, 0.6]);
        await sleep(rand(55, 110));
        l.style.opacity = 0;
        await sleep(rand(60, 160));
      }
      l.style.opacity = '';
    }));
  }

  // ---- Scheduling ----------------------------------------------------------
  const EFFECTS = { flicker, glitch, press };
  const WEIGHTS = { flicker: 5, glitch: 3, press: 2 };
  let busy = false;

  function chooseEffect() {
    const total = enabled.reduce((sum, name) => sum + WEIGHTS[name], 0);
    let roll = Math.random() * total;
    for (const name of enabled) if ((roll -= WEIGHTS[name]) < 0) return name;
    return enabled[0];
  }

  async function run(name) {
    if (busy || !name) return;
    busy = true;
    try {
      await EFFECTS[name]();
      // Now and then a second effect follows straight after.
      if (enabled.length > 1 && name !== 'press' && Math.random() < 0.2) {
        await sleep(rand(120, 400));
        await EFFECTS[chooseEffect()]();
      }
    } finally {
      busy = false;
    }
  }

  async function loop() {
    if (powerOn) {
      busy = true;
      await bootUp();
      busy = false;
    }
    if (!enabled.length) return;
    for (;;) {
      await sleep(every * 1000 * rand(0.5, 1.5));
      if (!document.hidden) await run(chooseEffect());
    }
  }

  // ---- Fullscreen, keys, cursor, screen wake ------------------------------
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else root.requestFullscreen?.().catch(() => {});
  }

  document.addEventListener('click', toggleFullscreen);
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 'f') toggleFullscreen();
    else if (key === 'g') run('glitch');
    else if (key === 'l') run('flicker');
    else if (key === 'p') run('press');
    else if (key === ' ') { e.preventDefault(); run(enabled.length ? chooseEffect() : pick(ALL_EFFECTS)); }
  });

  // Hide the cursor and help text after a moment without mouse movement.
  // Key presses don't bring them back, so effects can be cued while filming.
  let idleTimer;
  function active() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add('idle'), 2500);
  }
  for (const ev of ['mousemove', 'pointerdown', 'touchstart']) {
    document.addEventListener(ev, active, { passive: true });
  }
  active();

  // Keep the screen from going to sleep. Browsers only allow this on a real
  // website (https or localhost), not when index.html is opened as a file.
  let wakeLock = null;
  async function keepAwake() {
    if (wakeLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch {
      // Not allowed here; the screen's own sleep settings apply.
    }
  }
  document.addEventListener('visibilitychange', keepAwake);
  document.addEventListener('click', keepAwake);
  keepAwake();

  loop();
})();
