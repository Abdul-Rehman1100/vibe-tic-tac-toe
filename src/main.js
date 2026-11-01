/**
 * @file main.js
 * App entry controller (imported by index.html).
 * Bootstraps state, UIHandler, Router, 3D Graphics pipeline, and Network service.
 * Supports both standard script loading and module environments.
 */

(function(global) {
  "use strict";

  class App {
    constructor() {
      const UIHandler = global.VibeUIHandler ? global.VibeUIHandler.UIHandler : null;
      const NetworkService = global.VibeNetwork ? global.VibeNetwork.NetworkService : null;
      const GraphicsPipeline = global.VibeGraphics ? global.VibeGraphics.GraphicsPipeline : null;

      if (!UIHandler) {
        console.error("[VibeApp] VibeUIHandler is not defined. Ensure modular scripts are loaded.");
        return;
      }

      this.ui = new UIHandler();
      this.network = NetworkService ? new NetworkService() : null;
      this.graphics = GraphicsPipeline ? new GraphicsPipeline("hero-3d-canvas") : null;
      this.router = null;
    }

    async init() {
      if (!this.ui) return;

      this.setupHeaderScrollState();

      // 1. Initialize UI Handler & DOM bindings
      this.ui.init();

      // 2. Initialize 3D Graphics pipeline in Hero section
      if (this.graphics) {
        await this.graphics.init();
      }

      // 3. Configure Routes & Views
      const Router = global.VibeRouter ? global.VibeRouter.Router : null;
      if (Router) {
        const routes = {
          home: {
            sectionId: "view-home"
          },
          game: {
            sectionId: "view-game",
            templateUrl: "html/game.html"
          },
          dashboard: {
            sectionId: "view-dashboard",
            templateUrl: "html/dashboard.html"
          },
          login: {
            sectionId: "view-login",
            templateUrl: "html/login.html"
          }
        };

        this.router = new Router(routes, {
          container: document.querySelector("#app-view"),
          navLinks: document.querySelectorAll(".nav-link"),
          onViewChange: (route) => this.handleViewChange(route)
        });
      }

      // 4. Attach quick-play & login handlers for secondary views
      this.attachSubViewHandlers();
    }

    setupHeaderScrollState() {
      const header = document.querySelector(".site-header");
      if (!header) return;

      const update = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
      update();
      window.addEventListener("scroll", update, { passive: true });
    }

    handleViewChange(route) {
      if (route === "game") {
        this.ui.bindElements();
        this.ui.syncConfiguration();
        // Render board always — ensures cells are visible even before "Start game" is clicked
        this.ui.renderBoard();
        this.ui.renderScoreboard();
      } else if (route === "dashboard") {
        this.updateDashboardStats();
      } else if (route === "home" && this.graphics) {
        if (!this.graphics.renderer && !this.graphics.animationFrameId) {
          this.graphics.init();
        }
      }
    }

    updateDashboardStats() {
      const StateObj = global.VibeState ? global.VibeState.state : null;
      if (!StateObj) return;

      const totalMatchesEl = document.querySelector("#dash-total-matches");
      const totalWinsEl = document.querySelector("#dash-total-wins");
      const winRateEl = document.querySelector("#dash-win-rate");
      const historyList = document.querySelector("#dash-history-list");

      const totalMatches = StateObj.scores.X + StateObj.scores.O + StateObj.scores.draws;
      const totalWins = StateObj.scores.X;
      const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

      if (totalMatchesEl) totalMatchesEl.textContent = String(totalMatches);
      if (totalWinsEl) totalWinsEl.textContent = String(totalWins);
      if (winRateEl) winRateEl.textContent = `${winRate}%`;

      if (historyList && this.network) {
        const records = this.network.getLocalHistory();
        if (!records.length) {
          historyList.innerHTML = `<li class="empty-hint">No past matches recorded yet. Play a round!</li>`;
        } else {
          historyList.innerHTML = records
            .slice(0, 5)
            .map(
              (r) =>
                `<li><strong>${r.winner ? r.winner + " won" : "Draw"}</strong> &bull; Level ${r.level || 1} &bull; <small>${new Date(r.timestamp).toLocaleTimeString()}</small></li>`
            )
            .join("");
        }
      }
    }

    attachSubViewHandlers() {
      document.addEventListener("click", (e) => {
        const quickPlayBtn = e.target.closest("[data-action='quick-play']");
        if (quickPlayBtn) {
          const level = quickPlayBtn.dataset.level || 1;
          const mode = quickPlayBtn.dataset.mode || "single";
          if (this.ui.elements.level) this.ui.elements.level.value = level;
          if (this.ui.elements.mode) this.ui.elements.mode.value = mode;
          this.ui.syncConfiguration();
          window.location.hash = "#game";
        }

        const guestLoginBtn = e.target.closest("#guest-login-btn");
        if (guestLoginBtn) {
          const nickInput = document.querySelector("#guest-nickname");
          const nickname = nickInput && nickInput.value.trim() ? nickInput.value.trim() : "Player X";
          if (this.ui.elements.xName) this.ui.elements.xName.value = nickname;
          window.location.hash = "#dashboard";
        }
      });
    }
  }

  function bootstrap() {
    const app = new App();
    app.init();
    global.__VIBE_APP__ = app;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }

  const VibeApp = { App, bootstrap };
  global.VibeApp = VibeApp;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = VibeApp;
  }
})(typeof window !== "undefined" ? window : globalThis);
