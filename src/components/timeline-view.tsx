"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, AlertTriangle, ExternalLink, ArrowLeft, Download, MoreVertical, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Meta } from "@/components/ui-bits";
import { CreateVersionDialog } from "@/components/create-version-dialog";
import { EventJournal } from "@/components/event-journal";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DOCUMENTS, PROJECTS, VERSIONS, EDITS, U } from "@/lib/fixtures";
import type { Edit, EditStatus, Version } from "@/lib/types";
import { ST, TIER, TYPE, dmy, dayStatus, isOpenEdit, isOverdue } from "@/lib/domain";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const pravkaWord = (n: number) => { const a = n % 10, b = n % 100; if (a === 1 && b !== 11) return "правка"; if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return "правки"; return "правок"; };

export function TimelineView({ id }: { id: string }) {
  const router = useRouter();
  const doc = DOCUMENTS.find((x) => x.id === id);
  const [edits, setEdits] = useState<Edit[]>(() => EDITS.filter((e) => e.docId === id));
  const [vers, setVers] = useState<Version[]>(() => VERSIONS.filter((v) => v.docId === id));
  const dates = [...new Set([...edits.map((e) => e.date), ...vers.map((v) => v.date)])].sort().reverse();
  const [exp, setExp] = useState<Set<string>>(() => new Set(dates.slice(0, 1)));
  const [zrsId, setZrsId] = useState<string | null>(null);
  const [verOpen, setVerOpen] = useState(false);

  if (!doc) return <div className="text-sm text-muted-foreground">Документ не найден.</div>;
  const proj = PROJECTS.find((p) => p.id === doc.projectId)!;
  const current = vers.length ? [...vers].sort((a, b) => b.number - a.number)[0] : null;

  const downloadVersion = (v: Version) => {
    const lines = [
      `ДОКУМЕНТ — ${doc.title}`,
      `Проект: ${proj.title} (${proj.code})`,
      `Версия: ${v.code} · v${v.number} · от ${dmy(v.date)}`,
      `Файл-источник: ${v.note || "—"}`,
      "",
      "".padEnd(60, "="),
      "(прототип: здесь будет реальный файл версии — это демо-заглушка)",
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${v.code}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toggle = (d: string) =>
    setExp((s) => {
      const n = new Set(s);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });

  const openByClause: Record<string, number> = {};
  edits.filter(isOpenEdit).forEach((e) => { openByClause[e.clause] = (openByClause[e.clause] || 0) + 1; });
  const conflict = new Set(Object.keys(openByClause).filter((k) => openByClause[k] > 1));

  const decide = (eid: string, status: EditStatus) => {
    setEdits((es) => es.map((e) => (e.id === eid ? { ...e, status, approverId: status === "accepted" ? "ceo" : e.approverId } : e)));
    setZrsId(null);
    toast.success("Статус: " + ST[status].label + " · доказательство приложено");
  };
  const escalate = () => { setZrsId(null); toast("Эскалировано команде"); };

  const candidates = edits.filter((e) => e.status === "accepted" && !e.appliedIn);
  const nextNumber = vers.reduce((m, v) => Math.max(m, v.number), 0) + 1;
  const addVersion = ({ note, fileName, appliedIds }: { note: string; fileName: string; appliedIds: string[] }) => {
    const number = nextNumber;
    const code = `${proj.code}.${doc.code}.v${number}`;
    const v: Version = { id: `v-new-${number}`, docId: id, number, code, date: iso(new Date()), source: "uploaded", hash: "—", note: note || fileName };
    setVers((vs) => [v, ...vs]);
    setEdits((es) => es.map((e) => (appliedIds.includes(e.id) ? { ...e, status: "applied", appliedIn: number } : e)));
    toast.success(`Версия ${code} добавлена`);
  };

  const zrs = edits.find((e) => e.id === zrsId) || null;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{doc.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{proj.title} · история правок</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/projects/${proj.id}`)} className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-accent">
            <ArrowLeft className="size-4" />
            Назад
          </button>
          <CreateVersionDialog nextCode={`${proj.code}.${doc.code}.v${nextNumber}`} candidates={candidates} onCreate={addVersion} open={verOpen} onOpenChange={setVerOpen} />
          {current && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Действия с версиями"
                className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent data-popup-open:bg-accent"
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => downloadVersion(current)}>
                  <Download />
                  Скачать текущую версию
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{current.code}</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Download />
                    Скачать другую версию
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52">
                    {[...vers].sort((a, b) => b.number - a.number).map((v) => (
                      <DropdownMenuItem key={v.id} onClick={() => downloadVersion(v)}>
                        <span className="font-mono text-xs">{v.code}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{dmy(v.date)}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setVerOpen(true)}>
                  <Layers />
                  Собрать новую версию
                  {candidates.length > 0 && (
                    <span className="ml-auto text-xs text-amber-600">{candidates.length} {pravkaWord(candidates.length)}</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {dates.map((date) => {
          const de = edits.filter((e) => e.date === date);
          const ver = vers.find((v) => v.date === date);
          const ds = dayStatus(de);
          const open = exp.has(date);
          const dayConflict = de.some((e) => conflict.has(e.clause) && isOpenEdit(e));
          return (
            <div key={date} className="overflow-hidden rounded-lg border">
              <div
                onClick={() => toggle(date)}
                className="flex cursor-pointer select-none items-center gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <span className="text-muted-foreground">{open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</span>
                <span className="w-24 text-sm font-medium">{dmy(date)}</span>
                <div className="w-44"><Meta m={ds} /></div>
                <div className="ml-auto flex items-center gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">{dayConflict && <AlertTriangle className="size-3.5 text-amber-500" />}{de.length} правок</span>
                  {ver && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono">{ver.code}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); downloadVersion(ver); }}
                        aria-label={`Скачать ${ver.code}`}
                        title={`Скачать ${ver.code}`}
                        className="rounded p-1 hover:bg-foreground/10 hover:text-foreground"
                      >
                        <Download className="size-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
              {open && (
                <div className="border-t bg-[#1D1D1F]">
                  {de.map((e) => {
                    const conf = conflict.has(e.clause) && isOpenEdit(e);
                    return (
                      <div
                        key={e.id}
                        onClick={() => setZrsId(e.id)}
                        className="grid cursor-pointer grid-cols-[1fr_200px_160px] items-center gap-4 border-b border-white/10 px-4 py-3 last:border-0 hover:bg-white/5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                            {e.clause}
                            {conf && <AlertTriangle className="size-3.5 text-amber-500" />}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-white/55">
                            {TYPE[e.type]} · {U(e.responsibleId)}{isOverdue(e) ? " · просрочен" : ""}
                          </div>
                        </div>
                        <Meta m={TIER[e.tier]} className="text-white/70" />
                        <Meta m={ST[e.status]} className="text-white/70" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div className="px-1 pt-1 text-xs text-muted-foreground">06.06–08.06 — без правок, пропущены</div>
      </div>

      <EventJournal docs={[doc]} getEdits={() => edits} getVers={() => vers} scopeLabel="Хронология по этому документу" />

      <Dialog open={!!zrs} onOpenChange={(o) => !o && setZrsId(null)}>
        <DialogContent className="max-w-2xl">
          {zrs && <ZrsBody edit={zrs} onDecide={decide} onEscalate={escalate} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ZrsBody({ edit, onDecide, onEscalate }: { edit: Edit; onDecide: (id: string, s: EditStatus) => void; onEscalate: () => void }) {
  const tier = TIER[edit.tier];
  const blocker = edit.tier === "blocker";
  return (
    <>
      <DialogHeader>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">ЗРС · законченная работа сотрудника</div>
        <DialogTitle className="text-base">{edit.clause}</DialogTitle>
        <div className="mt-1.5 flex items-center gap-3">
          <Meta m={ST[edit.status]} />
          <span className="text-border">·</span>
          <Meta m={tier} />
        </div>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border text-sm">
          <div className="bg-background p-3">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Было</div>
            <div className="text-muted-foreground">{edit.before || <span className="italic">новый пункт</span>}</div>
          </div>
          <div className="bg-background p-3">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Стало</div>
            <div>{edit.after}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {([["Тип", TYPE[edit.type]], ["Ответственный", U(edit.responsibleId)], ["Автор", U(edit.authorId)], ["Дедлайн", dmy(edit.deadline)]] as [string, string][]).map(([k, v]) => (
            <div key={k}>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
              <div className={"font-medium " + (k === "Дедлайн" && isOverdue(edit) ? "text-red-600" : "")}>{v}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Аргументация</div>
          <div className="rounded-md bg-muted p-3 text-sm text-foreground/80">{edit.argument}</div>
        </div>
        {edit.privateNote && (
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Приватная заметка юриста</div>
            <div className="rounded-md bg-muted p-3 text-sm text-foreground/80">{edit.privateNote}</div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {edit.bitrix && <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1"><ExternalLink className="size-3" />Битрикс</span>}
          {edit.proof && <span className="rounded-md border px-2 py-1">{edit.proof}</span>}
          {edit.appliedIn && <span className="rounded-md border px-2 py-1">в версии v{edit.appliedIn}</span>}
        </div>
      </div>

      <div className="mt-2 border-t pt-4">
        {blocker ? (
          <>
            <div className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
              <span>{tier.hint}</span>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={onEscalate}>Эскалировать команде</Button>
              <Button variant="outline" className="flex-1" onClick={() => onDecide(edit.id, "rework")}>На доработку</Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-2 text-xs text-muted-foreground">{tier.hint}</div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => onDecide(edit.id, "accepted")}>Принято</Button>
              <Button variant="outline" className="flex-1" onClick={() => onDecide(edit.id, "rework")}>На доработку</Button>
              <Button variant="outline" className="flex-1 text-red-600" onClick={() => onDecide(edit.id, "rejected")}>Отклонено</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
