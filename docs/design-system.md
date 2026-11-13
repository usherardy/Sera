# Design system

Inspired by the Wispr Flow website (aesthetic only: no Wispr logo, name, illustrations, or copy). This replaces the brief's indigo/Geist direction. Keep all new UI in this style.

## Colors
- Surfaces: page cream `#FFFFEB`, cards paper `#FFFDF9`, borders `#E4E4D0`.
- Text: ink `#1A1A1A`, muted `#71716E`.
- Accent: lavender `#F0D7FF` (primary buttons, selected state); deep teal `#034F46` (inverted hero cards such as Daily Memory, cream text).
- Categories (badges and small dots only, never large fills): Decision teal `#034F46`, Commitment purple `#886DC2`, Important info orange `#FFA946`, Personal note pink `#FFBCF2`. Errors: coral `#FF6C4C`, maroon `#7F1C34`.
- Tokens live in [app/globals.css](../app/globals.css); category styling in [lib/categories.ts](../lib/categories.ts).

## Type
EB Garamond for headings with **one italic accent word** per heading ("Here's what *mattered* today."); Figtree for body and UI; IBM Plex Mono for timestamps, durations, and small uppercase eyebrow labels. Loaded via `next/font/google`.

## Shape and motion
Buttons: 0.5rem radius, 2px ink border, lavender fill, weight 600, small press-scale. Cards: 1rem radius, 2px `#E4E4D0` border, no blur shadows (occasionally a hard 2px ink offset shadow). Large containers: 2–2.5rem radius.

## Navigation
Desktop: floating bordered cream top bar (max 64rem). Mobile: floating bordered bottom bar: Home · Memory · [record] · Moments · Actions.

## Recording pill
Floating ink pill with live waveform (Web Audio `AnalyserNode`), mono timer, stop button. Always visible while recording, which also satisfies the privacy requirement.

## Copy and states
Processing shown as status lines: "Transcribing…", "Finding moments…", "Commitment identified". Sample data always carries a visible **Sample** badge. Every list has an empty state; every async action has a loading and failed state.
