# Project Memory: Vibe Games Platform

## 1. Project Overview
**Vibe Games Platform** is a modern, high-performance, accessible, dependency-free web gaming platform built with modular vanilla HTML5, CSS3, and ES6+ JavaScript. It features a full-width 3D Hero landing page, scalable featured game architecture, dedicated game routes, career dashboard, player setup, and a retro-arcade aesthetic powered by the Crackman font family.

- **Repository Root**: `d:\clone_update_push-back\vibe-tic-tac-toe`
- **Tech Stack**: Vanilla HTML5, Vanilla CSS3, Vanilla ES6+ JavaScript (Zero build tools or heavy framework runtimes).
- **Core Platform Routes**:
  - `#home` (Default `/`): Modern gaming-platform landing page featuring a Three.js 3D crystal hero stage, CLS-safe leaderboard ad slot, Featured Games section with scalable cards, About Us mission and philosophy section with 4 feature cards, middle rectangle ad slot, and multi-column footer.
  - `#game` (or `#play` / `#arena`): Dedicated game route displaying in the exact order: **How It Works → Game Room → Scoreboard**.
  - `#dashboard`: Career statistics overview (matches, wins, win rate) and quick-play mode cards.
  - `#login`: Player identity setup with avatar picker.
- **3D Graphics Pipeline**:
  - Three.js WebGL renderer displaying `assets/models/crystal 3d model.glb` inside `#hero-3d-canvas`.
  - Floating animations, multi-axis gentle rotation, glowing lighting accents (purple, cyan, coral), interactive pointer parallax, and floating particle dust.
  - Graceful 2D Canvas fallback with faceted glowing crystal animation for offline or non-WebGL environments.
- **Typography Architecture**:
  - `--font-display`: Primary gaming font (`"Crackman", "Arial Black", Impact, sans-serif`) for hero headlines, section titles, brand logo, CTAs, cell marks, and badges.
  - `--font-body`: Clean readable fallback stack (`Inter, ui-sans-serif, system-ui, sans-serif`) for descriptions, tables, scoreboard, inputs, and long-form content.

---

## 2. Updated Directory Structure

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

---

## 3. Component & Module Breakdown

### 3.1 Landing Page Architecture (`index.html`)
- **Hero Section**:
  - Full-width container with radial lighting and subtle grid texture.
  - Left column: Headline with Crackman typography, radiant gradient text (`.glow-text`), descriptive copy, primary CTA (`#game`), and secondary CTA (`#featured-games`).
  - Right column: Interactive 3D viewport mounting the Three.js crystal scene (`#hero-3d-canvas`).
- **First Ad Slot**: CLS-safe pre-allocated leaderboard slot (104px min-height) immediately beneath the hero.
- **Featured Games Section**: Responsive grid with reusable `.game-card` component for Vibe Tic-Tac-Toe, thumbnail, tags (`3×3 Classic`, `4×4 Tactical`, `5×5 Wild`), description, Play action, and bottom-right aligned "View All Games" link.
- **About Us Section**: Responsive two-column layout featuring the Vibe Games mission, browser-based gaming philosophy, accessibility commitment, zero-install experience, and roadmap with 4 highlight cards.
- **Second Ad Slot**: CLS-safe pre-allocated rectangle slot (280px min-height) beneath the About Us section.
- **Polished Footer**: Multi-column layout with branding, navigation links, social placeholders (GitHub, Discord, Twitter/X), copyright, and compliance badges.

### 3.2 Dedicated Game Route (`#game`)
Housed in `#view-game`, displaying content in the exact requested order:
1. **How It Works**: 3-step onboarding guide.
2. **Game Room**: Side-by-side mode/level controls panel and interactive dynamic grid.
3. **Scoreboard**: Session match history, draw counts, and high-DPI scorecard generator trigger.

### 3.3 Core Engine & Modules
- **`src/core/router.js`**: Handles hash-based routing between `#home`, `#game`, `#dashboard`, and `#login`. Smooth scrolls to section anchors (`#featured-games`, `#about`, `#how-to-play`, `#scoreboard`).
- **`src/modules/graphics.js`**: Three.js WebGL rendering pipeline for `assets/models/crystal 3d model.glb`. Handles GLTFLoader, camera parallax, multi-colored lighting, floating particle dust, and 2D Canvas fallback.
- **`src/core/state.js`**: Single source of truth. Features $O(K)$ bidirectional win detection and unbeatable Minimax (3×3) alongside tactical heuristics (4×4/5×5).
- **`src/modules/uiHandler.js`**: DOM binding, dynamic board generation, ARIA live region updates, and high-DPI Canvas scorecard export with Crackman font styling.
- **`src/main.js`**: Application orchestrator linking all subsystems.

---

## 4. Developer Conventions & Rules
- **Typography Tokens**: All font assignments must reference CSS variables (`--font-display` for headings/CTAs/branding, `--font-body` for body/forms/tables).
- **No Build Tools**: Native browser execution without bundlers or transpilation.
- **Universal Compatibility**: Script tags use `defer` to ensure compatibility across both `file:///` and `http://` protocols.
- **CLS Prevention**: All ad containers maintain fixed responsive minimum heights before insertion.
- **WCAG 2.1 AA Compliance**: High-contrast focus rings, ARIA live regions, semantic landmarks, and `@media (prefers-reduced-motion)`.
