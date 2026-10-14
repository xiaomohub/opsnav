import { NavList } from "@/components/NavList";
import { PageHeader } from "@/components/layout/PageHeader";
import { listNavEntries } from "@/lib/nav/repository";

export const dynamic = "force-dynamic";

export default async function PublicNavPage() {
  const items = await listNavEntries();

  return (
    <>
      <PageHeader
        title="站点导航"
        description="公开书签列表，无需登录即可访问。"
      />
      <div className="panel">
        <NavList items={items} />
      </div>
    </>
  );
}
