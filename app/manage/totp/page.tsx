"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

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
    <>
      <PageHeader
        title="TOTP 二次验证"
        description="访问 Linux 资产前须绑定并验证 TOTP（RFC 6238）。"
      />
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <div className="panel" style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <span className={`badge ${enabled ? "badge-success" : "badge-muted"}`}>
            {enabled ? "已绑定" : "未绑定"}
          </span>
          <span className={`badge ${unlocked ? "badge-success" : "badge-warn"}`}>
            {unlocked ? "已解锁（30 分钟内）" : "未解锁"}
          </span>
        </div>
        {!enabled && (
          <button className="btn btn-primary" type="button" onClick={() => void setup()}>
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
          <button className="btn btn-primary" type="submit">{enabled ? "验证解锁" : "确认绑定"}</button>
        </form>
        {unlocked && (
          <p className="text-muted" style={{ marginTop: "1rem", marginBottom: 0 }}>
            已解锁后可前往 <Link href="/assets">Linux 资产</Link> 管理服务器。
          </p>
        )}
      </div>
    </>
  );
}
