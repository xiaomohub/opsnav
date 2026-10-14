import { TerminalPageClient } from "@/components/TerminalPageClient";

export default async function TerminalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container">
      <h1>Web SSH</h1>
      <p className="muted">资产 ID: {id}（演示模式见环境变量 SSH_DEMO_MODE）</p>
      <TerminalPageClient assetId={id} />
    </div>
  );
}
