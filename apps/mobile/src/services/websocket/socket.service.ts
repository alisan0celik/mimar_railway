import { io, Socket } from "socket.io-client";

import { getAccessToken } from "../auth/token-storage";
import { getServerBaseUrl } from "../config/server-url";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private connecting = false;

  async connect(_userId: string) {
    if (this.socket?.connected || this.connecting) return;

    const token = await getAccessToken();
    if (!token) return;

    this.connecting = true;
    const baseUrl = getServerBaseUrl();

    this.socket = io(`${baseUrl}/notifications`, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      this.connecting = false;
    });

    this.socket.on("disconnect", () => {
      this.connecting = false;
    });

    this.socket.on("connect_error", () => {
      this.connecting = false;
    });

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback as (...args: unknown[]) => void);
      });
    });
  }

  disconnect() {
    this.connecting = false;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback as (...args: unknown[]) => void);
    }
  }

  off(event: string, callback: (...args: unknown[]) => void) {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }

  emit(event: string, ...args: unknown[]) {
    this.socket?.emit(event, ...args);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
