# Architecture — Vibe Games Platform

## Directory & File Structure
```text
vibe-tic-tac-toe/
│
└── index.html                  # Main application shell, 3D landing page & route mounts
│
├── html/                       # Sub-pages and secondary HTML layouts
│   ├── login.html              # Authentication / Player setup view
│   ├── dashboard.html          # Post-login dashboard & career menu screen
│   └── game.html               # Dedicated board layout template (How It Works → Game Room → Scoreboard)
│
├── css/                        # Organized Cascading Style Sheets
│   ├── main.css                # Global styles, centralized Crackman typography tokens, Hero, Featured, About, Footer
│   ├── components/             # Component-level styles
│   │   ├── board.css           # Grids, cells, hover states, win animations
│   │   └── modular-ui.css      # Buttons, cards, modals, form controls, scoreboard
│   └── views/                  # View-specific layout overrides
│       ├── login.css           # Player avatar selector & sign-in styling
│       └── dashboard.css       # Career stats grid & quick-play cards
│
├── src/                        # Modular JavaScript application code
│   ├── main.js                 # App entry controller (bootstraps UI, Router, Graphics)
│   ├── core/                   # State, orchestration, and business rules
│   │   ├── router.js           # Client navigation & view swapping handler (#home, #game, #dashboard, #login)
│   │   ├── state.js            # Unified game engine state and data stores
│   │   └── constants.js        # Immutable values, level configs, and game rules
│   └── modules/                # Specialized logic modules
│       ├── graphics.js         # 3D Rendering pipeline (Three.js GLB handling with parallax, glow, particles & fallback)
│       ├── uiHandler.js        # DOM interaction, event listeners, Canvas scorecard
│       └── network.js          # Match history sync, offline persistence, sockets
│
├── assets/                     # Consolidated static assets
│   ├── models/                 # 3D GLB assets (crystal 3d model.glb & crystalModelData.js)
│   ├── fonts/                  # Display typography (Crackman font family & license)
│   └── images/                 # Logo and dynamic scorecard backgrounds (a-d.webp)
│
└── files/                      # Planning & developer documentation
    ├── agents.md               # Developer guardrails & verification checklist
    ├── architecture.md         # System architecture & component blueprints
    ├── decisions.md            # Key engineering trade-offs
    ├── prd.md                  # Product Requirements Document
    └── tasks.md                # Implementation roadmap
```

## Platform Architecture & Routes
1. **Homepage / Landing Page (`#home` or `/`)**:
   - **Hero Section**: Full-width immersive gaming showcase featuring real-time 3D rendering of `crystal 3d model.glb` via Three.js with smooth floating, multi-colored glow lights, interactive camera parallax, and ambient particle field.
   - **Top Advertisement Slot**: CLS-safe pre-allocated leaderboard slot (104px min-height).
   - **Featured Games Section**: Scalable grid displaying the Vibe Tic-Tac-Toe card with tags, description, play action, and bottom-right aligned "View All Games" button.
   - **About Us Section**: Responsive two-column layout detailing the Vibe Games mission, browser-based gaming philosophy, accessibility commitment, zero-install experience, and roadmap with 4 highlight cards.
   - **Middle Advertisement Slot**: CLS-safe pre-allocated rectangle slot (280px min-height).
   - **Polished Footer**: Multi-column footer with branding, navigation links, social placeholders, and compliance credits.

2. **Dedicated Game Route (`#game` or `#play`)**:
   Structured in the exact sequence:
   1. **How It Works**: 3-step onboarding guide.
   2. **Game Room**: Side-by-side mode/level controls panel and interactive dynamic grid.
   3. **Scoreboard**: Session match history, draw counts, and high-DPI scorecard generator trigger.

3. **Dashboard Route (`#dashboard`)**:
   Career statistics overview (matches, wins, win rate) and quick-play mode cards.

4. **Player ID Route (`#login`)**:
   Guest authentication and arcade avatar picker.

## Typography Architecture (Centralized Design Tokens)
- `--font-display`: Primary gaming font (`"Crackman", "Arial Black", Impact, sans-serif`) applied to hero headlines, section titles, card headers, brand logo, marks, and major call-to-actions.
- `--font-display-front` / `--font-display-back`: Layered font variants from the Crackman family.
- `--font-body`: Clean readable fallback stack (`Inter, ui-sans-serif, system-ui, sans-serif`) applied to descriptions, body copy, tables, forms, inputs, and accessibility notes to guarantee WCAG 2.1 AA readability.

## 3D Graphics Pipeline (`src/modules/graphics.js`)
- Initializes Three.js PerspectiveCamera, Scene, and WebGLRenderer with alpha transparency and antialiasing.
- Employs `THREE.GLTFLoader` to load `assets/models/crystal 3d model.glb`, centering and scaling the model dynamically.
- Configures multi-point lighting (ambient, directional, purple glow, cyan glow, and coral accent).
- Adds floating particle dust field (`THREE.Points`) with upward drift.
- Supports pointer-based interactive camera parallax with smooth lerp damping.
- Includes a robust 2D Canvas fallback that renders an animated, glowing faceted crystal if WebGL or Three.js is unavailable.

## State, Rules & Win Detection
`src/core/state.js` maintains the single source of truth. Win detection uses bidirectional ray-casting along 4 vectors (`[0, 1]`, `[1, 0]`, `[1, 1]`, `[1, -1]`), scanning from the last move in $O(K)$ time.
- **Level 1 (3×3)**: Unbeatable Alpha-Beta Minimax algorithm.
- **Levels 2 & 3 (4×4 & 5×5)**: Tactical heuristic scoring immediate wins, blocks, center proximity, and contiguous line building.

## Universal Script Compatibility
Modular files in `src/` are structured as Universal JavaScript (UMD / namespaced modules) loaded via `<script defer>` in `index.html`. This ensures immediate execution with zero CORS restrictions whether opened directly in a browser via `file:///` (double-clicking the file on desktop) or served through an HTTP/HTTPS web host.
