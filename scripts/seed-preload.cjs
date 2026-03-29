/**
 * Preload shim for seed scripts run via tsx outside Next.js.
 * Mocks the `server-only` guard so imports that include it don't crash.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Module = require("module");
const originalLoad = Module._load;

Module._load = function (request, ...args) {
  if (request === "server-only") return {};
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return originalLoad.apply(this, [request, ...args]);
};
