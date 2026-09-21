"use strict";

const LEVELS = Object.freeze({
  1: { size: 3, winLength: 3, label: "Connect 3 in a row to win." },
  2: { size: 4, winLength: 4, label: "Connect 4 in a row to win." },
  3: { size: 5, winLength: 5, label: "Connect 5 in a row to win." }
});
const HUMAN = "X";
const BOT = "O";
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];
const SHARE_BACKGROUNDS = ["images/a.webp", "images/b.webp", "images/c.webp", "images/d.webp"];

const elements = {
  mode: document.querySelector("#game-mode"),
  difficulty: document.querySelector("#bot-difficulty"),
  difficultyWrap: document.querySelector("#difficulty-wrap"),
  level: document.querySelector("#game-level"),
  levelNote: document.querySelector("#level-note"),
  xName: document.querySelector("#player-x-name"),
  oName: document.querySelector("#player-o-name"),
  oNameWrap: document.querySelector("#player-o-wrap"),
  start: document.querySelector("#start-button"),
  restart: document.querySelector("#restart-button"),
  board: document.querySelector("#game-board"),
  status: document.querySelector("#game-status"),
  liveRegion: document.querySelector("#live-region"),
  boardHint: document.querySelector(".board-hint"),
  scoreXName: document.querySelector("#score-x-name"), scoreOName: document.querySelector("#score-o-name"),
  scoreXWins: document.querySelector("#score-x-wins"), scoreOWins: document.querySelector("#score-o-wins"),
  scoreXLosses: document.querySelector("#score-x-losses"), scoreOLosses: document.querySelector("#score-o-losses"), drawCount: document.querySelector("#draw-count"),
  shareButton: document.querySelector("#share-scorecard-btn"), shareModal: document.querySelector("#share-modal"),
  closeModal: document.querySelector(".close-modal-btn"), modalNameX: document.querySelector("#modal-name-x"), modalNameO: document.querySelector("#modal-name-o"),
  modalWinsX: document.querySelector("#modal-wins-x"), modalWinsO: document.querySelector("#modal-wins-o"), modalDraws: document.querySelector("#modal-draws-val"),
  modalTotalWins: document.querySelector("#modal-total-wins"), modalTotalMatches: document.querySelector("#modal-total-matches"),
  download: document.querySelector("#action-download"), whatsapp: document.querySelector("#action-whatsapp"), instagram: document.querySelector("#action-insta"), feedback: document.querySelector("#share-feedback")
};

const state = {
  board: [], level: 1, size: 3, winLength: 3, mode: "single", difficulty: "easy",
  currentPlayer: HUMAN, isGameOver: false, isBotThinking: false, winningCells: [], gameId: 0,
  isReady: false, names: { X: "", O: "Bot" }, scores: { X: 0, O: 0, draws: 0 }, shareBackground: "images/a.webp"
};

function applyConfiguration() {
  state.level = Number(elements.level.value);
  state.mode = elements.mode.value;
  state.difficulty = elements.difficulty.value;
  const config = LEVELS[state.level];
  state.size = config.size;
  state.winLength = config.winLength;
  elements.levelNote.textContent = config.label;
  elements.difficultyWrap.hidden = state.mode !== "single";
  elements.oNameWrap.hidden = state.mode !== "two-player";
  elements.boardHint.hidden = state.mode !== "single";
}

function prepareGame() {
  state.gameId += 1;
  applyConfiguration();
  state.board = Array(state.size * state.size).fill("");
  state.currentPlayer = HUMAN;
  state.isGameOver = false;
  state.isBotThinking = false;
  state.winningCells = [];
  renderBoard();
  updateStatus("Enter player name" + (state.mode === "two-player" ? "s, then start the game." : " and start the game."));
}

function startNewGame() {
  const xName = elements.xName.value.trim();
  const oName = elements.oName.value.trim();
  if (!xName || (state.mode === "two-player" && !oName)) {
    updateStatus(state.mode === "two-player" ? "Please enter names for X and O before starting." : "Please enter your X player name before starting.");
    (xName ? elements.oName : elements.xName).focus();
    return;
  }
  state.names.X = xName;
  state.names.O = state.mode === "two-player" ? oName : "Bot";
  state.isReady = true;
  state.gameId += 1;
  state.board = Array(state.size * state.size).fill("");
  state.currentPlayer = HUMAN;
  state.isGameOver = false;
  state.isBotThinking = false;
  state.winningCells = [];
  renderBoard();
  renderScoreboard();
  updateStatus(`${state.names.X} starts as X — place your mark.`);
}

