"use client";

import { useRouter } from "next/navigation";
import { Meta } from "@/components/ui-bits";
import { EDITS, DOCUMENTS, PROJECTS, U } from "@/lib/fixtures";
import { ST, TIER, isOpenEdit, isOverdue } from "@/lib/domain";
import type { Edit } from "@/lib/types";

const COL = "grid grid-cols-[1fr_150px_190px_160px] gap-4";

type Kind = "blockers" | "my";

const KINDS: Record<Kind, { title: string; subtitle: string; empty: string; filter: (e: Edit) => boolean }> = {
  blockers: {
    title: "Блокеры",
    subtitle: "Открытые правки вне компетенции — решение принимает команда/руководство.",
    empty: "Блокеров нет.",
    filter: (e) => e.tier === "blocker" && isOpenEdit(e),
  },
  my: {
    title: "Мои правки",
    subtitle: "Правки в работе — на рассмотрении и на доработке.",
    empty: "Открытых правок нет.",
    filter: (e) => isOpenEdit(e),
  },
};

export function EditsListView({ kind }: { kind: Kind }) {
  const router = useRouter();
  const cfg = KINDS[kind];
  const rows = EDITS.filter(cfg.filter).map((e) => {
    const doc = DOCUMENTS.find((d) => d.id === e.docId);
    const proj = doc ? PROJECTS.find((p) => p.id === doc.projectId) : undefined;
    return { e, doc, proj };
  });

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{cfg.title}</h1>
      <p className="mt-0.5 mb-5 text-sm text-muted-foreground">{cfg.subtitle}</p>

      <div className="overflow-hidden rounded-lg border">
        <div className={`${COL} border-b bg-muted/50 px-4 py-2.5 text-[11px] uppercase tracking-wide text-muted-foreground`}>
          <div>Пункт</div>
          <div>Ответственный</div>
          <div>Уровень</div>
          <div>Статус</div>
        </div>
        {rows.length === 0 && <div className="px-4 py-10 text-center text-sm text-muted-foreground">{cfg.empty}</div>}
        {rows.map(({ e, doc, proj }) => (
          <div
            key={e.id}
            onClick={() => doc && router.push(`/documents/${doc.id}`)}
            className={`${COL} cursor-pointer items-center border-b px-4 py-3 text-sm last:border-0 hover:bg-muted/50`}
          >
            <div className="min-w-0">
              <div className="truncate font-medium">
                {e.clause}
                {isOverdue(e) && <span className="ml-2 text-[11px] text-red-600">просрочен</span>}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">{proj?.title} · {doc?.title}</div>
            </div>
            <div className="truncate text-muted-foreground">{U(e.responsibleId)}</div>
            <Meta m={TIER[e.tier]} />
            <Meta m={ST[e.status]} />
          </div>
        ))}
      </div>
    </div>
  );
}
