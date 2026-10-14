import type { IncomingMessage } from "http";
import { Client } from "ssh2";
import type WebSocket from "ws";
import { unsealData } from "iron-session";
import { findUserById } from "./auth";
import { decryptSecret } from "./crypto";
import { getDb, type AssetRow } from "./db";
import { isTotpUnlocked, sessionOptions, type SessionData } from "./session";
import { config } from "./config";

type WsMessage =
  | { type: "resize"; cols: number; rows: number }
  | { type: "input"; data: string };

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(rest.join("="));
  }
  return out;
}

async function getWsSession(req: IncomingMessage): Promise<SessionData | null> {
  const cookies = parseCookies(req.headers.cookie);
  const sealed = cookies[sessionOptions.cookieName];
  if (!sealed) return null;
  try {
    return await unsealData<SessionData>(sealed, {
      password: sessionOptions.password as string,
    });
  } catch {
    return null;
  }
}

function send(ws: WebSocket, data: string) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type: "output", data }));
  }
}

function runDemoShell(ws: WebSocket) {
  let buffer = "";
  send(ws, "\r\n\x1b[32m[演示模式]\x1b[0m OpsNav 模拟终端 (SSH_DEMO_MODE=true)\r\n");
  send(ws, "输入 help 查看命令，exit 断开连接。\r\n\r\n");
  send(ws, "demo$ ");

  ws.on("message", (raw) => {
    let msg: WsMessage;
    try {
      msg = JSON.parse(raw.toString()) as WsMessage;
    } catch {
      return;
    }
    if (msg.type === "resize") return;
    if (msg.type !== "input") return;

    for (const ch of msg.data) {
      if (ch === "\r") {
        const line = buffer.trim();
        buffer = "";
        send(ws, "\r\n");
        if (line === "exit") {
          send(ws, "再见。\r\n");
          ws.close();
          return;
        }
        if (line === "help") {
          send(ws, "可用命令: help, echo <text>, date, uname, exit\r\n");
        } else if (line.startsWith("echo ")) {
          send(ws, line.slice(5) + "\r\n");
        } else if (line === "date") {
          send(ws, new Date().toString() + "\r\n");
        } else if (line === "uname") {
          send(ws, "Linux demo-opsnav 6.12.94+ x86_64 GNU/Linux\r\n");
        } else if (line === "") {
          // noop
        } else {
          send(ws, `demo: 未知命令: ${line}\r\n`);
        }
        send(ws, "demo$ ");
      } else if (ch === "\u007f" || ch === "\b") {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          send(ws, "\b \b");
        }
      } else if (ch >= " " || ch === "\t") {
        buffer += ch;
        send(ws, ch);
      }
    }
  });
}

function runRealSsh(ws: WebSocket, asset: AssetRow) {
  const secret = decryptSecret(asset.secret_encrypted);
  const conn = new Client();

  conn
    .on("ready", () => {
      conn.shell({ term: "xterm-256color" }, (err, stream) => {
        if (err) {
          send(ws, `\r\nSSH shell 错误: ${err.message}\r\n`);
          ws.close();
          conn.end();
          return;
        }
        stream.on("data", (data: Buffer) => send(ws, data.toString("utf8")));
        stream.stderr.on("data", (data: Buffer) => send(ws, data.toString("utf8")));
        ws.on("message", (raw) => {
          let msg: WsMessage;
          try {
            msg = JSON.parse(raw.toString()) as WsMessage;
          } catch {
            return;
          }
          if (msg.type === "input") {
            stream.write(msg.data);
          } else if (msg.type === "resize") {
            stream.setWindow(msg.rows, msg.cols, 0, 0);
          }
        });
        ws.on("close", () => {
          stream.close();
          conn.end();
        });
      });
    })
    .on("error", (err) => {
      send(ws, `\r\nSSH 连接失败: ${err.message}\r\n`);
      ws.close();
    });

  const connectOpts: Record<string, unknown> = {
    host: asset.host,
    port: asset.port,
    username: asset.username,
    readyTimeout: 20000,
  };
  if (asset.auth_type === "password") {
    connectOpts.password = secret;
  } else {
    connectOpts.privateKey = secret;
  }
  conn.connect(connectOpts);
}

export async function handleSshWebSocket(ws: WebSocket, req: IncomingMessage) {
  const url = new URL(req.url ?? "", "http://localhost");
  const assetId = parseInt(url.searchParams.get("assetId") ?? "", 10);

  const session = await getWsSession(req);
  if (!session?.userId) {
    send(ws, "\r\n未登录，请先登录。\r\n");
    ws.close();
    return;
  }

  const user = findUserById(session.userId);
  if (!user?.totp_enabled) {
    send(ws, "\r\n请先绑定并验证 TOTP。\r\n");
    ws.close();
    return;
  }
  if (!isTotpUnlocked(session.totpVerifiedAt)) {
    send(ws, "\r\nTOTP 验证已过期，请重新验证。\r\n");
    ws.close();
    return;
  }

  if (!assetId) {
    send(ws, "\r\n缺少 assetId 参数。\r\n");
    ws.close();
    return;
  }

  const asset = getDb()
    .prepare("SELECT * FROM assets WHERE id = ?")
    .get(assetId) as AssetRow | undefined;
  if (!asset) {
    send(ws, "\r\n资产不存在。\r\n");
    ws.close();
    return;
  }

  if (config.sshDemoMode()) {
    runDemoShell(ws);
    return;
  }

  runRealSsh(ws, asset);
}
