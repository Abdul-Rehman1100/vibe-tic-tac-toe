# Engineering Decisions

## Vanilla JavaScript over React
The bounded interface and small state model do not justify a framework runtime, build process, or hydration cost. Native DOM updates make the static site fast to load, easy to deploy, and compatible with semantic HTML SEO.

## Minimax
3x3 has a sufficiently small game tree to search exactly. Alpha-beta Minimax guarantees an optimal bot and prefers faster wins. It is not used for 4x4/5x5: their much larger branching factors could cause visible delays. Those levels use a tactical heuristic that prioritizes wins, blocks, central positions, and useful lines.

## Dynamic grid performance
Each level uses one `{ size, winLength }` configuration and one board engine. The 5x5 configuration sets `winLength` to 5. After a move, four bidirectional line scans examine only the relevant row, column, and diagonals. At most 25 cells render, so dynamic grids remain inexpensive.

## Advertisement layout
Static, dimension-reserved slots prevent late ad content from shifting the game. They are separated from controls for usability and policy safety.
