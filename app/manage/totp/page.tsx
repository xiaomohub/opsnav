"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

export default function TotpPage() {
  const [qr, setQr] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadStatus() {
    const res = await fetch("/api/auth/me");
    if (res.status === 401) {
      window.location.href = "/login?from=/manage/totp";
      return;
    }
    const data = await res.json();
    setEnabled(Boolean(data.user?.totpEnabled));
    setUnlocked(Boolean(data.totpUnlocked));
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function setup() {
    setError("");
    const res = await fetch("/api/totp/setup", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "绑定失败");
      return;
    }
    setQr(data.qrDataUrl);
    setMessage("请使用验证器扫描二维码，然后输入 6 位验证码完成绑定。");
  }

  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const token = new FormData(e.currentTarget).get("token");
    const res = await fetch("/api/totp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "验证失败");
      return;
    }
    setMessage(data.bound ? "TOTP 绑定成功。" : "TOTP 验证成功，资产访问已解锁（30 分钟）。");
    setEnabled(true);
    setUnlocked(true);
    setQr(null);
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h1>TOTP 二次验证</h1>
      <p className="muted">访问 Linux 资产前必须绑定并验证 TOTP（RFC 6238）。</p>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      <div className="card">
        <p>
          状态：{enabled ? "已绑定" : "未绑定"} /{" "}
          {unlocked ? "已解锁（30 分钟内）" : "未解锁"}
        </p>
        {!enabled && (
          <button className="btn" type="button" onClick={() => void setup()}>
            生成绑定二维码
          </button>
        )}
        {qr && (
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Image src={qr} alt="TOTP QR" width={220} height={220} unoptimized />
          </div>
        )}
        <form onSubmit={verify} style={{ marginTop: 16 }}>
          <label>6 位验证码</label>
          <input name="token" inputMode="numeric" pattern="[0-9]{6}" required maxLength={6} />
          <button className="btn" type="submit">{enabled ? "验证解锁" : "确认绑定"}</button>
        </form>
      </div>
    </div>
  );
}
