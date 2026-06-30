"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Meta } from "@/components/ui-bits";
import { AddDocumentDialog } from "@/components/add-document-dialog";
import { EventJournal } from "@/components/event-journal";
import { PROJECTS, DOCUMENTS, EDITS, VERSIONS } from "@/lib/fixtures";
import { PROJ } from "@/lib/domain";
import type { Doc } from "@/lib/types";

const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export function ProjectView({ id }: { id: string }) {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>(() => DOCUMENTS.filter((d) => d.projectId === id));
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return <div className="text-sm text-muted-foreground">Проект не найден.</div>;
  const cnt = (did: string) => EDITS.filter((e) => e.docId === did).length;
  const hasMain = docs.some((d) => d.code === "OSN");
  const onCreateDoc = ({ kind, title, fileName }: { kind: string; title: string; fileName: string }) => {
    let code: string;
    if (kind === "Основной договор") code = "OSN";
    else {
      const prefix = kind === "Приложение" ? "PRIL" : kind === "Допсоглашение" ? "DS" : "DOC";
      code = `${prefix}${docs.filter((d) => d.kind === kind).length + 1}`;
    }
    const docId = `doc-${Date.now()}`;
    const newDoc: Doc = { id: docId, projectId: id, code, kind, title, currentVersion: 1 };
    setDocs((ds) => [...ds, newDoc]);
    DOCUMENTS.push(newDoc);
    VERSIONS.push({ id: `v-${docId}`, docId, number: 1, code: `${p.code}.${code}.v1`, date: isoToday(), source: "uploaded", hash: "—", note: fileName });
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{p.title}</h1>
            <Meta m={PROJ[p.status]} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{p.counterparty}{p.inn && <> · ИНН {p.inn}</>} · <span className="font-mono">{p.code}</span> · №{p.number}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/")} className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-accent">
            <ArrowLeft className="size-4" />
            Назад
          </button>
          <AddDocumentDialog hasMain={hasMain} onCreate={onCreateDoc} />
        </div>
      </div>

      <div className="mb-2">
        <h2 className="text-sm font-medium">Документы пакета</h2>
      </div>
      {docs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">Документов пока нет.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          {docs.map((d) => (
            <div
              key={d.id}
              onClick={() => router.push(`/documents/${d.id}`)}
              className="grid cursor-pointer grid-cols-[1fr_150px_90px_20px] items-center gap-4 border-b px-4 py-3 text-sm last:border-0 hover:bg-muted/50"
            >
              <div className="min-w-0">
                <span className="font-medium">{d.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">{d.kind}</span>
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">{p.code}.{d.code}.v{d.currentVersion}</div>
              <div className="text-xs text-muted-foreground">{cnt(d.id)} правок</div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}

      <EventJournal
        docs={docs}
        getEdits={(dId) => EDITS.filter((e) => e.docId === dId)}
        getVers={(dId) => VERSIONS.filter((v) => v.docId === dId)}
        scopeLabel="Вся хронология по проекту: правки, согласования и версии по всем документам."
        showKind
      />
    </div>
  );
}