function renderBoard() {
  elements.board.style.setProperty("--grid-size", state.size);
  elements.board.setAttribute("aria-rowcount", state.size);
  elements.board.setAttribute("aria-colcount", state.size);
  elements.board.replaceChildren();
  const cells = document.createDocumentFragment();
  state.board.forEach((mark, index) => cells.append(createCell(index, mark)));
  elements.board.append(cells);
}

function createCell(index, mark) {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = "game-cell";
  cell.dataset.index = index;
  cell.setAttribute("role", "gridcell");
  cell.setAttribute("aria-rowindex", String(Math.floor(index / state.size) + 1));
  cell.setAttribute("aria-colindex", String((index % state.size) + 1));
  updateCell(cell, index, mark);
  return cell;
}

function updateCell(cell, index, mark) {
  const row = Math.floor(index / state.size) + 1;
  const column = (index % state.size) + 1;
  cell.textContent = mark;
  cell.classList.toggle("is-x", mark === HUMAN);
  cell.classList.toggle("is-o", mark === BOT);
  cell.classList.toggle("is-winning", state.winningCells.includes(index));
  cell.disabled = !state.isReady || Boolean(mark) || state.isGameOver || state.isBotThinking;
  cell.setAttribute("aria-label", `Row ${row}, column ${column}, ${mark || "empty"}`);
}

function refreshCells() {
  elements.board.querySelectorAll(".game-cell").forEach((cell) => updateCell(cell, Number(cell.dataset.index), state.board[Number(cell.dataset.index)]));
}

function updateStatus(message) {
  elements.status.textContent = message;
  elements.liveRegion.textContent = message;
}

function handleBoardClick(event) {
  const cell = event.target.closest(".game-cell");
  if (!cell || !elements.board.contains(cell) || state.isGameOver || state.isBotThinking) return;
  const index = Number(cell.dataset.index);
  if (!isValidMove(index) || (state.mode === "single" && state.currentPlayer !== HUMAN)) return;
  playMove(index);
}

function isValidMove(index) {
  return Number.isInteger(index) && index >= 0 && index < state.board.length && state.board[index] === "";
}

function playMove(index) {
  if (!isValidMove(index)) return false;
  const player = state.currentPlayer;
  state.board[index] = player;
  const cell = elements.board.querySelector(`[data-index="${index}"]`);
  updateCell(cell, index, player);
  const winner = getWinner(state.board, state.size, state.winLength, index);
  if (winner) {
    state.isGameOver = true;
    state.winningCells = winner.cells;
    refreshCells();
    recordResult(winner.player);
    updateStatus(`${state.names[winner.player]} (${winner.player}) wins the round!`);
    return true;
  }
  if (isBoardFull(state.board)) {
    state.isGameOver = true;
    refreshCells();
    recordResult("draw");
    updateStatus("It’s a draw — beautifully balanced.");
    return true;
  }
  state.currentPlayer = player === HUMAN ? BOT : HUMAN;
  if (state.mode === "single" && state.currentPlayer === BOT) scheduleBotMove();
  else updateStatus(`${state.names[state.currentPlayer]} (${state.currentPlayer})’s turn — make a move.`);
  return true;
}

function isBoardFull(board) { return board.every(Boolean); }
function toIndex(row, column, size) { return row * size + column; }
function inBounds(row, column, size) { return row >= 0 && row < size && column >= 0 && column < size; }

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

function scheduleBotMove() {
  state.isBotThinking = true;
  refreshCells();
  updateStatus("Bot is thinking… your next turn will unlock as soon as O moves.");
  const gameId = state.gameId;
  window.setTimeout(() => {
    if (gameId !== state.gameId || state.isGameOver || state.currentPlayer !== BOT) return;
    const move = chooseBotMove();
    state.isBotThinking = false;
    refreshCells();
    if (move !== null) playMove(move);
  }, 360);
}

function recordResult(result) {
  if (result === "draw") state.scores.draws += 1;
  else {
    state.scores[result] += 1;
    state.scores[result === HUMAN ? BOT : HUMAN] += 0;
  }
  renderScoreboard(result);
}

function renderScoreboard(result) {
  elements.scoreXName.textContent = state.names.X || "X player";
  elements.scoreOName.textContent = state.names.O;
  elements.scoreXWins.textContent = String(state.scores.X);
  elements.scoreOWins.textContent = String(state.scores.O);
  elements.scoreXLosses.textContent = String(state.scores.O);
  elements.scoreOLosses.textContent = String(state.scores.X);
  elements.drawCount.textContent = `Draws: ${state.scores.draws}`;
}

