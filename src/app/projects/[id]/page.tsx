import { ProjectView } from "@/components/project-view";
import { PROJECTS } from "@/lib/fixtures";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectView id={id} />;
}
