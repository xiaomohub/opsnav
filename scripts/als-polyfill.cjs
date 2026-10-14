// Cloud/dev Node builds may omit global AsyncLocalStorage; Next.js App Router requires it.
const { AsyncLocalStorage } = require("node:async_hooks");
if (!globalThis.AsyncLocalStorage) {
  globalThis.AsyncLocalStorage = AsyncLocalStorage;
}
