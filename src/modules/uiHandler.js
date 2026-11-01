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

  // Resolve share backgrounds at runtime — prefer base64 globals (CORS-safe) over path strings
  function resolveShareBackgrounds() {
    const fromConstants = Constants.SHARE_BACKGROUNDS;
    if (fromConstants && fromConstants.length) {
      // Re-resolve: if the global VIBE_BG_* vars are now loaded, replace path strings with data URIs
      return fromConstants.map((bg, idx) => {
        const keys = ["A", "B", "C", "D"];
        return global[`VIBE_BG_${keys[idx]}`] || bg;
      });
    }
    return [
      global.VIBE_BG_A || "assets/images/a.webp",
      global.VIBE_BG_B || "assets/images/b.webp",
      global.VIBE_BG_C || "assets/images/c.webp",
      global.VIBE_BG_D || "assets/images/d.webp"
    ];
  }

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
      const SHARE_BACKGROUNDS = resolveShareBackgrounds();
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
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
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
      const draws = (this.elements.modalDraws && this.elements.modalDraws.textContent) || "0";
      const totalWins = (this.elements.modalTotalWins && this.elements.modalTotalWins.textContent) || "0";
      const totalMatches = (this.elements.modalTotalMatches && this.elements.modalTotalMatches.textContent) || "0";

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#100d32");
      gradient.addColorStop(0.5, "#342078");
      gradient.addColorStop(1, "#101a4c");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      try {
        const background = await this.loadCanvasImage(state.shareBackground);
        context.globalAlpha = 0.38;
        this.drawCoverImage(context, background, width, height);
        context.globalAlpha = 1;
      } catch {
        // Fallback
      }

      const shade = context.createLinearGradient(0, 0, 0, height);
      shade.addColorStop(0, "rgba(11, 8, 38, .82)");
      shade.addColorStop(0.5, "rgba(19, 13, 63, .67)");
      shade.addColorStop(1, "rgba(8, 15, 48, .88)");
      context.fillStyle = shade;
      context.fillRect(0, 0, width, height);

      const glow = context.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.42, width * 0.72);
      glow.addColorStop(0, "rgba(125, 94, 255, .2)");
      glow.addColorStop(1, "rgba(125, 94, 255, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      const inset = Math.max(9, width * 0.018);
      this.roundRect(context, inset, inset, width - inset * 2, height - inset * 2, Math.max(16, width * 0.035));
      context.strokeStyle = "rgba(255, 255, 255, .28)";
      context.lineWidth = 1;
      context.stroke();

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#ffda74";
      context.font = `700 ${Math.max(10, width * 0.022)}px 'Segoe UI', Inter, system-ui, sans-serif`;
      context.fillText("✦  VIBE GAMES  •  ARCADE CLUB  ✦", width / 2, height * 0.075);

      context.fillStyle = "#ffffff";
      context.font = `800 ${Math.max(22, width * 0.058)}px 'Crackman', Impact, 'Arial Black', sans-serif`;
      context.fillText("MATCH STATISTICS", width / 2, height * 0.155, width * 0.84);

      context.fillStyle = "rgba(237, 235, 255, .82)";
      context.font = `500 ${Math.max(10, width * 0.022)}px 'Segoe UI', Inter, system-ui, sans-serif`;
      context.fillText("YOUR SESSION AT A GLANCE", width / 2, height * 0.215);

      const sideWidth = width * 0.35;
      const sideHeight = height * 0.37;
      const sideY = height * 0.275;

      this.drawStatPanel(context, width * 0.065, sideY, sideWidth, sideHeight, "#fff4ef", "#d84f52", "X", xName, xWins);
      this.drawStatPanel(context, width * 0.585, sideY, sideWidth, sideHeight, "#f0edff", "#6250e8", "O", oName, oWins);

      context.save();
      context.shadowColor = "rgba(5, 5, 28, .55)";
      context.shadowBlur = width * 0.035;
      context.fillStyle = "#171438";
      context.beginPath();
      context.arc(width / 2, sideY + sideHeight / 2, width * 0.047, 0, Math.PI * 2);
      context.fill();
      context.restore();
      context.beginPath();
      context.arc(width / 2, sideY + sideHeight / 2, width * 0.047, 0, Math.PI * 2);
      context.strokeStyle = "rgba(255, 218, 116, .72)";
      context.lineWidth = Math.max(1.5, width * 0.003);
      context.stroke();

      context.fillStyle = "#ffffff";
      context.font = `800 ${Math.max(10, width * 0.024)}px 'Segoe UI', Inter, system-ui, sans-serif`;
      context.fillText("VS", width / 2, sideY + sideHeight / 2);

      const railX = width * 0.075;
      const railY = height * 0.695;
      const railWidth = width * 0.85;
      const railHeight = height * 0.155;
      this.roundRect(context, railX, railY, railWidth, railHeight, Math.max(12, width * 0.025));
      context.fillStyle = "rgba(12, 10, 48, .76)";
      context.fill();
      context.strokeStyle = "rgba(255, 255, 255, .2)";
      context.lineWidth = 1;
      context.stroke();

      const metrics = [
        ["TOTAL WINS", totalWins],
        ["DRAWS", draws],
        ["MATCHES", totalMatches]
      ];
      const columnWidth = railWidth / metrics.length;
      metrics.forEach(([label, value], index) => {
        const centerX = railX + columnWidth * (index + 0.5);
        if (index > 0) {
          context.beginPath();
          context.moveTo(railX + columnWidth * index, railY + railHeight * 0.22);
          context.lineTo(railX + columnWidth * index, railY + railHeight * 0.78);
          context.strokeStyle = "rgba(255, 255, 255, .18)";
          context.lineWidth = 1;
          context.stroke();
        }
        context.fillStyle = "#c8c2ee";
        context.font = `700 ${Math.max(8, width * 0.017)}px 'Segoe UI', Inter, system-ui, sans-serif`;
        context.fillText(label, centerX, railY + railHeight * 0.34);
        context.fillStyle = index === 1 ? "#ffda74" : "#ffffff";
        context.font = `800 ${Math.max(16, width * 0.045)}px 'Segoe UI', Inter, system-ui, sans-serif`;
        context.fillText(value, centerX, railY + railHeight * 0.69);
      });

      context.fillStyle = "rgba(237, 235, 255, .72)";
      context.font = `600 ${Math.max(8, width * 0.016)}px 'Segoe UI', Inter, system-ui, sans-serif`;
      context.fillText("PLAY  •  COMPETE  •  REPEAT", width / 2, height * 0.925);

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
      context.save();
      context.shadowColor = "rgba(5, 5, 30, .3)";
      context.shadowBlur = width * 0.09;
      context.shadowOffsetY = height * 0.025;
      context.fillStyle = background;
      this.roundRect(context, x, y, width, height, Math.max(14, width * 0.075));
      context.fill();
      context.restore();

      this.roundRect(context, x, y, width, height, Math.max(14, width * 0.075));
      context.strokeStyle = "rgba(255, 255, 255, .88)";
      context.lineWidth = Math.max(1, width * 0.006);
      context.stroke();

      context.fillStyle = color;
      this.roundRect(context, x + width * 0.12, y + height * 0.075, width * 0.76, Math.max(2, height * 0.012), height);
      context.fill();

      context.fillStyle = "#73708c";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `700 ${Math.max(8, width * 0.065)}px 'Segoe UI', Inter, system-ui, sans-serif`;
      context.fillText(`PLAYER ${mark}`, x + width / 2, y + height * 0.15);

      context.fillStyle = color;
      context.beginPath();
      context.arc(x + width / 2, y + height * 0.34, Math.min(width, height) * 0.145, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "white";
      context.font = `900 ${Math.max(22, width * 0.26)}px 'Crackman', Impact, 'Arial Black', sans-serif`;
      context.fillText(mark, x + width / 2, y + height * 0.34, width * 0.25);

      context.fillStyle = "#162033";
      context.font = `700 ${Math.max(12, width * 0.105)}px 'Awesome', Inter, system-ui, sans-serif`;
      context.fillText(name.slice(0, 18), x + width / 2, y + height * 0.59, width * 0.84);

      context.fillStyle = color;
      context.font = `900 ${Math.max(32, width * 0.34)}px 'Crackman', Impact, 'Arial Black', sans-serif`;
      context.fillText(wins, x + width / 2, y + height * 0.79, width * 0.72);

      context.fillStyle = "#73708c";
      context.font = `700 ${Math.max(8, width * 0.065)}px 'Segoe UI', Inter, system-ui, sans-serif`;
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
