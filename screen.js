// Ctrl Leo Del logo screen: the logo, full screen, with an occasional
// neon flicker, glitch or key press. Settings come from the link, e.g.
// index.html?fx=flicker,glitch&every=20&bg=000000 (see README), and can be
// changed live from the menu (M), which keeps the link up to date.
(() => {
  'use strict';

  // ---- Settings ------------------------------------------------------------
  const ALL_EFFECTS = ['flicker', 'glitch', 'press'];
  const DEFAULTS = { fx: ALL_EFFECTS, every: 12, size: 60, bg: '0c0f10', drift: false, boot: true };

  // Presets set what the logo does and its background. Size and the intro
  // are about the screen it's on, so presets leave those alone.
  const PRESET_KEYS = ['fx', 'every', 'bg', 'drift'];
  const PRESETS = [
    { name: 'Default', note: 'All effects, every ~12 s', set: {} },
    { name: 'Calm', note: 'All effects, every ~25 s', set: { every: 25 } },
    { name: 'Busy', note: 'All effects, every ~5 s', set: { every: 5 } },
    { name: 'Flicker only', note: 'Just the neon flicker', set: { fx: ['flicker'] } },
    { name: 'Glitch only', note: 'Just the glitch', set: { fx: ['glitch'] } },
    { name: 'Key press only', note: 'Just the key press', set: { fx: ['press'] } },
    { name: 'Still', note: 'No effects on their own; cue them with keys', set: { fx: [] } },
    { name: 'Black background', note: 'All effects, on pure black', set: { bg: '000000' } },
    { name: 'Long display', note: 'Calm, with slow drift for OLED TVs', set: { every: 20, drift: true } },
  ];

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const hex = value => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value || '');
    if (!m) return null;
    const h = m[1].toLowerCase();
    return h.length === 3 ? [...h].map(c => c + c).join('') : h;
  };

  function readLink() {
    const p = new URLSearchParams(location.search);
    const num = (key, fallback, min, max) => {
      const v = parseFloat(p.get(key));
      return Number.isFinite(v) ? clamp(v, min, max) : fallback;
    };
    const fx = (p.get('fx') || 'all').toLowerCase();
    return {
      fx: fx === 'all' ? DEFAULTS.fx
        : fx === 'none' ? []
        : ALL_EFFECTS.filter(name => fx.split(',').map(s => s.trim()).includes(name)),
      every: num('every', DEFAULTS.every, 1, 3600), // average seconds between effects
      size: num('size', DEFAULTS.size, 10, 100), // % of the screen's shorter side
      bg: hex(p.get('bg')) || DEFAULTS.bg,
      drift: p.get('drift') === '1',
      boot: p.get('boot') !== '0',
    };
  }

  // Only settings that differ from the defaults go in the link.
  function writeLink() {
    const p = new URLSearchParams();
    if (!settings.fx.length) p.set('fx', 'none');
    else if (settings.fx.length < ALL_EFFECTS.length) p.set('fx', settings.fx.join(','));
    if (settings.every !== DEFAULTS.every) p.set('every', settings.every);
    if (settings.bg !== DEFAULTS.bg) p.set('bg', settings.bg);
    if (settings.size !== DEFAULTS.size) p.set('size', settings.size);
    if (settings.drift) p.set('drift', '1');
    if (!settings.boot) p.set('boot', '0');
    const query = p.toString().replace(/%2C/g, ',');
    history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash);
  }

  const settings = readLink();
  const root = document.documentElement;

  function render() {
    root.style.setProperty('--bg', '#' + settings.bg);
    root.style.setProperty('--size', settings.size + 'vmin');
    document.body.classList.toggle('drift', settings.drift);
  }

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

  // Letters strike on one by one, like neon tubes.
  async function intro() {
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
  const EFFECTS = { flicker, glitch, press, intro };
  const WEIGHTS = { flicker: 5, glitch: 3, press: 2 };
  let busy = false;

  function chooseEffect(from = settings.fx) {
    const total = from.reduce((sum, name) => sum + WEIGHTS[name], 0);
    let roll = Math.random() * total;
    for (const name of from) if ((roll -= WEIGHTS[name]) < 0) return name;
    return from[0];
  }

  async function run(name) {
    if (busy || !name) return;
    busy = true;
    try {
      await EFFECTS[name]();
      // Now and then a second effect follows straight after.
      if (name !== 'press' && name !== 'intro' && settings.fx.length > 1 && Math.random() < 0.2) {
        await sleep(rand(120, 400));
        await EFFECTS[chooseEffect()]();
      }
    } finally {
      busy = false;
    }
  }

  // One timer at a time; changing a setting restarts it so the new timing
  // applies straight away.
  let timer = null;
  function scheduleNext() {
    clearTimeout(timer);
    timer = null;
    if (!settings.fx.length) return;
    timer = setTimeout(async () => {
      if (!document.hidden) await run(chooseEffect());
      scheduleNext();
    }, settings.every * 1000 * rand(0.5, 1.5));
  }

  // ---- Menu ----------------------------------------------------------------
  const menu = document.getElementById('menu');
  const menuButton = document.querySelector('.menu-button');
  const toast = document.querySelector('.toast');
  const fxBoxes = [...menu.querySelectorAll('input[name="fx"]')];
  const everyInput = menu.querySelector('#every');
  const sizeInput = menu.querySelector('#size');
  const bgInput = menu.querySelector('#bg');
  const swatches = [...menu.querySelectorAll('.swatch[data-bg]')];
  const driftBox = menu.querySelector('#drift');
  const bootBox = menu.querySelector('#boot');

  const sameValue = (a, b) => (Array.isArray(a) ? a.length === b.length && a.every(x => b.includes(x)) : a === b);
  const activePreset = () => PRESETS.findIndex(p =>
    PRESET_KEYS.every(k => sameValue(settings[k], k in p.set ? p.set[k] : DEFAULTS[k])));

  const presetButtons = PRESETS.map((preset, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset';
    const key = document.createElement('kbd');
    key.textContent = i + 1;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = preset.name;
    const note = document.createElement('span');
    note.className = 'note';
    note.textContent = preset.note;
    button.append(key, name, note);
    button.addEventListener('click', () => selectPreset(i));
    const item = document.createElement('li');
    item.append(button);
    menu.querySelector('.presets').append(item);
    return button;
  });

  function syncMenu() {
    const active = activePreset();
    presetButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === active)));
    menu.querySelector('.preset-state').textContent = active === -1 ? '· Custom' : '';
    fxBoxes.forEach(box => { box.checked = settings.fx.includes(box.value); });
    everyInput.value = settings.every;
    menu.querySelector('#every-out').textContent = `~${settings.every} s`;
    sizeInput.value = settings.size;
    menu.querySelector('#size-out').textContent = `${settings.size}%`;
    let matched = false;
    swatches.forEach(s => {
      const on = s.dataset.bg === settings.bg;
      matched ||= on;
      s.setAttribute('aria-pressed', String(on));
    });
    bgInput.value = '#' + settings.bg;
    bgInput.parentElement.classList.toggle('on', !matched);
    driftBox.checked = settings.drift;
    bootBox.checked = settings.boot;
  }

  function changed() {
    render();
    writeLink();
    syncMenu();
    scheduleNext();
  }

  let toastTimer;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
  }

  function selectPreset(i) {
    const preset = PRESETS[i];
    for (const k of PRESET_KEYS) settings[k] = k in preset.set ? preset.set[k] : DEFAULTS[k];
    changed();
    if (menu.hidden) showToast(`${i + 1} · ${preset.name}`);
  }

  function stepPreset(direction) {
    const current = activePreset();
    const next = current === -1
      ? (direction > 0 ? 0 : PRESETS.length - 1)
      : (current + direction + PRESETS.length) % PRESETS.length;
    selectPreset(next);
  }

  fxBoxes.forEach(box => box.addEventListener('change', () => {
    settings.fx = ALL_EFFECTS.filter(name => fxBoxes.some(b => b.value === name && b.checked));
    changed();
  }));
  everyInput.addEventListener('input', () => { settings.every = Number(everyInput.value); changed(); });
  sizeInput.addEventListener('input', () => { settings.size = Number(sizeInput.value); changed(); });
  bgInput.addEventListener('input', () => { settings.bg = hex(bgInput.value) || DEFAULTS.bg; changed(); });
  swatches.forEach(s => s.addEventListener('click', () => { settings.bg = s.dataset.bg; changed(); }));
  driftBox.addEventListener('change', () => { settings.drift = driftBox.checked; changed(); });
  bootBox.addEventListener('change', () => { settings.boot = bootBox.checked; changed(); });

  menu.querySelector('[data-action="intro"]').addEventListener('click', () => run('intro'));
  menu.querySelector('[data-action="copy"]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast('Link copied');
    } catch {
      showToast('Couldn’t copy — use the address bar');
    }
  });

  const menuOpen = () => !menu.hidden;
  function setMenu(open) {
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    active();
  }
  menuButton.addEventListener('click', () => setMenu(!menuOpen()));

  // ---- Fullscreen, keys, cursor, screen wake ------------------------------
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else root.requestFullscreen?.().catch(() => {});
  }

  // A click on the logo or background closes the menu, or else toggles fullscreen.
  document.addEventListener('click', e => {
    if (e.target.closest('.menu, .menu-button')) return;
    if (menuOpen()) setMenu(false);
    else toggleFullscreen();
  });

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { if (menuOpen()) setMenu(false); return; }
    // Leave keys alone while a slider or colour picker has focus, and let
    // Space/Enter press whichever button has focus.
    if (e.target.closest?.('input')) return;
    if (e.target.closest?.('button') && (e.key === ' ' || e.key === 'Enter')) return;
    const key = e.key.toLowerCase();
    if (key === 'f') toggleFullscreen();
    else if (key === 'm') setMenu(!menuOpen());
    else if (key === 'g') run('glitch');
    else if (key === 'l') run('flicker');
    else if (key === 'p') run('press');
    else if (key === 'b') run('intro');
    else if (key === ' ') run(chooseEffect(settings.fx.length ? settings.fx : ALL_EFFECTS));
    else if (/^[1-9]$/.test(key) && PRESETS[key - 1]) selectPreset(key - 1);
    else if (key === 'arrowright' || key === 'arrowdown') stepPreset(1);
    else if (key === 'arrowleft' || key === 'arrowup') stepPreset(-1);
    else return;
    e.preventDefault();
  });

  // Hide the cursor, help text and menu after a moment without mouse
  // movement (longer while the menu is open). Key presses don't bring them
  // back, so effects can be cued while filming.
  let idleTimer;
  function active() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add('idle'), menuOpen() ? 10000 : 2500);
  }
  for (const ev of ['mousemove', 'pointerdown', 'touchstart', 'wheel']) {
    document.addEventListener(ev, active, { passive: true });
  }

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

  // ---- Start ---------------------------------------------------------------
  render();
  syncMenu();
  active();
  keepAwake();
  (async () => {
    if (settings.boot) await run('intro');
    scheduleNext();
  })();
})();
