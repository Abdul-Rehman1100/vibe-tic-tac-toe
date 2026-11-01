/**
 * @file state.js
 * Unified game engine state, win detection, and AI engines (Minimax + Heuristic).
 * Supports both standard script loading and module environments.
 */

(function(global) {
  "use strict";

  const Constants = global.VibeConstants || {
    LEVELS: {
      1: { size: 3, winLength: 3, label: "Connect 3 in a row to win." },
      2: { size: 4, winLength: 4, label: "Connect 4 in a row to win." },
      3: { size: 5, winLength: 5, label: "Connect 5 in a row to win." }
    },
    HUMAN: "X",
    BOT: "O",
    DIRECTIONS: [[0, 1], [1, 0], [1, 1], [1, -1]],
    SHARE_BACKGROUNDS: ["assets/images/a.webp"]
  };

  const { LEVELS, HUMAN, BOT, DIRECTIONS, SHARE_BACKGROUNDS } = Constants;

  const state = {
    board: [],
    level: 1,
    size: 3,
    winLength: 3,
    mode: "single",
    difficulty: "easy",
    currentPlayer: HUMAN,
    isGameOver: false,
    isBotThinking: false,
    winningCells: [],
    gameId: 0,
    isReady: false,
    names: { X: "", O: "Bot" },
    scores: { X: 0, O: 0, draws: 0 },
    shareBackground: SHARE_BACKGROUNDS[0]
  };

  function applyConfiguration(config = {}) {
    if (config.level !== undefined) state.level = Number(config.level);
    if (config.mode !== undefined) state.mode = config.mode;
    if (config.difficulty !== undefined) state.difficulty = config.difficulty;

    const levelRules = LEVELS[state.level] || LEVELS[1];
    state.size = levelRules.size;
    state.winLength = levelRules.winLength;
    return levelRules;
  }

  function prepareGame() {
    state.gameId += 1;
    const config = LEVELS[state.level] || LEVELS[1];
    state.size = config.size;
    state.winLength = config.winLength;
    state.board = Array(state.size * state.size).fill("");
    state.currentPlayer = HUMAN;
    state.isGameOver = false;
    state.isBotThinking = false;
    state.winningCells = [];
  }

  function startNewGame(xName, oName) {
    state.names.X = (xName || "").trim();
    state.names.O = state.mode === "two-player" ? (oName || "").trim() : "Bot";
    state.isReady = true;
    state.gameId += 1;
    state.board = Array(state.size * state.size).fill("");
    state.currentPlayer = HUMAN;
    state.isGameOver = false;
    state.isBotThinking = false;
    state.winningCells = [];
  }

  function isValidMove(index) {
    return (
      Number.isInteger(index) &&
      index >= 0 &&
      index < state.board.length &&
      state.board[index] === ""
    );
  }

  function isBoardFull(board = state.board) {
    return board.every(Boolean);
  }

  function toIndex(row, column, size = state.size) {
    return row * size + column;
  }

  function inBounds(row, column, size = state.size) {
    return row >= 0 && row < size && column >= 0 && column < size;
  }

  function collectDirection(board, size, row, column, rowDelta, columnDelta, player) {
    const cells = [];
    let nextRow = row + rowDelta;
    let nextColumn = column + columnDelta;
    while (inBounds(nextRow, nextColumn, size) && board[toIndex(nextRow, nextColumn, size)] === player) {
      cells.push(toIndex(nextRow, nextColumn, size));
      nextRow += rowDelta;
      nextColumn += columnDelta;
    }
    return cells;
  }

  function getWinner(board, size, winLength, lastIndex) {
    const player = board[lastIndex];
    if (!player) return null;
    const row = Math.floor(lastIndex / size);
    const column = lastIndex % size;

    for (const [rowDelta, columnDelta] of DIRECTIONS) {
      const backward = collectDirection(board, size, row, column, -rowDelta, -columnDelta, player).reverse();
      const forward = collectDirection(board, size, row, column, rowDelta, columnDelta, player);
      const line = [...backward, lastIndex, ...forward];
      if (line.length >= winLength) {
        const pivot = line.indexOf(lastIndex);
        const start = Math.max(0, Math.min(pivot, line.length - winLength));
        return { player, cells: line.slice(start, start + winLength) };
      }
    }
    return null;
  }

  function availableMoves(board = state.board) {
    return board.reduce((moves, mark, index) => {
      if (!mark) moves.push(index);
      return moves;
    }, []);
  }

  function chooseBotMove() {
    const moves = availableMoves();
    if (!moves.length) return null;
    if (state.difficulty === "easy") {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    return state.size === 3 ? getMinimaxMove() : getTacticalMove(moves);
  }

  function getMinimaxMove() {
    let bestScore = -Infinity;
    let bestMove = null;
    for (const move of availableMoves()) {
      state.board[move] = BOT;
      const score = minimax(state.board, false, 0, -Infinity, Infinity, move);
      state.board[move] = "";
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  function minimax(board, isMaximizing, depth, alpha, beta, lastMove) {
    const winner = getWinner(board, 3, 3, lastMove);
    if (winner?.player === BOT) return 10 - depth;
    if (winner?.player === HUMAN) return depth - 10;
    const moves = availableMoves(board);
    if (!moves.length) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (const move of moves) {
        board[move] = BOT;
        best = Math.max(best, minimax(board, false, depth + 1, alpha, beta, move));
        board[move] = "";
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }

    let best = Infinity;
    for (const move of moves) {
      board[move] = HUMAN;
      best = Math.min(best, minimax(board, true, depth + 1, alpha, beta, move));
      board[move] = "";
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  function findImmediateMove(player, moves) {
    for (const move of moves) {
      state.board[move] = player;
      const winner = getWinner(state.board, state.size, state.winLength, move);
      state.board[move] = "";
      if (winner) return move;
    }
    return null;
  }

  function getTacticalMove(moves) {
    const winningMove = findImmediateMove(BOT, moves);
    if (winningMove !== null) return winningMove;

    const blockingMove = findImmediateMove(HUMAN, moves);
    if (blockingMove !== null) return blockingMove;

    const center = (state.size - 1) / 2;
    let bestScore = -Infinity;
    let bestMoves = [];

    for (const move of moves) {
      const row = Math.floor(move / state.size);
      const column = move % state.size;
      let score = 10 - Math.abs(row - center) - Math.abs(column - center);
      state.board[move] = BOT;
      for (const [rowDelta, columnDelta] of DIRECTIONS) {
        const line =
          collectDirection(state.board, state.size, row, column, rowDelta, columnDelta, BOT).length +
          collectDirection(state.board, state.size, row, column, -rowDelta, -columnDelta, BOT).length +
          1;
        score += line * line;
      }
      state.board[move] = "";
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  function recordResult(result) {
    if (result === "draw") {
      state.scores.draws += 1;
    } else {
      state.scores[result] += 1;
    }
  }

  const VibeState = {
    state,
    applyConfiguration,
    prepareGame,
    startNewGame,
    isValidMove,
    isBoardFull,
    toIndex,
    inBounds,
    collectDirection,
    getWinner,
    availableMoves,
    chooseBotMove,
    getMinimaxMove,
    minimax,
    findImmediateMove,
    getTacticalMove,
    recordResult
  };

  global.VibeState = VibeState;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = VibeState;
  }
})(typeof window !== "undefined" ? window : globalThis);
