/**
 * @file constants.js
 * Immutable values, board level configurations, and game rules.
 * Supports both standard script loading and module environments.
 */

(function(global) {
  "use strict";

  const LEVELS = Object.freeze({
    1: { size: 3, winLength: 3, label: "Connect 3 in a row to win." },
    2: { size: 4, winLength: 4, label: "Connect 4 in a row to win." },
    3: { size: 5, winLength: 5, label: "Connect 5 in a row to win." }
  });

  const HUMAN = "X";
  const BOT = "O";

  const DIRECTIONS = Object.freeze([
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal Down-Right
    [1, -1]   // Diagonal Down-Left
  ]);

  const SHARE_BACKGROUNDS = Object.freeze([
    "assets/images/a.webp",
    "assets/images/b.webp",
    "assets/images/c.webp",
    "assets/images/d.webp"
  ]);

  const DEFAULT_NAMES = Object.freeze({
    X: "Player X",
    O: "Bot"
  });

  const MODEL_PATH = "assets/models/crystal 3d model.glb";

  const VibeConstants = {
    LEVELS,
    HUMAN,
    BOT,
    DIRECTIONS,
    SHARE_BACKGROUNDS,
    DEFAULT_NAMES,
    MODEL_PATH
  };

  global.VibeConstants = VibeConstants;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = VibeConstants;
  }
})(typeof window !== "undefined" ? window : globalThis);
