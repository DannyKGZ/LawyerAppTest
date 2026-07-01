import { TimelineView } from "@/components/timeline-view";
import { DOCUMENTS } from "@/lib/fixtures";

export function generateStaticParams() {
  return DOCUMENTS.map((d) => ({ id: d.id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TimelineView id={id} />;
}
