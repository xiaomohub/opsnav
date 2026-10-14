import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import { config } from "./lib/config";
import { getDb } from "./lib/db";
import { handleSshWebSocket } from "./lib/ssh-ws";

// Custom server is stable with Next in production mode (dev mode triggers ALS issues on Node 22).
const dev = false;
const hostname = config.host();
const port = config.port();

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  getDb();
  console.log(`[server] Database ready at ${config.databasePath()}`);
  console.log(`[server] SSH_DEMO_MODE=${config.sshDemoMode()}`);

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const pathname = parse(req.url ?? "").pathname ?? "";
    if (pathname === "/api/ws/ssh") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws, req) => {
    void handleSshWebSocket(ws, req);
  });

  server.listen(port, hostname, () => {
    console.log(`[server] OpsNav listening on http://${hostname}:${port}`);
  });
});
