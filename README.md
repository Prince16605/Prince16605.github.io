# Prince Vaghasiya — Portfolio

A single-page portfolio for a **Cloud & DevOps engineer**, built as a cyberpunk mission-control HUD: a CSS-only retro laptop gate, a working in-page terminal, synthesised audio, a scroll-driven blade animation and lime "alert" sections that invert the navigation. It is vanilla HTML, CSS and JavaScript — no framework, no bundler, no dependencies beyond Google Fonts — and it runs identically from `file://` or GitHub Pages.

Live at **https://prince16605.github.io/** (repo: `Prince16605/Prince16605.github.io`, Pages from `main` → `/`).

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

## What is on the page

| Section | Content |
| --- | --- |
| Hero | name, `CLOUD & DEVOPS ENGINEER` role pills, location Pune, résumé-driven intro |
| About | profile, stat counters (cloud projects / certifications / AWS services) |
| Experience | Cloud & DevOps Engineer @ NexGen Analytix · Shopify Developer Intern @ Vopify Solutions (Dec 2024 – Jun 2025) |
| Skills | AWS cloud, Linux admin, Docker, Jenkins CI/CD, Terraform, Ansible (meter bars) |
| Projects | 8 real repositories with hand-drawn SVG architecture diagrams + an archive card |
| Terminal | `help`, `whoami`, `about`, `projects`, `skills`, `experience`, `neofetch`, `contact`, `open <n>`, `ls`, `clear` |
| Contact | email, phone, GitHub, LinkedIn |

Every fact on the page comes from `cloud&devops.pdf` and the public repositories under `github.com/Prince16605` — nothing is invented. Project cards link to the repository that actually contains the work.

## Customising

### Name, links, location
Everything lives in `index.html`:

| What | Where |
| --- | --- |
| Name in nav | `.logo-text` |
| Hero headline | `.hero-name` (four `.hn-half` spans — top and bottom halves of each line) |
| Email (×4 places) | search `vaghasiyaprince13@gmail.com` |
| Phone | search `+91 99793 72847` |
| GitHub / LinkedIn | search `Prince16605` and `prince-vaghasiya-12a4232a3` |
| Location & coordinates | `.nav-loc`, `.hero-meta`, `.menu-coords` |
| Meta / SEO / OG tags | `<head>` |
| Structured data | the `application/ld+json` block in `<head>` |

After changing the domain, update `rel="canonical"`, `og:url`, `og:image` and `twitter:image` — they must be absolute URLs.

### Colours
All colours are custom properties at the top of `style.css`:

```css
--lime:#aaff00;   /* primary accent */
--red:#ff2d3d;    /* alert / critical accent */
--green:#19ff6a;  /* terminal + status LEDs */
--purple:#5b00d9; /* secondary accent */
```

Change `--lime` and `--red` and the whole site follows — including the lime sections, the nav inversion, the terminal and the SVG icons. If you pick a light accent, also update `.lime-zone` text colours from `#000` to a dark equivalent.

### Fonts
Loaded in one `<link>` in `<head>`: Orbitron (headings), Space Grotesk (body), Space Mono (labels/terminal), Playfair Display italic (editorial accents), Doto (dot-matrix numerals). Swap the families in that link, then update the `--f-head`, `--f-body`, `--f-mono`, `--f-serif` and `--f-dot` variables.

### Projects
Each project is an `<article class="proj">` with data attributes that the terminal reads directly:

```html
<article class="proj proj-wide"
  data-idx="01"
  data-title="MediCarePlus"
  data-cat="AWS · FULL STACK"
  data-desc="Hospital appointment booking platform on a two-tier VPC with ALB and Auto Scaling."
  data-tech="PHP,MySQL,AWS,EC2,RDS,S3,ALB,AutoScaling,CloudWatch,SNS"
  data-link="https://github.com/Prince16605/Medicare-plus-hospital-booking">
```

Because the shell reads these attributes, the cards and the `projects` command can never fall out of sync.

- `proj-wide` — spans two columns on desktop (media aspect `21/8`, `2/1` at ≤820, `16/9` at ≤640).
- `proj-archive` — spans two columns and holds the repository list instead of a diagram.
- `data-idx` is what `open 5` uses, so keep the numbers contiguous.

### Architecture diagrams
Each card's media is an inline SVG (`class="arch"`, viewBox `600 300` or `900 340`) drawn from a small set of `<rect>` + `<text>` primitives — no images, so it stays crisp at any size and costs nothing extra to load. Text sizes are set in user units (`.arch-t`, `.arch-s`) and the whole diagram scales with the card; on narrow screens a media query bumps them to `18px`/`14px` so labels stay readable. Keep labels short (roughly ≤10 characters) or they will outgrow their box at that size.

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

This repository is already a **user site** (`Prince16605.github.io`), so a push to `main` is the whole deploy — Pages builds from `main` → `/` and the site lands at `https://prince16605.github.io/`.

For a fresh copy elsewhere:

```bash
git init && git add . && git commit -m "Initial portfolio"
gh repo create USERNAME.github.io --public --source=. --remote=origin --push
# then: Settings → Pages → Source: Deploy from a branch → main → / (root)
```

For a project site (`https://USERNAME.github.io/portfolio/`) update the absolute URLs in `<head>` to include the subpath.

## Audio

Every sound is synthesised in the browser with the Web Audio API: hover blips, clicks, keypresses, the blade slash, the dock thunk, the access-granted chime, the error buzz, and the generative ambient track (detuned saw pad, triangle arpeggio, soft kick and hat). **There are no audio files in this repository.** Audio unlocks on the gate click because browsers require a user gesture, and it suspends automatically when the tab is hidden. The SFX and BGM toggles persist in `localStorage`.

## Accessibility & performance notes

- Fully readable with JavaScript disabled — the gate is hidden, reveals are forced open and scrolling is re-enabled via `<noscript>` plus `@media (scripting: none)`.
- Skip link, semantic landmarks, one `h1`, `aria-pressed` toggles, `aria-expanded` menu button.
- Gate and menu use `inert` on hidden content and trap focus while open; Escape closes the menu.
- `prefers-reduced-motion: reduce` removes the blade flight, parallax, auto-typing delays and all looping animation.
- Diagrams are inline SVG with `role="img"` and an `aria-label` describing the flow, so they are not invisible to screen readers.
- No render-blocking JS (`main.js` is at the end of `<body>`), images are WebP with explicit dimensions, and scroll handlers are throttled with `requestAnimationFrame`.
- No horizontal overflow from 360px up; project grids use `minmax(0,1fr)` so long strings cannot widen a track.

## Credits

Fonts: [Orbitron](https://fonts.google.com/specimen/Orbitron) (Matt McInerney), [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (Florian Karsten), [Space Mono](https://fonts.google.com/specimen/Space+Mono) (Colophon Foundry), [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) (Claus Eggers Sørensen), [Doto](https://fonts.google.com/specimen/Doto) (Google Fonts) — all SIL Open Font License. Everything else was written for this project.
