"use client";

import { useParams } from "next/navigation";
import { ProjectView } from "@/components/project-view";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ProjectView id={id} />;
}
