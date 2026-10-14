"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/nav", label: "站点导航", icon: "◎" },
  { href: "/manage/nav", label: "导航管理", icon: "✎", auth: true },
  { href: "/assets", label: "Linux 资产", icon: "▣", auth: true },
  { href: "/manage/totp", label: "TOTP 验证", icon: "🔐", auth: true },
];

type MeResponse = {
  user: { username: string } | null;
  totpUnlocked?: boolean;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isMinimal = isLogin || pathname === "/";

  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    if (isLogin) return;
    void fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setMe(data as MeResponse))
      .catch(() => setMe({ user: null }));
  }, [pathname, isLogin]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (isMinimal) {
    return (
      <div className="app app--minimal">
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden />
            OpsNav
          </Link>
          <div className="topbar-actions">
            <Link href="/nav" className="topbar-link">导航</Link>
            {me?.user ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
                退出
              </button>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">登录</Link>
            )}
          </div>
        </header>
        <div className="app-content app-content--centered">{children}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/" className="brand brand--sidebar">
          <span className="brand-mark" aria-hidden />
          <div>
            <div className="brand-title">OpsNav</div>
            <div className="brand-sub">运维导航与资产</div>
          </div>
        </Link>
        <nav className="sidebar-nav" aria-label="主菜单">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link${active ? " sidebar-link--active" : ""}`}
              >
                <span className="sidebar-icon" aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          {me?.user ? (
            <>
              <div className="sidebar-user">
                <span className="sidebar-user-name">{me.user.username}</span>
                {me.totpUnlocked ? (
                  <span className="badge badge-success">TOTP 已解锁</span>
                ) : (
                  <span className="badge badge-muted">TOTP 未解锁</span>
                )}
              </div>
              <button type="button" className="btn btn-ghost btn-sm sidebar-logout" onClick={() => void logout()}>
                退出登录
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm sidebar-login">登录</Link>
          )}
        </div>
      </aside>
      <div className="app-main">
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
