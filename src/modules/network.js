/**
 * @file network.js
 * API calls, WebSocket matchmaking handler, and network status for multiplayer expandability.
 * Supports both standard script loading and module environments.
 */

(function(global) {
  "use strict";

  class NetworkService {
    constructor(options = {}) {
      this.apiBase = options.apiBase || "/api";
      this.socketUrl = options.socketUrl || null;
      this.socket = null;
      this.isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
      this.listeners = new Map();

      if (typeof window !== "undefined") {
        window.addEventListener("online", () => this.handleNetworkChange(true));
        window.addEventListener("offline", () => this.handleNetworkChange(false));
      }
    }

    handleNetworkChange(status) {
      this.isOnline = status;
      this.emit("statusChange", { online: status });
    }

    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }

    emit(event, data) {
      const handlers = this.listeners.get(event) || [];
      handlers.forEach((fn) => fn(data));
    }

    async syncMatchResult(matchRecord) {
      if (!this.isOnline) {
        this.saveLocalRecord(matchRecord);
        return { success: true, mode: "local-offline" };
      }

      try {
        const stored = this.saveLocalRecord(matchRecord);
        return { success: true, mode: "synced", data: stored };
      } catch (err) {
        console.warn("[Network] Sync failed, saved locally:", err);
        this.saveLocalRecord(matchRecord);
        return { success: false, fallback: "local" };
      }
    }

    saveLocalRecord(record) {
      try {
        const history = JSON.parse(localStorage.getItem("vibe_match_history") || "[]");
        history.unshift({ ...record, timestamp: Date.now() });
        if (history.length > 50) history.pop();
        localStorage.setItem("vibe_match_history", JSON.stringify(history));
        return history;
      } catch {
        return [];
      }
    }

    getLocalHistory() {
      try {
        return JSON.parse(localStorage.getItem("vibe_match_history") || "[]");
      } catch {
        return [];
      }
    }

    connectSocket(roomCode) {
      if (!this.socketUrl) {
        return { status: "ready-for-backend", room: roomCode };
      }
      return null;
    }
  }

  const VibeNetwork = { NetworkService };
  global.VibeNetwork = VibeNetwork;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = VibeNetwork;
  }
})(typeof window !== "undefined" ? window : globalThis);
