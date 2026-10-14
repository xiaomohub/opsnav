"use client";

import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "xterm";
import { useEffect, useRef } from "react";
import "xterm/css/xterm.css";

export function TerminalClient({ assetId }: { assetId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "Menlo, Monaco, Consolas, monospace",
      fontSize: 14,
      theme: { background: "#0f1419" },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    fit.fit();

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${window.location.host}/api/ws/ssh?assetId=${assetId}`);

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as { type: string; data?: string };
        if (msg.type === "output" && msg.data) term.write(msg.data);
      } catch {
        term.write(ev.data as string);
      }
    };

    ws.onopen = () => {
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input", data }));
        }
      });
      term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols, rows }));
        }
      });
    };

    const onResize = () => fit.fit();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ws.close();
      term.dispose();
    };
  }, [assetId]);

  return <div id="terminal-container" ref={containerRef} />;
}
