# Design system

Clean, warm and simple, inspired by the Pexa Studio website (aesthetic only: no logo, copy, or imagery borrowed). Replaced the earlier Wispr Flow-style look on 2026-11-13. Keep all new UI in this style.

## Colors (tokens in [app/globals.css](../app/globals.css))
Token names are kept from v1 so components didn't need renaming.
- **Page** `--cream #FAF7F2`, behind a fixed warm gradient (white → warm white, a soft peach glow top-centre, a faint lavender glow top-right) and a very light film-grain overlay.
- **Cards** `--paper #FFFFFF` with a hairline border `rgba(20,30,80,0.08)` and soft navy shadows (`--sera-shadow-soft`, `--sera-shadow-lift`). No hard offset shadows.
- **Text** `--ink #121214`, muted `--ink-muted #6B6A73`. Dividers `--cream-dark #EBE6DD`.
- **Lavender** `--dawn #ECE6FF` for selected states and highlights; `--dawn-strong #D9CFF8` for their borders.
- **Dark hero cards** `--fathom #1B1A24` with white text (e.g. "Where it stands").
- **Pastel chips with deep text:** caramel `--glow #C28148` (possible additions), purple `--purple #5C4A99` (scope changes), peach `--warning #FFE9CF` / `#8A5A2A` (needs clarification, sample badges), pink `--signal #FFC9E5` (commitments), mint `--success #C9F5E0` / `#1A5C3A` (approved, reviewed). Errors: `--pulse #B4232C` on `--error-bg #FDE8E8`.
- Category styling lives in [lib/projects/meta.ts](../lib/projects/meta.ts).

## Type
Kept from v1 (the user preferred the original fonts over Plus Jakarta Sans):
- **EB Garamond** for headings (`.display`: weight 400, tracking −0.02em, line-height 1), with one *italic* accent word per heading in `<em>`, tinted with a caramel→purple gradient: "What did the client *ask* for?"
- **Figtree** for body and UI text.
- **IBM Plex Mono** for small uppercase eyebrow labels (`.eyebrow`: 12px, tracking 0.08em), timestamps and sample badges.

## Shape and depth
- Radius: buttons and inputs `rounded-xl` (0.75rem), cards 1.25rem (`rounded-card`), hero panels 1.75rem (`rounded-panel`), dialogs `rounded-3xl`.
- Borders are 1px hairlines everywhere; depth comes from soft shadows, not thick outlines.

## Buttons
- **Default / ink:** dark vertical gradient (`#3A3A3F → #121214`), white text, inner top highlight, soft navy drop shadow; brightens on hover, slight press scale.
- **Outline:** white with a hairline border. **Ghost:** transparent, faint ink hover. **Cream:** white on dark surfaces.

## Navigation
Floating **frosted-glass** bar (white/65, `backdrop-blur-xl`, inner highlight, soft shadow), max 64rem, with small uppercase tracked links: Record · Projects · Findings · Settings. Active link sits on a faint ink tint. Mobile: the same items in a frosted bottom bar.

## Record screen
A large dark gradient circle with a white mic, ringed by two soft pastel halos (lavender, peach). While recording: a dark pill with a pulsing coral dot, the live waveform, a mono timer, Stop and Cancel; always visible, which also covers the privacy requirement.

## Ask bar
`components/ask/ask-bar.tsx`: a raised card with a rounded input (sparkle icon, mic button, dark send button). While recording, the input becomes the dark recording pill with a live waveform, timer, cancel and Done. Suggested questions are small outline chips. Answers: plain text, dot bullets, an editable draft box on cream (Copy, Open in email, "Sera never sends anything"), then "From your calls" source cards (finding badge + serif italic quote, or a task / call / project icon row), 4 shown with "Show N more".

## Landing hero demo
`components/marketing/hero-demo.tsx` (client): dark recording pill + the line being said (serif, word-by-word fade) on the left; the call card on the right with a 3D **picker wheel** (12 rows on a CSS cylinder, `perspective` + `rotateX` + `translateZ`, faded top and bottom with a mask). The center band tints on landing: mint for In scope, red for Out of scope, lavender for Your task. Tick sound is a short band-passed noise burst from the Web Audio API, on by default; it unlocks on the first click, tap or key press (browsers block audio before that), and the toggle reads "Sound on · tap to hear" until then. Respects `prefers-reduced-motion`; pauses off screen.

## Landing page sky
`components/marketing/sky.tsx`: a soft blue sky gradient with original SVG clouds, drawn at full resolution (800×440 box, `overflow: visible`) so they stay crisp when scaled and are never clipped: circle clusters with a lightly roughened outline (`feTurbulence` + `feDisplacementMap`, three seeds, ~1px smoothing), a white-to-cool-white fill across the whole cloud, and a separate soft blurred shadow underneath, film grain, slow drift (off for reduced motion), and a fade into the page at the bottom. Used for the landing hero and the closing CTA panel. Drawn for Sera; no artwork copied from other sites.

## Logo
A lavender tile (`#E3E0FF`) with an ink "thread" mark, and the wordmark "Sera" (not all caps) in EB Garamond.

## Copy and states
Processing status lines: "Not analyzed yet", "Analyzing…", "Analyzed", "Couldn't analyze". Sample data always carries a visible **Sample** badge. Every list has an empty state; every async action has a loading and a failed state.
