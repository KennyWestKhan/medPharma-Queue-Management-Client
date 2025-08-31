export const SOCKET_CONFIG = {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  transports: ["websocket", "polling"],
  retries: 3,
  retryOnServerError: false,
};
