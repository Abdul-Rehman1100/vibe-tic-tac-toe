/**
 * @file uiHandler.js
 * DOM interaction, board rendering, cell updates, scorecard canvas generation, and event listeners.
 * Supports both standard script loading and module environments.
 */

(function(global) {
  "use strict";

  const Constants = global.VibeConstants || {};
  const HUMAN = Constants.HUMAN || "X";
  const BOT = Constants.BOT || "O";
  const SHARE_BACKGROUNDS = Constants.SHARE_BACKGROUNDS || [
    "assets/images/a.webp",
    "assets/images/b.webp",
    "assets/images/c.webp",
    "assets/images/d.webp"
  ];

  const Engine = global.VibeState || {};
  const state = Engine.state;

  class UIHandler {
    constructor() {
      this.elements = {};
    }

    bindElements() {
      this.elements = {
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
        scoreXName: document.querySelector("#score-x-name"),
        scoreOName: document.querySelector("#score-o-name"),
        scoreXWins: document.querySelector("#score-x-wins"),
        scoreOWins: document.querySelector("#score-o-wins"),
        scoreXLosses: document.querySelector("#score-x-losses"),
        scoreOLosses: document.querySelector("#score-o-losses"),
        drawCount: document.querySelector("#draw-count"),
        shareButton: document.querySelector("#share-scorecard-btn"),
        shareModal: document.querySelector("#share-modal"),
        closeModal: document.querySelector(".close-modal-btn"),
        modalNameX: document.querySelector("#modal-name-x"),
        modalNameO: document.querySelector("#modal-name-o"),
        modalWinsX: document.querySelector("#modal-wins-x"),
        modalWinsO: document.querySelector("#modal-wins-o"),
        modalDraws: document.querySelector("#modal-draws-val"),
        modalTotalWins: document.querySelector("#modal-total-wins"),
        modalTotalMatches: document.querySelector("#modal-total-matches"),
        download: document.querySelector("#action-download"),
        whatsapp: document.querySelector("#action-whatsapp"),
        instagram: document.querySelector("#action-insta"),
        feedback: document.querySelector("#share-feedback"),
        shareCanvasTarget: document.querySelector("#share-canvas-target")
      };
    }

    init() {
      this.bindElements();
      this.attachEventListeners();
      this.syncConfiguration();
      Engine.prepareGame();
      this.renderBoard();
      this.renderScoreboard();
      this.updateStatus(
        "Enter player name" + (state.mode === "two-player" ? "s, then start the game." : " and start the game.")
      );
    }

    attachEventListeners() {
      const el = this.elements;
      if (el.board) el.board.addEventListener("click", (e) => this.handleBoardClick(e));
      if (el.restart) el.restart.addEventListener("click", () => this.handleStartOrRestart());
      if (el.start) el.start.addEventListener("click", () => this.handleStartOrRestart());

      if (el.mode) {
        el.mode.addEventListener("change", () => {
          state.isReady = false;
          this.syncConfiguration();
          Engine.prepareGame();
          this.renderBoard();
          this.updateStatus(
            "Enter player name" + (state.mode === "two-player" ? "s, then start the game." : " and start the game.")
          );
        });
      }

      if (el.difficulty) {
        el.difficulty.addEventListener("change", () => {
          state.isReady = false;
          this.syncConfiguration();
          Engine.prepareGame();
          this.renderBoard();
        });
      }

      if (el.level) {
        el.level.addEventListener("change", () => {
          state.isReady = false;
          this.syncConfiguration();
          Engine.prepareGame();
          this.renderBoard();
        });
      }

      if (el.shareButton) el.shareButton.addEventListener("click", () => this.openShareModal());
      if (el.closeModal) el.closeModal.addEventListener("click", () => this.closeShareModal());

      if (el.shareModal) {
        el.shareModal.addEventListener("click", (event) => {
          if (event.target === el.shareModal) this.closeShareModal();
        });
      }

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && el.shareModal && !el.shareModal.classList.contains("hidden")) {
          this.closeShareModal();
        }
      });

      if (el.download) el.download.addEventListener("click", () => this.downloadScorecard());
      if (el.whatsapp) el.whatsapp.addEventListener("click", () => this.shareScorecard("WhatsApp Status"));
      if (el.instagram) el.instagram.addEventListener("click", () => this.shareScorecard("Instagram Story"));
    }

    syncConfiguration() {
      const el = this.elements;
      if (!el.level || !el.mode || !el.difficulty) return;

      const levelRules = Engine.applyConfiguration({
        level: el.level.value,
        mode: el.mode.value,
        difficulty: el.difficulty.value
      });

      if (el.levelNote) el.levelNote.textContent = levelRules.label;
      if (el.difficultyWrap) el.difficultyWrap.hidden = state.mode !== "single";
      if (el.oNameWrap) el.oNameWrap.hidden = state.mode !== "two-player";
      if (el.boardHint) el.boardHint.hidden = state.mode !== "single";
    }

    handleStartOrRestart() {
      const el = this.elements;
      let xName = el.xName ? el.xName.value.trim() : "";
      let oName = el.oName ? el.oName.value.trim() : "";

      if (!xName) {
        xName = "Player X";
        if (el.xName) el.xName.value = xName;
      }
      if (state.mode === "two-player" && !oName) {
        oName = "Player O";
        if (el.oName) el.oName.value = oName;
      }

      Engine.startNewGame(xName, oName);
      this.renderBoard();
      this.renderScoreboard();
      this.updateStatus(`${state.names.X} starts as X — place your mark.`);
    }

    renderBoard() {
      const boardEl = this.elements.board;
      if (!boardEl) return;

      boardEl.style.setProperty("--grid-size", state.size);
      boardEl.setAttribute("aria-rowcount", state.size);
      boardEl.setAttribute("aria-colcount", state.size);
      boardEl.replaceChildren();

      const cells = document.createDocumentFragment();
      state.board.forEach((mark, index) => {
        cells.append(this.createCell(index, mark));
      });
      boardEl.append(cells);
    }

    createCell(index, mark) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "game-cell";
      cell.dataset.index = index;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-rowindex", String(Math.floor(index / state.size) + 1));
      cell.setAttribute("aria-colindex", String((index % state.size) + 1));
      this.updateCell(cell, index, mark);
      return cell;
    }

    updateCell(cell, index, mark) {
      const row = Math.floor(index / state.size) + 1;
      const column = (index % state.size) + 1;
      cell.textContent = mark;
      cell.classList.toggle("is-x", mark === HUMAN);
      cell.classList.toggle("is-o", mark === BOT);
      cell.classList.toggle("is-winning", state.winningCells.includes(index));
      cell.disabled = !state.isReady || Boolean(mark) || state.isGameOver || state.isBotThinking;
      cell.setAttribute("aria-label", `Row ${row}, column ${column}, ${mark || "empty"}`);
    }

    refreshCells() {
      const boardEl = this.elements.board;
      if (!boardEl) return;
      boardEl.querySelectorAll(".game-cell").forEach((cell) => {
        const idx = Number(cell.dataset.index);
        this.updateCell(cell, idx, state.board[idx]);
      });
    }

    updateStatus(message) {
      if (this.elements.status) this.elements.status.textContent = message;
      if (this.elements.liveRegion) this.elements.liveRegion.textContent = message;
    }

    handleBoardClick(event) {
      const cell = event.target.closest(".game-cell");
      if (!cell || !this.elements.board.contains(cell)) return;

      // If user hasn't explicitly clicked "Start game" but clicks the board, auto-start!
      if (!state.isReady && !state.isGameOver) {
        this.handleStartOrRestart();
      }

      if (state.isGameOver || state.isBotThinking) return;

      const index = Number(cell.dataset.index);
      if (!Engine.isValidMove(index) || (state.mode === "single" && state.currentPlayer !== HUMAN)) return;

      this.playMove(index);
    }

    playMove(index) {
      if (!Engine.isValidMove(index)) return false;
      const player = state.currentPlayer;
      state.board[index] = player;

      const cell = this.elements.board.querySelector(`[data-index="${index}"]`);
      if (cell) this.updateCell(cell, index, player);

      const winner = Engine.getWinner(state.board, state.size, state.winLength, index);
      if (winner) {
        state.isGameOver = true;
        state.winningCells = winner.cells;
        this.refreshCells();
        Engine.recordResult(winner.player);
        this.renderScoreboard();
        this.updateStatus(`${state.names[winner.player]} (${winner.player}) wins the round!`);
        return true;
      }

      if (Engine.isBoardFull(state.board)) {
        state.isGameOver = true;
        this.refreshCells();
        Engine.recordResult("draw");
        this.renderScoreboard();
        this.updateStatus("It’s a draw — beautifully balanced.");
        return true;
      }

      state.currentPlayer = player === HUMAN ? BOT : HUMAN;
      if (state.mode === "single" && state.currentPlayer === BOT) {
        this.scheduleBotMove();
      } else {
        this.updateStatus(`${state.names[state.currentPlayer]} (${state.currentPlayer})’s turn — make a move.`);
      }
      return true;
    }

    scheduleBotMove() {
      state.isBotThinking = true;
      this.refreshCells();
      this.updateStatus("Bot is thinking… your next turn will unlock as soon as O moves.");
      const gameId = state.gameId;

      window.setTimeout(() => {
        if (gameId !== state.gameId || state.isGameOver || state.currentPlayer !== BOT) return;
        const move = Engine.chooseBotMove();
        state.isBotThinking = false;
        this.refreshCells();
        if (move !== null) {
          this.playMove(move);
        }
      }, 360);
    }

    renderScoreboard() {
      const el = this.elements;
      if (!el.scoreXName) return;
      el.scoreXName.textContent = state.names.X || "X player";
      el.scoreOName.textContent = state.names.O || "Bot";
      el.scoreXWins.textContent = String(state.scores.X);
      el.scoreOWins.textContent = String(state.scores.O);
      el.scoreXLosses.textContent = String(state.scores.O);
      el.scoreOLosses.textContent = String(state.scores.X);
      el.drawCount.textContent = `Draws: ${state.scores.draws}`;
    }

    populateShareCard() {
      const el = this.elements;
      if (el.modalNameX) el.modalNameX.textContent = state.names.X || "X player";
      if (el.modalNameO) el.modalNameO.textContent = state.names.O || "Bot";
      if (el.modalWinsX) el.modalWinsX.textContent = String(state.scores.X);
      if (el.modalWinsO) el.modalWinsO.textContent = String(state.scores.O);
      if (el.modalDraws) el.modalDraws.textContent = String(state.scores.draws);
      if (el.modalTotalWins) el.modalTotalWins.textContent = String(state.scores.X + state.scores.O);
      if (el.modalTotalMatches) {
        el.modalTotalMatches.textContent = String(state.scores.X + state.scores.O + state.scores.draws);
      }
    }

    openShareModal() {
      const candidates = SHARE_BACKGROUNDS.filter((img) => img !== state.shareBackground);
      state.shareBackground = candidates[Math.floor(Math.random() * candidates.length)] || SHARE_BACKGROUNDS[0];

      if (this.elements.shareCanvasTarget) {
        this.elements.shareCanvasTarget.style.setProperty(
          "--share-background",
          `url("${state.shareBackground}")`
        );
      }

      this.populateShareCard();
      if (this.elements.feedback) this.elements.feedback.textContent = "";
      if (this.elements.shareModal) {
        this.elements.shareModal.classList.remove("hidden");
        this.elements.shareModal.classList.add("visible");
      }
      if (this.elements.closeModal) this.elements.closeModal.focus();
    }

    closeShareModal() {
      if (this.elements.shareModal) {
        this.elements.shareModal.classList.add("hidden");
        this.elements.shareModal.classList.remove("visible");
      }
      if (this.elements.shareButton) this.elements.shareButton.focus();
    }

    async drawShareCanvas() {
      const target = this.elements.shareCanvasTarget || document.querySelector("#share-canvas-target");
      const bounds = target.getBoundingClientRect();
      const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bounds.width * scale);
      canvas.height = Math.round(bounds.height * scale);
      const context = canvas.getContext("2d");
      context.scale(scale, scale);

      const width = bounds.width;
      const height = bounds.height;
      const xName = (this.elements.modalNameX && this.elements.modalNameX.textContent) || "X player";
      const oName = (this.elements.modalNameO && this.elements.modalNameO.textContent) || "Bot";
      const xWins = (this.elements.modalWinsX && this.elements.modalWinsX.textContent) || "0";
      const oWins = (this.elements.modalWinsO && this.elements.modalWinsO.textContent) || "0";

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#21115c");
      gradient.addColorStop(0.52, "#5126a8");
      gradient.addColorStop(1, "#182c8b");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      try {
        const background = await this.loadCanvasImage(state.shareBackground);
        context.globalAlpha = 0.3;
        this.drawCoverImage(context, background, width, height);
        context.globalAlpha = 1;
        context.fillStyle = "rgba(16, 8, 70, .48)";
        context.fillRect(0, 0, width, height);
      } catch {
        // Fallback
      }

      context.fillStyle = "#ffdd77";
      context.textAlign = "center";
      context.font = `800 ${Math.max(12, width * 0.03)}px 'Crackman', system-ui, sans-serif`;
      context.fillText("VIBE GAMES ARENA", width / 2, height * 0.075);

      context.fillStyle = "#ffffff";
      context.font = `800 ${Math.max(24, width * 0.068)}px 'Crackman', system-ui, sans-serif`;
      context.fillText("Match Statistics", width / 2, height * 0.16);

      const sideWidth = width * 0.31;
      const sideHeight = height * 0.42;
      const sideY = height * 0.27;

      this.drawStatPanel(context, width * 0.08, sideY, sideWidth, sideHeight, "#fff0eb", "#c84e44", "X", xName, xWins);
      this.drawStatPanel(context, width * 0.61, sideY, sideWidth, sideHeight, "#eeeaff", "#5141c9", "O", oName, oWins);

      context.fillStyle = "#162033";
      context.beginPath();
      context.arc(width / 2, sideY + sideHeight / 2, width * 0.052, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "white";
      context.font = `800 ${Math.max(10, width * 0.027)}px system-ui, sans-serif`;
      context.fillText("VS", width / 2, sideY + sideHeight / 2 + 4);

      context.fillStyle = "rgba(20,18,83,.62)";
      this.roundRect(context, width * 0.12, height * 0.79, width * 0.76, height * 0.1, 12);
      context.fill();

      const drawsText = (this.elements.modalDraws && this.elements.modalDraws.textContent) || "0";
      context.fillStyle = "#ffffff";
      context.font = `800 ${Math.max(13, width * 0.036)}px system-ui, sans-serif`;
      context.fillText(`DRAWS: ${drawsText}`, width / 2, height * 0.855);

      return canvas;
    }

    loadCanvasImage(source) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = source;
      });
    }

    drawCoverImage(context, image, width, height) {
      const scale = Math.max(width / image.width, height / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    }

    drawStatPanel(context, x, y, width, height, background, color, mark, name, wins) {
      context.fillStyle = background;
      this.roundRect(context, x, y, width, height, 18);
      context.fill();

      context.fillStyle = color;
      context.beginPath();
      context.arc(x + width / 2, y + height * 0.23, Math.min(width, height) * 0.15, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "white";
      context.textAlign = "center";
      context.font = `900 ${Math.max(22, width * 0.26)}px 'Crackman', system-ui, sans-serif`;
      context.fillText(mark, x + width / 2, y + height * 0.28);

      context.fillStyle = "#162033";
      context.font = `800 ${Math.max(12, width * 0.11)}px system-ui, sans-serif`;
      context.fillText(name.slice(0, 14), x + width / 2, y + height * 0.55);

      context.fillStyle = color;
      context.font = `900 ${Math.max(32, width * 0.34)}px 'Crackman', system-ui, sans-serif`;
      context.fillText(wins, x + width / 2, y + height * 0.78);

      context.fillStyle = "#657089";
      context.font = `700 ${Math.max(9, width * 0.075)}px system-ui, sans-serif`;
      context.fillText("WINS", x + width / 2, y + height * 0.91);
    }

    roundRect(context, x, y, width, height, radius) {
      context.beginPath();
      context.roundRect(x, y, width, height, radius);
      context.closePath();
    }

    async downloadScorecard() {
      const canvas = await this.drawShareCanvas();
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "vibe-tic-tac-toe-scorecard.png";
      link.click();
      if (this.elements.feedback) this.elements.feedback.textContent = "Scorecard image downloaded.";
    }

    async shareScorecard(destination) {
      const canvas = await this.drawShareCanvas();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], "vibe-tic-tac-toe-scorecard.png", { type: "image/png" });
      const shareData = {
        title: "My Vibe Tic-Tac-Toe scorecard",
        text: `My match results — ${destination}`,
        files: [file]
      };

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        try {
          await navigator.share(shareData);
          if (this.elements.feedback) this.elements.feedback.textContent = "Share sheet opened.";
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
        }
      }

      try {
        await navigator.clipboard.writeText(window.location.href);
        if (this.elements.feedback) {
          this.elements.feedback.textContent = "Sharing is unavailable here — the game link was copied.";
        }
      } catch {
        if (this.elements.feedback) {
          this.elements.feedback.textContent = "Sharing is unavailable in this browser. Copy this page's link to share it.";
        }
      }
    }
  }

  const VibeUIHandler = { UIHandler };
  global.VibeUIHandler = VibeUIHandler;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = VibeUIHandler;
  }
})(typeof window !== "undefined" ? window : globalThis);
