/**
 * @file router.js
 * Handles client navigation and swapping of HTML layouts/views.
 * Supports both standard script loading and module environments.
 */

(function(global) {
  "use strict";

  class Router {
    constructor(routes = {}, options = {}) {
      this.routes = routes;
      this.container = options.container || document.querySelector("#app-view");
      this.navLinks = options.navLinks || document.querySelectorAll(".nav-link");
      this.currentRoute = null;
      this.cache = new Map();
      this.onViewChange = options.onViewChange || null;

      this.init();
    }

    init() {
      window.addEventListener("hashchange", () => this.handleHashChange());
      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => this.handleHashChange());
      } else {
        this.handleHashChange();
      }
    }

    async handleHashChange() {
      const rawHash = window.location.hash.replace(/^#\/?/, "");
      const [primaryHash, anchor] = rawHash.split("#");
      const routeKey = (primaryHash || "home").toLowerCase();

      // Aliases
      let resolvedRoute = routeKey;
      if (routeKey === "" || routeKey === "home") {
        resolvedRoute = "home";
      } else if (routeKey === "game" || routeKey === "play" || routeKey === "arena") {
        resolvedRoute = "game";
      } else if (routeKey === "guide" || routeKey === "how-to-play" || routeKey === "scoreboard") {
        resolvedRoute = "game";
      } else if (routeKey === "about" || routeKey === "featured-games") {
        resolvedRoute = "home";
      }

      await this.navigate(resolvedRoute, anchor || rawHash);
    }

    async navigate(route, targetAnchor = null) {
      const targetRoute = this.routes[route] ? route : "home";
      this.currentRoute = targetRoute;

      // Update active nav links
      this.navLinks.forEach((link) => {
        const href = (link.getAttribute("href") || "").replace(/^#\/?/, "").toLowerCase();
        const isActive =
          href === targetRoute ||
          (targetRoute === "home" && (href === "home" || href === "" || href === "featured-games" || href === "about")) ||
          (targetRoute === "game" && (href === "game" || href === "play"));
        link.classList.toggle("is-active", isActive);
      });

      const routeConfig = this.routes[targetRoute];
      if (!routeConfig) return;

      // Check if in-page section exists
      const inPageSection = document.getElementById(routeConfig.sectionId || `view-${targetRoute}`);
      const allSections = document.querySelectorAll(".app-route-view");

      if (inPageSection) {
        allSections.forEach((sec) => sec.classList.add("hidden"));
        inPageSection.classList.remove("hidden");
      } else if (routeConfig.templateUrl && this.container) {
        const htmlContent = await this.loadTemplate(routeConfig.templateUrl);
        if (htmlContent) {
          this.container.innerHTML = htmlContent;
        }
      }

      // Smooth scroll to anchor if provided
      if (targetAnchor) {
        setTimeout(() => {
          const el = document.getElementById(targetAnchor);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }, 50);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (typeof this.onViewChange === "function") {
        this.onViewChange(targetRoute);
      }
    }

    async loadTemplate(url) {
      if (this.cache.has(url)) {
        return this.cache.get(url);
      }
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        this.cache.set(url, text);
        return text;
      } catch (err) {
        console.warn(`[Router] Could not load external template ${url}:`, err);
        return null;
      }
    }
  }

  const VibeRouter = { Router };
  global.VibeRouter = VibeRouter;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = VibeRouter;
  }
})(typeof window !== "undefined" ? window : globalThis);
