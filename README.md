<p align="center">
  <img src="logo.svg" alt="Ctrl Leo Del logo" width="160">
</p>

# Ctrl Leo Del — logo screen

The Ctrl Leo Del logo, full screen, for leaving open on a monitor or TV in the background while filming.
Every so often it does something: a neon-style **flicker**, a short **glitch**, or a **key press** (the tile dips like a key being hit).
When the page opens, the letters switch on one by one.

Plain HTML, CSS and JavaScript. No build step, nothing to install.

## Using it

Open the page and click anywhere (or press <kbd>F</kbd>) for fullscreen.
The cursor, help text and menu fade out after a few seconds without mouse movement, so they never end up on camera.

| Key | Does |
|---|---|
| <kbd>F</kbd> or click | Fullscreen on/off |
| <kbd>M</kbd> | Menu on/off |
| <kbd>1</kbd>–<kbd>9</kbd> | Switch to that preset |
| <kbd>←</kbd> <kbd>→</kbd> | Previous / next preset |
| <kbd>G</kbd> | Glitch now |
| <kbd>L</kbd> | Flicker now |
| <kbd>P</kbd> | Key press now |
| <kbd>B</kbd> | Play the switch-on intro now |
| <kbd>Space</kbd> | A random effect now |

Pressing a key doesn't bring the cursor or help text back, so you can cue an effect on camera.

### Menu and presets

Press <kbd>M</kbd> or the **Menu** button in the bottom-right corner.
Pick one of the presets, or change the effects, timing, size and background yourself.

| # | Preset | What it does |
|---|---|---|
| 1 | Default | All effects, every ~12 s |
| 2 | Calm | All effects, every ~25 s |
| 3 | Busy | All effects, every ~5 s |
| 4 | Flicker only | Just the neon flicker |
| 5 | Glitch only | Just the glitch |
| 6 | Key press only | Just the key press |
| 7 | Still | No effects on their own; cue them with the keys |
| 8 | Black background | All effects, on pure black |
| 9 | Long display | Calm, with slow drift for OLED TVs |

Presets don't change the logo size or the intro setting, because those depend on the screen rather than the look.
Whatever you choose is written into the page's link straight away, so you can bookmark it, or use **Copy link** and open the same setup on another screen.

While the page is open on the hosted site, it keeps the screen from going to sleep.
Browsers don't allow this when `index.html` is opened straight from the disk.

## Link options

The menu fills these in for you. You can also add them to the end of the link by hand, for example `?fx=glitch,flicker&every=20&bg=000000`.

| Option | Default | What it does |
|---|---|---|
| `fx` | `all` | Which effects run on their own: any of `flicker`, `glitch`, `press` separated by commas, or `none`. |
| `every` | `12` | Average seconds between effects. The exact gap is random, between half and one and a half times this. |
| `bg` | `0c0f10` | Background colour as a hex code, without `#`. |
| `size` | `60` | Logo size, as a percentage of the screen's shorter side. |
| `boot` | `1` | `0` skips the letters switching on when the page opens. |
| `drift` | `0` | `1` makes the logo wander very slowly to protect OLED screens from burn-in. It's off by default because the movement shows up between jump cuts. |

## Filming tips

- **Bands or flicker on camera that isn't the effect:** that's the camera's shutter against the screen's refresh rate. Set the shutter to 1/50 or 1/60 (match your country's mains frequency) and it goes away.
- **Too bright or washed out:** turn the screen's brightness down rather than changing the colours. The dark background holds up better on camera.
- **OLED TV left on for hours:** add `?drift=1`.

## Running it locally

```sh
python -m http.server 8000
```

Then open <http://localhost:8000/>. Opening `index.html` directly works too, except for keeping the screen awake.

## Updating

When you change `screen.css` or `screen.js`, bump the `?v=` number on their links in `index.html`.
Browsers keep the old files for a few minutes otherwise, and a screen that already had the page open would mix old and new.
