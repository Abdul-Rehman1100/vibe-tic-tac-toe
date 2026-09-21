# Product Requirements — Vibe Tic-Tac-Toe

## Goal
Deliver a fast, accessible, search-friendly Tic-Tac-Toe game that supports local two-player and computer play. The page is built for future Google AdSense monetization without compromising gameplay or Core Web Vitals.

## Users
- Casual visitors need immediate, mobile-friendly games.
- Competitive players need a genuinely unbeatable classic 3x3 opponent.
- Organic-search visitors need clear rules, useful static content, and descriptive metadata.

## Gameplay
| Level | Grid | Win rule |
| --- | --- | --- |
| 1 | 3 × 3 | 3 in a row |
| 2 | 4 × 4 | 4 in a row |
| 3 | 5 × 5 | 5 in a row |

Two Player is pass-and-play. Single Player assigns the visitor X and the bot O. Easy chooses legal moves randomly. Strong uses exact Minimax on 3x3 and a responsive tactical evaluator on larger grids.

## Monetization and SEO
- Reserve top, in-content, and bottom ad slots in the initial document so future ads do not cause CLS.
- Never put ads in the board or immediately beside game controls.
- Use one H1, semantic main/section/footer landmarks, static rules content, title, description, canonical, Open Graph, Twitter, robots, and WebApplication JSON-LD.
- Use no live AdSense script or publisher ID until a compliant production configuration is supplied.

## Quality constraints
- Vanilla HTML, CSS, and JavaScript only.
- Deferred local JavaScript; no remote fonts or framework payload.
- Keyboard support, focus visibility, and polite live status updates.
- Responsive visual layout and reduced-motion support.
