import Link from "next/link";
import { TerminalPageClient } from "@/components/TerminalPageClient";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function TerminalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader
        title="Web SSH 终端"
        description={`资产 #${id} · 演示模式由环境变量 SSH_DEMO_MODE 控制`}
        actions={
          <Link href="/assets" className="btn btn-secondary btn-sm">返回资产列表</Link>
        }
      />
      <div className="panel" style={{ padding: "1rem" }}>
        <TerminalPageClient assetId={id} />
      </div>
    </>
  );
}
