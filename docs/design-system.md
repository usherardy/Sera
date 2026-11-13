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
**Plus Jakarta Sans** for everything (`--font-sans`, and `--font-serif` maps to it too). **IBM Plex Mono** only for timestamps and small sample badges.
- `.display`: weight 700, tracking −0.035em, line-height 1.04. One accent word per heading in `<em>`, rendered as a caramel→purple gradient (not italic): "What did the client *ask* for?"
- `.eyebrow`: 11px, weight 600, uppercase, tracking 0.18em, muted.
- Body 15–16px; quotes in italic.

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

## Logo
A lavender tile (`#E3E0FF`) with an ink "thread" mark, and the wordmark SERA in bold uppercase with wide tracking.

## Copy and states
Processing status lines: "Not analyzed yet", "Analyzing…", "Analyzed", "Couldn't analyze". Sample data always carries a visible **Sample** badge. Every list has an empty state; every async action has a loading and a failed state.
