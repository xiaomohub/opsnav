import { NavList } from "@/components/NavList";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function PublicNavPage() {
  const items = getDb()
    .prepare(
      `SELECT id, name, url, description FROM nav_entries ORDER BY updated_at DESC`
    )
    .all() as { id: number; name: string; url: string; description: string }[];

  return (
    <div className="container">
      <h1>站点导航</h1>
      <p className="muted">公开列表，无需登录。</p>
      <div className="card">
        <NavList items={items} />
      </div>
    </div>
  );
}
