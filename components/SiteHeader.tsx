import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="logo" href="/">OpsNav</Link>
      <nav>
        <Link href="/nav">导航</Link>
        <Link href="/manage/nav">管理导航</Link>
        <Link href="/assets">资产</Link>
        <Link href="/manage/totp">TOTP</Link>
        <Link href="/login">登录</Link>
      </nav>
    </header>
  );
}
