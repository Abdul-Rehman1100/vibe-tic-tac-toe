# Developer Guardrails

## Rules
- Use only standards-based HTML, CSS, and JavaScript; add no dependencies or build tools.
- Keep mutable game facts in state, never infer rules from visual classes or text.
- Use kebab-case HTML/CSS names, camelCase JavaScript names, and UPPER_SNAKE_CASE constants.
- Do not use inline handlers, duplicated listeners, remote fonts, trackers, or real AdSense code.
- Keep a static semantic content structure for SEO and reserve ad dimensions before loading ads.
- Minimax is restricted to 3x3. Never describe larger-grid play as mathematically unbeatable.

## Verification checklist
- [ ] Keyboard controls and visible focus work.
- [ ] Each level generates the correct dimensions and win length.
- [ ] Horizontal, vertical, and both diagonal wins work.
- [ ] Draw, restart, and configuration changes reset safely.
- [ ] Bot never chooses an occupied cell or moves after a terminal game.
- [ ] Strong 3x3 bot does not lose.
- [ ] Layout has no horizontal scroll or ad-slot shift at mobile widths.
