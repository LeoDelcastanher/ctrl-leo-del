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
The cursor and help text hide after a couple of seconds without mouse movement.

| Key | Does |
|---|---|
| <kbd>F</kbd> or click | Fullscreen on/off |
| <kbd>G</kbd> | Glitch now |
| <kbd>L</kbd> | Flicker now |
| <kbd>P</kbd> | Key press now |
| <kbd>Space</kbd> | A random effect now |

Pressing a key doesn't bring the cursor or help text back, so you can cue an effect on camera.

While the page is open on the hosted site, it keeps the screen from going to sleep.
Browsers don't allow this when `index.html` is opened straight from the disk.

## Link options

Add these to the end of the link, for example `?fx=glitch,flicker&every=20&bg=000000`.

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
