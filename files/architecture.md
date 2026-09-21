# Architecture — Vibe Tic-Tac-Toe

## Files
```text
index.html  semantic SEO-first page and static ad slots
style.css   responsive visual system and layout stability
app.js      state, rendering, game rules, and bot logic
```

## State and board
`state` is the single source of truth: board, mode, level configuration, current player, terminal status, bot status, and winning indexes. Board data is a flat `Array(size * size)`; index `row * size + column` maps it to the visual grid.

## Dynamic rules
`LEVELS` defines `{ size, winLength }` for each level. The board generator creates native button cells and CSS Grid reads `--grid-size`. Win detection starts at the last move and scans horizontal, vertical, and both diagonals in each direction. This returns contiguous winning indexes and avoids scanning every possible line. The 5x5 level requires five contiguous marks.

## Bots
Easy selects an empty index randomly. Strong uses alpha-beta Minimax for 3x3. Larger boards use immediate win/block checks and positional tactical scoring, keeping response time small on mobile devices.

## CLS-safe advertisement structure
Ad containers exist in HTML in the following order: top slot, game panel, in-content slot, rules content, bottom slot. CSS reserves responsive `min-height` values before an ad is ever inserted. No slot is dynamically injected above visible content.
