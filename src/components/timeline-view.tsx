"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  ExternalLink,
  Layers,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CreateVersionDialog } from "@/components/create-version-dialog";
import { Breadcrumbs, Meta } from "@/components/ui-bits";
import { DOCUMENTS, PROJECTS, VERSIONS, EDITS, U } from "@/lib/fixtures";
import type { Edit, EditStatus, Version } from "@/lib/types";
import {
  ST,
  TIER,
  TYPE,
  dmy,
  isOpenEdit,
  isOverdue,
  isClosedEdit,
  conflictClauses,
  sortEditsForDisplay,
  docEditStats,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const pravkaWord = (n: number) => {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return "правка";
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return "правки";
  return "правок";
};

const COL = "grid grid-cols-[minmax(0,1fr)_9rem_8.5rem_8.5rem_5.5rem] gap-3";

export function TimelineView({ id }: { id: string }) {
  const router = useRouter();
  const doc = DOCUMENTS.find((x) => x.id === id);
  const [edits, setEdits] = useState<Edit[]>(() => EDITS.filter((e) => e.docId === id));
  const [vers, setVers] = useState<Version[]>(() => VERSIONS.filter((v) => v.docId === id));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [verOpen, setVerOpen] = useState(false);

  const sorted = useMemo(() => sortEditsForDisplay(edits), [edits]);
  const conflicts = useMemo(() => conflictClauses(edits), [edits]);
  const stats = useMemo(() => docEditStats(edits), [edits]);

  if (!doc) {
    return <div className="text-sm text-muted-foreground">Документ не найден.</div>;
  }

  const proj = PROJECTS.find((p) => p.id === doc.projectId)!;
  const sortedVers = [...vers].sort((a, b) => a.number - b.number);
  const current = sortedVers.length ? sortedVers[sortedVers.length - 1] : null;
  const selected = edits.find((e) => e.id === selectedId) ?? null;

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

  const decide = (eid: string, status: EditStatus) => {
    setEdits((es) =>
      es.map((e) =>
        e.id === eid
          ? { ...e, status, approverId: status === "accepted" ? "ceo" : e.approverId }
          : e,
      ),
    );
    setSelectedId(null);
    toast.success("Статус: " + ST[status].label + " · доказательство приложено");
  };

  const escalate = () => {
    setSelectedId(null);
    toast("Эскалировано команде");
  };

  const candidates = edits.filter((e) => e.status === "accepted" && !e.appliedIn);
  const nextNumber = vers.reduce((m, v) => Math.max(m, v.number), 0) + 1;

  const addVersion = ({
    note,
    fileName,
    appliedIds,
  }: {
    note: string;
    fileName: string;
    appliedIds: string[];
  }) => {
    const number = nextNumber;
    const code = `${proj.code}.${doc.code}.v${number}`;
    const v: Version = {
      id: `v-new-${number}`,
      docId: id,
      number,
      code,
      date: iso(new Date()),
      source: "uploaded",
      hash: "—",
      note: note || fileName,
    };
    setVers((vs) => [v, ...vs]);
    setEdits((es) =>
      es.map((e) =>
        appliedIds.includes(e.id) ? { ...e, status: "applied", appliedIn: number } : e,
      ),
    );
    toast.success(`Версия ${code} добавлена`);
  };

  const conflictGroups = [...conflicts].map((clause) => ({
    clause,
    edits: sorted.filter((e) => e.clause === clause && isOpenEdit(e)),
  }));

  const nonConflictEdits = sorted.filter(
    (e) => !(conflicts.has(e.clause) && isOpenEdit(e)),
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Проекты", href: "/" },
          { label: proj.title, href: `/projects/${proj.id}` },
          { label: doc.title },
        ]}
      />

      {/* Шапка */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{doc.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {proj.title} · {proj.counterparty}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${proj.id}`)}>
            <ArrowLeft className="size-4" />
            К проекту
          </Button>
          <CreateVersionDialog
            nextCode={`${proj.code}.${doc.code}.v${nextNumber}`}
            candidates={candidates}
            onCreate={addVersion}
            open={verOpen}
            onOpenChange={setVerOpen}
          />
          {current && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Действия с версиями"
                className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent data-popup-open:bg-accent"
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => downloadVersion(current)}>
                  <Download />
                  Скачать текущую версию
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {current.code}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Download />
                    Скачать другую версию
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52">
                    {[...vers]
                      .sort((a, b) => b.number - a.number)
                      .map((v) => (
                        <DropdownMenuItem key={v.id} onClick={() => downloadVersion(v)}>
                          <span className="font-mono text-xs">{v.code}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {dmy(v.date)}
                          </span>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setVerOpen(true)}>
                  <Layers />
                  Собрать новую версию
                  {candidates.length > 0 && (
                    <span className="ml-auto text-xs text-amber-600">
                      {candidates.length} {pravkaWord(candidates.length)}
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Сводка — ответ на «что происходит?» за 5 секунд */}
      <DocSummary stats={stats} currentVersion={current?.number ?? doc.currentVersion} />

      {/* Версии */}
      {sortedVers.length > 0 && (
        <VersionStrip
          versions={sortedVers}
          currentNumber={current?.number ?? doc.currentVersion}
          onDownload={downloadVersion}
        />
      )}

      {/* Сигналы внимания */}
      {(stats.blockers > 0 || stats.overdue > 0 || stats.conflicts > 0) && (
        <AttentionStrip stats={stats} conflictGroups={conflictGroups} />
      )}

      {/* Список правок */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Правки</h2>
          <span className="text-xs text-muted-foreground">
            {edits.length} {pravkaWord(edits.length)} · клик — детали
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div
            className={cn(
              COL,
              "border-b bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
            )}
          >
            <span>Пункт</span>
            <span>Настоял</span>
            <span>Статус</span>
            <span>Уровень</span>
            <span className="text-right">Срок</span>
          </div>

          {conflictGroups.map((g) => (
            <ConflictGroup key={g.clause} clause={g.clause} edits={g.edits} onSelect={setSelectedId} />
          ))}

          {nonConflictEdits.map((e) => (
            <EditRow key={e.id} edit={e} onSelect={setSelectedId} />
          ))}
        </div>
      </section>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <EditDetail edit={selected} onDecide={decide} onEscalate={escalate} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DocSummary({
  stats,
  currentVersion,
}: {
  stats: ReturnType<typeof docEditStats>;
  currentVersion: number;
}) {
  const items: { dot: string; text: string }[] = [
    { dot: "bg-zinc-400", text: `v${currentVersion} · текущая версия` },
  ];
  if (stats.open > 0) {
    items.push({ dot: "bg-amber-500", text: `${stats.open} открыто` });
  } else {
    items.push({ dot: "bg-emerald-500", text: "все правки закрыты" });
  }
  if (stats.blockers > 0) {
    items.push({ dot: "bg-red-500", text: `${stats.blockers} блокер${stats.blockers > 1 ? "а" : ""}` });
  }
  if (stats.overdue > 0) {
    items.push({ dot: "bg-red-500", text: `${stats.overdue} просрочено` });
  }
  if (stats.conflicts > 0) {
    items.push({ dot: "bg-red-500", text: `${stats.conflicts} конфликт${stats.conflicts > 1 ? "а" : ""}` });
  }
  if (stats.acceptedPending > 0) {
    items.push({
      dot: "bg-emerald-500",
      text: `${stats.acceptedPending} принято · ждёт версии`,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-4 py-3">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 text-sm text-foreground">
          <span className={cn("inline-block h-1.5 w-1.5 rounded-full", it.dot)} />
          {it.text}
        </span>
      ))}
    </div>
  );
}

function VersionStrip({
  versions,
  currentNumber,
  onDownload,
}: {
  versions: Version[];
  currentNumber: number;
  onDownload: (v: Version) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs text-muted-foreground">Версии</span>
      {versions.map((v, i) => (
        <span key={v.id} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted-foreground/40">→</span>}
          <button
            type="button"
            onClick={() => onDownload(v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs transition-colors hover:bg-accent",
              v.number === currentNumber && "border-foreground/20 bg-muted font-medium",
            )}
          >
            v{v.number}
            <Download className="size-3 text-muted-foreground" />
          </button>
        </span>
      ))}
    </div>
  );
}

function AttentionStrip({
  stats,
  conflictGroups,
}: {
  stats: ReturnType<typeof docEditStats>;
  conflictGroups: { clause: string; edits: Edit[] }[];
}) {
  return (
    <div className="space-y-1.5 rounded-lg border border-red-200/80 bg-red-50/40 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <AlertTriangle className="size-4 shrink-0 text-red-500" />
        Требует внимания
      </div>
      <ul className="space-y-0.5 pl-6 text-sm text-muted-foreground">
        {stats.conflicts > 0 &&
          conflictGroups.map((g) => (
            <li key={g.clause}>
              Конфликт · {g.clause} — {g.edits.length} противоположные правки (
              {g.edits.map((e) => U(e.responsibleId)).join(" vs ")})
            </li>
          ))}
        {stats.blockers > 0 && stats.conflicts === 0 && (
          <li>
            {stats.blockers} правк{stats.blockers > 1 ? "и" : "а"} вне компетенции юриста — решение
            командой
          </li>
        )}
        {stats.overdue > 0 && (
          <li>
            {stats.overdue} просрочен{stats.overdue > 1 ? "ы" : "а"} — срок прошёл, решение не
            принято
          </li>
        )}
      </ul>
    </div>
  );
}

function ConflictGroup({
  clause,
  edits,
  onSelect,
}: {
  clause: string;
  edits: Edit[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="border-b border-red-200/60 bg-red-50/30 last:border-b-0">
      <div className="flex items-center gap-2 border-b border-red-200/40 px-4 py-1.5 text-xs text-red-700/90">
        <AlertTriangle className="size-3.5 shrink-0" />
        Конфликт · {clause}
      </div>
      {edits.map((e, i) => (
        <EditRow
          key={e.id}
          edit={e}
          onSelect={onSelect}
          inConflict
          isLast={i === edits.length - 1}
        />
      ))}
    </div>
  );
}

function EditRow({
  edit,
  onSelect,
  inConflict,
  isLast,
}: {
  edit: Edit;
  onSelect: (id: string) => void;
  inConflict?: boolean;
  isLast?: boolean;
}) {
  const closed = isClosedEdit(edit);
  const overdue = isOverdue(edit);
  const stale = isOpenEdit(edit) && edit.date < "2026-06-01";

  return (
    <button
      type="button"
      onClick={() => onSelect(edit.id)}
      className={cn(
        COL,
        "w-full items-center border-b px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
        closed && "opacity-55",
        inConflict && isLast && "border-b-0",
        !inConflict && "last:border-b-0",
      )}
    >
      <span className="min-w-0 truncate font-medium">
        {edit.clause}
        {stale && !inConflict && (
          <span className="ml-1.5 text-xs font-normal text-amber-600">· давно открыта</span>
        )}
      </span>
      <span className="truncate text-muted-foreground">{U(edit.responsibleId)}</span>
      <Meta m={ST[edit.status]} />
      <Meta m={TIER[edit.tier]} />
      <span
        className={cn(
          "text-right text-xs tabular-nums",
          overdue ? "font-medium text-red-600" : "text-muted-foreground",
        )}
      >
        {dmy(edit.deadline)}
      </span>
    </button>
  );
}

function EditDetail({
  edit,
  onDecide,
  onEscalate,
}: {
  edit: Edit;
  onDecide: (id: string, s: EditStatus) => void;
  onEscalate: () => void;
}) {
  const tier = TIER[edit.tier];
  const blocker = edit.tier === "blocker";
  const authorDiffers = edit.authorId !== edit.responsibleId;

  return (
    <>
      <SheetHeader className="border-b pb-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          ЗРС · {TYPE[edit.type]}
        </p>
        <SheetTitle className="text-base leading-snug">{edit.clause}</SheetTitle>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Meta m={ST[edit.status]} />
          <span className="text-border">·</span>
          <Meta m={tier} />
        </div>
      </SheetHeader>

      <div className="space-y-5 px-4 py-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border text-sm">
          <div className="bg-background p-3">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Было
            </div>
            <div className="text-muted-foreground">
              {edit.before || <span className="italic">новый пункт</span>}
            </div>
          </div>
          <div className="bg-background p-3">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Стало
            </div>
            <div>{edit.after}</div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Настоял</dt>
            <dd className="font-medium">{U(edit.responsibleId)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {authorDiffers ? "Оформил" : "Автор"}
            </dt>
            <dd className={cn("font-medium", authorDiffers && "text-muted-foreground")}>
              {U(edit.authorId)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Дата</dt>
            <dd>{dmy(edit.date)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Дедлайн</dt>
            <dd className={cn("font-medium", isOverdue(edit) && "text-red-600")}>
              {dmy(edit.deadline)}
              {isOverdue(edit) && " · просрочен"}
            </dd>
          </div>
        </dl>

        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            Аргументация
          </div>
          <p className="rounded-md bg-muted p-3 text-sm leading-relaxed text-foreground/85">
            {edit.argument}
          </p>
        </div>

        {edit.privateNote && (
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Приватная заметка юриста
            </div>
            <p className="rounded-md bg-muted p-3 text-sm leading-relaxed text-foreground/85">
              {edit.privateNote}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {edit.bitrix && (
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
              <ExternalLink className="size-3" />
              Битрикс
            </span>
          )}
          {edit.proof && (
            <span className="rounded-md border px-2 py-1">{edit.proof}</span>
          )}
          {edit.appliedIn && (
            <span className="rounded-md border px-2 py-1">в версии v{edit.appliedIn}</span>
          )}
        </div>

        {isOpenEdit(edit) && (
          <div className="border-t pt-4">
            {blocker ? (
              <>
                <div className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  <span>{tier.hint}</span>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={onEscalate}>
                    Эскалировать команде
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onDecide(edit.id, "rework")}
                  >
                    На доработку
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 text-xs text-muted-foreground">{tier.hint}</p>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => onDecide(edit.id, "accepted")}>
                    Принято
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onDecide(edit.id, "rework")}
                  >
                    На доработку
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600"
                    onClick={() => onDecide(edit.id, "rejected")}
                  >
                    Отклонено
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
