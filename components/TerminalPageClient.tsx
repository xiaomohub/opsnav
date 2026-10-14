"use client";

import dynamic from "next/dynamic";

const TerminalClient = dynamic(
  () => import("@/components/TerminalClient").then((m) => m.TerminalClient),
  { ssr: false }
);

export function TerminalPageClient({ assetId }: { assetId: string }) {
  return <TerminalClient assetId={assetId} />;
}