function populateShareCard() {
  elements.modalNameX.textContent = state.names.X || "X player";
  elements.modalNameO.textContent = state.names.O || "Bot";
  elements.modalWinsX.textContent = String(state.scores.X);
  elements.modalWinsO.textContent = String(state.scores.O);
  elements.modalDraws.textContent = String(state.scores.draws);
  elements.modalTotalWins.textContent = String(state.scores.X + state.scores.O);
  elements.modalTotalMatches.textContent = String(state.scores.X + state.scores.O + state.scores.draws);
}

function openShareModal() {
  const candidates = SHARE_BACKGROUNDS.filter((image) => image !== state.shareBackground);
  state.shareBackground = candidates[Math.floor(Math.random() * candidates.length)] || SHARE_BACKGROUNDS[0];
  document.querySelector("#share-canvas-target").style.setProperty("--share-background", `url("${state.shareBackground}")`);
  populateShareCard();
  elements.feedback.textContent = "";
  elements.shareModal.classList.remove("hidden");
  elements.shareModal.classList.add("visible");
  elements.closeModal.focus();
}

function closeShareModal() {
  elements.shareModal.classList.add("hidden");
  elements.shareModal.classList.remove("visible");
  elements.shareButton.focus();
}

async function drawShareCanvas() {
  const target = document.querySelector("#share-canvas-target");
  const bounds = target.getBoundingClientRect();
  const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bounds.width * scale);
  canvas.height = Math.round(bounds.height * scale);
  const context = canvas.getContext("2d");
  context.scale(scale, scale);
  const width = bounds.width;
  const height = bounds.height;
  const xName = elements.modalNameX.textContent || "X player";
  const oName = elements.modalNameO.textContent || "Bot";
  const xWins = elements.modalWinsX.textContent || "0";
  const oWins = elements.modalWinsO.textContent || "0";

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#21115c"); gradient.addColorStop(.52, "#5126a8"); gradient.addColorStop(1, "#182c8b");
  context.fillStyle = gradient; context.fillRect(0, 0, width, height);
  try {
    const background = await loadCanvasImage(state.shareBackground);
    context.globalAlpha = .3;
    drawCoverImage(context, background, width, height);
    context.globalAlpha = 1;
    context.fillStyle = "rgba(16, 8, 70, .48)"; context.fillRect(0, 0, width, height);
  } catch { /* Gradient fallback retains a complete share card. */ }
  context.fillStyle = "#ffdd77"; context.textAlign = "center"; context.font = `800 ${Math.max(10, width * .026)}px system-ui, sans-serif`;
  context.fillText("VIBE TIC-TAC-TOE", width / 2, height * .075);
  context.fillStyle = "#ffffff"; context.font = `800 ${Math.max(23, width * .065)}px system-ui, sans-serif`;
  context.fillText("Match Statistics", width / 2, height * .16);
  const sideWidth = width * .31; const sideHeight = height * .42; const sideY = height * .27;
  drawStatPanel(context, width * .08, sideY, sideWidth, sideHeight, "#fff0eb", "#c84e44", "X", xName, xWins);
  drawStatPanel(context, width * .61, sideY, sideWidth, sideHeight, "#eeeaff", "#5141c9", "O", oName, oWins);
  context.fillStyle = "#162033"; context.beginPath(); context.arc(width / 2, sideY + sideHeight / 2, width * .052, 0, Math.PI * 2); context.fill();
  context.fillStyle = "white"; context.font = `800 ${Math.max(10, width * .027)}px system-ui, sans-serif`; context.fillText("VS", width / 2, sideY + sideHeight / 2 + 4);
  context.fillStyle = "rgba(20,18,83,.62)"; roundRect(context, width * .12, height * .79, width * .76, height * .1, 12); context.fill();
  context.fillStyle = "#ffffff"; context.font = `800 ${Math.max(13, width * .036)}px system-ui, sans-serif`; context.fillText(`DRAWS: ${elements.modalDraws.textContent}`, width / 2, height * .855);
  return canvas;
}

function loadCanvasImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function drawCoverImage(context, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawStatPanel(context, x, y, width, height, background, color, mark, name, wins) {
  context.fillStyle = background; roundRect(context, x, y, width, height, 18); context.fill();
  context.fillStyle = color; context.beginPath(); context.arc(x + width / 2, y + height * .23, Math.min(width, height) * .15, 0, Math.PI * 2); context.fill();
  context.fillStyle = "white"; context.textAlign = "center"; context.font = `900 ${Math.max(20, width * .24)}px system-ui, sans-serif`; context.fillText(mark, x + width / 2, y + height * .28);
  context.fillStyle = "#162033"; context.font = `800 ${Math.max(12, width * .11)}px system-ui, sans-serif`; context.fillText(name.slice(0, 14), x + width / 2, y + height * .55);
  context.fillStyle = color; context.font = `900 ${Math.max(30, width * .32)}px system-ui, sans-serif`; context.fillText(wins, x + width / 2, y + height * .78);
  context.fillStyle = "#657089"; context.font = `700 ${Math.max(9, width * .075)}px system-ui, sans-serif`; context.fillText("WINS", x + width / 2, y + height * .91);
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath(); context.roundRect(x, y, width, height, radius); context.closePath();
}

async function downloadScorecard() {
  const canvas = await drawShareCanvas();
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "vibe-tic-tac-toe-scorecard.png";
  link.click();
  elements.feedback.textContent = "Scorecard image downloaded.";
}

async function shareScorecard(destination) {
  const canvas = await drawShareCanvas();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const file = new File([blob], "vibe-tic-tac-toe-scorecard.png", { type: "image/png" });
  const shareData = { title: "My Vibe Tic-Tac-Toe scorecard", text: `My match results — ${destination}`, files: [file] };
  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
    try { await navigator.share(shareData); elements.feedback.textContent = "Share sheet opened."; return; }
    catch (error) { if (error.name === "AbortError") return; }
  }
  try { await navigator.clipboard.writeText(window.location.href); elements.feedback.textContent = "Sharing is unavailable here — the game link was copied."; }
  catch { elements.feedback.textContent = "Sharing is unavailable in this browser. Copy this page's link to share it."; }
}

function availableMoves(board = state.board) {
  return board.reduce((moves, mark, index) => { if (!mark) moves.push(index); return moves; }, []);
}

function chooseBotMove() {
  const moves = availableMoves();
  if (!moves.length) return null;
  if (state.difficulty === "easy") return moves[Math.floor(Math.random() * moves.length)];
  return state.size === 3 ? getMinimaxMove() : getTacticalMove(moves);
}

function getMinimaxMove() {
  let bestScore = -Infinity;
  let bestMove = null;
  for (const move of availableMoves()) {
    state.board[move] = BOT;
    const score = minimax(state.board, false, 0, -Infinity, Infinity, move);
    state.board[move] = "";
    if (score > bestScore) { bestScore = score; bestMove = move; }
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
    for (const move of moves) { board[move] = BOT; best = Math.max(best, minimax(board, false, depth + 1, alpha, beta, move)); board[move] = ""; alpha = Math.max(alpha, best); if (beta <= alpha) break; }
    return best;
  }
  let best = Infinity;
  for (const move of moves) { board[move] = HUMAN; best = Math.min(best, minimax(board, true, depth + 1, alpha, beta, move)); board[move] = ""; beta = Math.min(beta, best); if (beta <= alpha) break; }
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
      const line = collectDirection(state.board, state.size, row, column, rowDelta, columnDelta, BOT).length + collectDirection(state.board, state.size, row, column, -rowDelta, -columnDelta, BOT).length + 1;
      score += line * line;
    }
    state.board[move] = "";
    if (score > bestScore) { bestScore = score; bestMoves = [move]; }
    else if (score === bestScore) bestMoves.push(move);
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

elements.board.addEventListener("click", handleBoardClick);
elements.restart.addEventListener("click", startNewGame);
elements.start.addEventListener("click", startNewGame);
elements.mode.addEventListener("change", () => { state.isReady = false; prepareGame(); });
elements.difficulty.addEventListener("change", () => { state.isReady = false; prepareGame(); });
elements.level.addEventListener("change", () => { state.isReady = false; prepareGame(); });
elements.shareButton.addEventListener("click", openShareModal);
elements.closeModal.addEventListener("click", closeShareModal);
elements.shareModal.addEventListener("click", (event) => { if (event.target === elements.shareModal) closeShareModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !elements.shareModal.classList.contains("hidden")) closeShareModal(); });
elements.download.addEventListener("click", downloadScorecard);
elements.whatsapp.addEventListener("click", () => shareScorecard("WhatsApp Status"));
elements.instagram.addEventListener("click", () => shareScorecard("Instagram Story"));
prepareGame();
renderScoreboard();
