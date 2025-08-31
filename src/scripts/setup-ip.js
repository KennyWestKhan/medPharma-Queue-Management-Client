const os = require("os");
const fs = require("fs");
const path = require("path");

function getLocalIP() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (iface.family === "IPv4" && !iface.internal) {
        if (
          name.toLowerCase().includes("wifi") ||
          name.toLowerCase().includes("wlan") ||
          name.toLowerCase().includes("eth") ||
          name.toLowerCase().includes("en0") ||
          name.toLowerCase().includes("en1")
        ) {
          return iface.address;
        }
      }
    }
  }

  // Fallback: return any non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return "localhost";
}

let configContent = "";
function generateConfig() {
  const localIP = getLocalIP();
  console.log(`Detected IP: ${localIP}`);

  configContent = `// Auto-generated config - DO NOT EDIT MANUALLY Generated on: ${new Date().toISOString()} Detected IP: ${localIP}`;
}

const baseURL = "http://${localIP}:3001";
const BACKEND_CONFIG = {
  development: {
    baseURL,
    socketURL: baseURL,
  },
  production: {
    baseURL: "https://medPharma-backend.com",
    socketURL: "https://medPharma-backend.com",
  },
};

const isDevelopment = typeof __DEV__ !== "undefined" ? __DEV__ : true;

const getCurrentConfig = () => {
  const config = isDevelopment
    ? BACKEND_CONFIG.development
    : BACKEND_CONFIG.production;
  console.log("Using config:", config);
  return config;
};

const SOCKET_CONFIG = {
  transports: ["websocket"],
  autoConnect: false,
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
};

const API_ENDPOINTS = {
  queue: "/api/queue",
  patients: "/api/patients",
  doctors: "/api/doctors",
};

module.exports = {
  BACKEND_CONFIG,
  getCurrentConfig,
  SOCKET_CONFIG,
  API_ENDPOINTS,
};

const configPath = path.join(__dirname, "..", "config", "config.js");

const configDir = path.dirname(configPath);
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

fs.writeFileSync(configPath, configContent);
console.log(`Config file generated at: ${configPath}`);

if (require.main === module) {
  generateConfig();
}

module.exports = { getLocalIP, generateConfig };
