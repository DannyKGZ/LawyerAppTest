"use client";

import { useParams } from "next/navigation";
import { TimelineView } from "@/components/timeline-view";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <TimelineView id={id} />;
}
