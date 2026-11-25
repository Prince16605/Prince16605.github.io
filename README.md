# Prince Vaghasiya — Portfolio

A single-page personal portfolio built as a cyberpunk mission-control HUD: a CSS-only retro laptop gate, a working in-page terminal, synthesised audio, a scroll-driven blade animation and lime "alert" sections that invert the navigation. It is vanilla HTML, CSS and JavaScript — no framework, no bundler, no dependencies beyond Google Fonts — and it runs identically from `file://` or GitHub Pages.

## File structure

```
.
├── index.html          # all content lives here (crawlable, works without JS)
├── style.css           # design system, HUD chrome, layout, responsive rules
├── main.js             # gate, audio engine, terminal, scroll effects
├── README.md
└── assets/
    ├── portrait.webp        # hero portrait (786 × 1087)
    ├── portrait-mono.webp   # duotone variant used in the About scanner
    ├── og-image.png         # 1200 × 630 social preview
    └── favicon.svg          # PV monogram
```

## Customising

### Name, links, location
Everything lives in `index.html`:

| What | Where |
| --- | --- |
| Name in nav | `.logo-text` |
| Hero headline | `.hero-name` (four `.hn-half` spans — top and bottom halves of each line) |
| Email (×4 places) | search `vaghasiyaprince13@gmail.com` |
| GitHub / LinkedIn | search `Prince16605` and `prince-vaghasiya-12a4232a3` |
| Location & coordinates | `.nav-loc`, `.hero-meta`, `.menu-coords` |
| Meta / SEO / OG tags | `<head>` |
| Structured data | the `application/ld+json` block in `<head>` |

After changing the domain, update `rel="canonical"`, `og:url`, `og:image` and `twitter:image` — they must be absolute URLs.

### Colours
All colours are custom properties at the top of `style.css`:

```css
--lime:#aaff00;   /* primary accent */
--red:#ff2d3d;    /* alert / offensive accent */
--green:#19ff6a;  /* terminal + status LEDs */
--purple:#5b00d9; /* secondary accent */
```

Change `--lime` and `--red` and the whole site follows — including the lime sections, the nav inversion, the terminal and the SVG icons. If you pick a light accent, also update `.lime-zone` text colours from `#000` to a dark equivalent.

### Fonts
Loaded in one `<link>` in `<head>`: Orbitron (headings), Space Grotesk (body), Space Mono (labels/terminal), Playfair Display italic (editorial accents), Doto (dot-matrix numerals). Swap the families in that link, then update the `--f-head`, `--f-body`, `--f-mono`, `--f-serif` and `--f-dot` variables.

### Projects
Each project is an `<article class="proj">` with data attributes that the terminal reads directly:

```html
<article class="proj"
  data-idx="03"
  data-title="LocalMind"
  data-cat="LOCAL LLM"
  data-desc="Offline 7B assistant that runs on a single 8GB laptop GPU."
  data-tech="llama.cpp,Python,SQLite"
  data-link="https://github.com/…">
```

Because the shell reads these attributes, the cards and the `projects` command can never fall out of sync. Add `proj-wide` to a card to span two columns, and `proj-classified` for the redacted "no source" treatment.

### Terminal commands
Commands are plain functions on the `commands` object in `main.js`:

```js
commands.mycmd = function (arg) {
  print('<span class="ok">hello ' + esc(arg) + '</span>');
};
```

Registering the function is enough — `help`, Tab completion and history pick it up automatically.

## Local preview

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly also works; the only network requests are the Google Fonts stylesheet.

## Deploy to GitHub Pages

**Option A — user site (recommended, serves at the domain root)**

```bash
gh repo create USERNAME.github.io --public --source=. --remote=origin --push
# then: Settings → Pages → Source: Deploy from a branch → main → / (root)
```

The site is then live at `https://USERNAME.github.io/` — which is what the canonical and Open Graph URLs in `index.html` assume.

**Option B — project site (any repo)**

```bash
git init && git add . && git commit -m "Initial portfolio"
gh repo create portfolio --public --source=. --remote=origin --push
```

Then Settings → Pages → Source: Deploy from a branch → `main` → `/ (root)`. The site appears at `https://USERNAME.github.io/portfolio/` — update the absolute URLs in `<head>` to match.

## Audio

Every sound is synthesised in the browser with the Web Audio API: hover blips, clicks, keypresses, the blade slash, the dock thunk, the access-granted chime, the error buzz, and the generative ambient track (detuned saw pad, triangle arpeggio, soft kick and hat). **There are no audio files in this repository.** Audio unlocks on the gate click because browsers require a user gesture, and it suspends automatically when the tab is hidden. The SFX and BGM toggles persist in `localStorage`.

## Accessibility & performance notes

- Fully readable with JavaScript disabled — the gate is hidden and all content is in the HTML.
- Skip link, semantic landmarks, one `h1`, `aria-pressed` toggles, `aria-expanded` menu button.
- Gate and menu use `inert` on hidden content and trap focus while open; Escape closes the menu.
- `prefers-reduced-motion: reduce` removes the blade flight, parallax, auto-typing delays and all looping animation.
- No render-blocking JS (`main.js` is at the end of `<body>`), images are WebP with explicit dimensions, and scroll handlers are throttled with `requestAnimationFrame`.

## Credits

Fonts: [Orbitron](https://fonts.google.com/specimen/Orbitron) (Matt McInerney), [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (Florian Karsten), [Space Mono](https://fonts.google.com/specimen/Space+Mono) (Colophon Foundry), [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) (Claus Eggers Sørensen), [Doto](https://fonts.google.com/specimen/Doto) (Google Fonts) — all SIL Open Font License. Everything else was written for this project.
