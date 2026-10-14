import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { authenticator } from "otplib";
import WebSocket from "ws";

const PORT = process.env.SMOKE_PORT ?? "3100";
const BASE = `http://127.0.0.1:${PORT}`;
const DATA_DIR = path.join(process.cwd(), "data", "smoke-" + Date.now());
const DB_PATH = path.join(DATA_DIR, "opsnav.db");

const TOTP_SECRET = "SMOKETESTTOTPSECRET00000000001";

function log(step: string, detail?: string) {
  const line = detail ? `[smoke] ${step}: ${detail}` : `[smoke] ${step}`;
  console.log(line);
}

function fail(message: string): never {
  console.error(`[smoke] FAIL: ${message}`);
  process.exit(1);
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/nav`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(500);
  }
  fail("server did not become ready in time");
}

function parseSetCookie(header: string | null): string[] {
  if (!header) return [];
  return header.split(/,(?=\s*[^;]+=[^;]+)/).map((c) => c.trim());
}

function mergeCookieHeader(existing: string, setCookieHeader: string | null): string {
  const jar = new Map<string, string>();
  for (const part of existing.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  for (const c of parseSetCookie(setCookieHeader)) {
    const kv = c.split(";")[0];
    const eq = kv.indexOf("=");
    if (eq > 0) jar.set(kv.slice(0, eq).trim(), kv.slice(eq + 1).trim());
  }
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const env = {
    ...process.env,
    PORT,
    HOST: "127.0.0.1",
    BASE_URL: BASE,
    DATABASE_PATH: DB_PATH,
    SSH_DEMO_MODE: "true",
    SESSION_SECRET: "smoke-test-session-secret-32chars!!",
    DATA_ENCRYPTION_KEY: "smoke-test-encryption-key-32chars!",
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "changeme",
    SMOKE_TOTP_SECRET: TOTP_SECRET,
    NODE_ENV: "development",
  };

  log("build", "next build + server bundle");
  const build = spawn("npm", ["run", "build"], {
    cwd: process.cwd(),
    env: { ...process.env, ...env, NODE_ENV: "production" },
    stdio: "inherit",
  });
  await new Promise<void>((resolve, reject) => {
    build.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("build failed"))));
  });

  log("start", `spawning server on ${BASE}`);
  const child: ChildProcess = spawn("node", ["--require", "./scripts/als-polyfill.cjs", "dist/server.cjs"], {
    cwd: process.cwd(),
    env: { ...env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (d) => process.stdout.write(d));
  child.stderr?.on("data", (d) => process.stderr.write(d));

  const killChild = () => {
    if (!child.killed) child.kill("SIGTERM");
  };
  process.on("exit", killChild);
  process.on("SIGINT", () => {
    killChild();
    process.exit(1);
  });

  await waitForServer();

  log("nav", "GET /nav");
  const navRes = await fetch(`${BASE}/nav`);
  if (!navRes.ok) fail(`/nav returned ${navRes.status}`);
  const navHtml = await navRes.text();
  if (!navHtml.includes("站点导航")) fail("/nav missing expected content");

  log("login", "POST /api/auth/login");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "changeme" }),
  });
  if (!loginRes.ok) fail(`login failed: ${loginRes.status}`);
  let cookieHeader = mergeCookieHeader("", loginRes.headers.get("set-cookie"));
  if (!cookieHeader) fail("no session cookie from login");

  log("nav-crud", "POST /api/admin/nav");
  const createNav = await fetch(`${BASE}/api/admin/nav`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({
      name: "Smoke Test",
      url: "https://example.com",
      description: "smoke",
    }),
  });
  if (!createNav.ok) fail(`nav create failed: ${createNav.status}`);

  log("totp", "setup + verify");
  const setupRes = await fetch(`${BASE}/api/totp/setup`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
  });
  if (!setupRes.ok) fail(`totp setup failed: ${setupRes.status}`);
  const token = authenticator.generate(TOTP_SECRET);
  const verifyRes = await fetch(`${BASE}/api/totp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ token }),
  });
  if (!verifyRes.ok) fail(`totp verify failed: ${verifyRes.status}`);
  cookieHeader = mergeCookieHeader(cookieHeader, verifyRes.headers.get("set-cookie"));

  log("asset", "POST /api/assets");
  const assetRes = await fetch(`${BASE}/api/assets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({
      name: "demo-server",
      host: "127.0.0.1",
      port: 22,
      username: "root",
      authType: "password",
      password: "not-used-in-demo",
    }),
  });
  if (!assetRes.ok) {
    const err = await assetRes.text();
    fail(`asset create failed: ${assetRes.status} ${err}`);
  }
  const assetJson = (await assetRes.json()) as { id: number };

  log("websocket", "demo terminal");
  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(
      `ws://127.0.0.1:${PORT}/api/ws/ssh?assetId=${assetJson.id}`,
      { headers: { Cookie: cookieHeader } }
    );
    const timer = setTimeout(() => reject(new Error("ws timeout")), 15_000);
    let sawDemo = false;

    ws.on("message", (raw) => {
      const text = raw.toString();
      if (text.includes("演示模式") || text.includes("demo$")) {
        sawDemo = true;
        ws.send(JSON.stringify({ type: "input", data: "help\r" }));
      }
      if (text.includes("可用命令")) {
        clearTimeout(timer);
        ws.close();
        resolve();
      }
    });
    ws.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    ws.on("close", () => {
      if (!sawDemo) {
        clearTimeout(timer);
        reject(new Error("ws closed before demo banner"));
      }
    });
  });

  log("done", "all checks passed");
  killChild();
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
