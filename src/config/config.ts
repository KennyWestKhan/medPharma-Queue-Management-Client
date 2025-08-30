import Constants from "expo-constants";
// @ts-ignore
import { NGROK_URL } from "@env";

// Method 1: Auto-detect using Expo's debugger URL
const getLocalIP = () => {
  if (__DEV__ && Constants.expoConfig?.hostUri) {
    // Extract IP from Expo's debugger URL
    const host = Constants.expoConfig.hostUri.split(":")[0];
    return host;
  }

  // Fallback to manifest URL parsing
  if (__DEV__ && Constants.expoConfig?.debuggerHost) {
    return Constants.expoConfig.debuggerHost.split(":")[0];
  }

  // Another fallback using the manifest URL
  if (__DEV__ && Constants.linkingUri) {
    try {
      const url = new URL(Constants.linkingUri);
      return url.hostname;
    } catch (e) {
      console.warn("Could not parse linking URI:", Constants.linkingUri);
    }
  }

  return "192.168.1.100"; // Your manual fallback
};

const getServerConfig = () => {
  const localIP = /*getLocalIP();*/ NGROK_URL || ""; // Replace with your ngrok URL or local IP
  console.log("Detected local IP:", localIP);

  return {
    development: {
      baseURL: `${localIP}`,
      socketURL: `${localIP}`,
    },
    production: {
      baseURL: "https://medPharma-backend.com",
      socketURL: "https://medPharma-backend.com",
    },
  };
};

export const BACKEND_CONFIG = getServerConfig();

const isDevelopment = __DEV__;

export const getCurrentConfig = () => {
  const config = isDevelopment
    ? BACKEND_CONFIG.development
    : BACKEND_CONFIG.production;
  console.log("Using config:", config);
  return config;
};

export const SOCKET_CONFIG = {
  transports: ["websocket" /*, "polling"*/],
  autoConnect: false,
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
};

export const API_ENDPOINTS = {
  queue: "/api/queue",
  patients: "/api/patients",
  doctors: "/api/doctors",
};
