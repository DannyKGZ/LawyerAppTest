"use client";

import { AlertTriangle, Clock, Download } from "lucide-react";
import { Meta } from "@/components/ui-bits";
import { U } from "@/lib/fixtures";
import type { Doc, Edit, Version, EditStatus } from "@/lib/types";
import { ST, isOpenEdit } from "@/lib/domain";

const ddmmyy = (s: string) => { const [y, m, d] = s.split("-"); return `${d}.${m}.${y.slice(2)}`; };
const hhmm = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `${String(9 + (h % 9)).padStart(2, "0")}:${String((h >>> 4) % 60).padStart(2, "0")}`;
};

const KIND_SHORT: Record<string, string> = {
  "Основной договор": "Договор",
  "Приложение": "Приложение",
  "Допсоглашение": "Допсогл.",
  "Другой": "Другое",
};

type JEv =
  | { kind: "edit"; date: string; time: string; docKind: string; clause: string; who: string; status: EditStatus }
  | { kind: "version"; date: string; time: string; docKind: string; code: string; who: string; note?: string }
  | { kind: "conflict"; date: string; time: string; docKind: string; clause: string; who: string };

export function EventJournal({
  docs,
  getEdits,
  getVers,
  scopeLabel,
  showKind = false,
}: {
  docs: Doc[];
  getEdits: (docId: string) => Edit[];
  getVers: (docId: string) => Version[];
  scopeLabel: string;
  showKind?: boolean;
}) {
  const journal: JEv[] = [];
  docs.forEach((d) => {
    const es = getEdits(d.id);
    es.forEach((e) => journal.push({ kind: "edit", date: e.date, time: hhmm(e.id), docKind: d.kind, clause: e.clause, who: U(e.responsibleId), status: e.status }));
    getVers(d.id).forEach((v) => journal.push({ kind: "version", date: v.date, time: hhmm(v.id), docKind: d.kind, code: v.code, who: U("assist"), note: v.note }));
    const byClause: Record<string, Edit[]> = {};
    es.filter(isOpenEdit).forEach((e) => { (byClause[e.clause] = byClause[e.clause] || []).push(e); });
    Object.entries(byClause).filter(([, arr]) => arr.length > 1).forEach(([clause, arr]) => {
      journal.push({ kind: "conflict", date: [...arr].map((e) => e.date).sort().reverse()[0], time: hhmm(clause + d.id), docKind: d.kind, clause, who: arr.map((e) => U(e.responsibleId)).join(" и ") });
    });
  });
  journal.sort((a, b) => { const A = a.date + a.time, B = b.date + b.time; return A < B ? 1 : A > B ? -1 : 0; });

  const downloadTxt = () => {
    const head = [
      "ЖУРНАЛ СОБЫТИЙ — LawyerApp",
      scopeLabel,
      "Сформировано: " + new Date().toLocaleString("ru-RU"),
      "Всего записей: " + journal.length,
      "",
      "".padEnd(72, "="),
    ];
    const rows = journal.map((ev) => {
      const dt = `${ddmmyy(ev.date)} ${ev.time}`;
      let text: string;
      if (ev.kind === "edit") text = `[${ev.docKind}] ${ev.clause} · ${ev.who} · ${ST[ev.status].label}`;
      else if (ev.kind === "version") text = `[${ev.docKind}] Версия ${ev.code} · ${ev.who}${ev.note ? " · " + ev.note : ""}`;
      else text = `[${ev.docKind}] КОНФЛИКТ на «${ev.clause}»: ${ev.who} предложили разные формулировки — выбрать одну`;
      return `${dt}  ${text}`;
    });
    const content = [...head, ...rows, ""].join("\r\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "журнал-событий.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="group/journal mt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Журнал событий</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{scopeLabel}</p>
        </div>
        <button
          type="button"
          onClick={downloadTxt}
          disabled={journal.length === 0}
          className="flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm opacity-0 transition-opacity hover:bg-accent group-hover/journal:opacity-100 disabled:pointer-events-none"
        >
          <Download className="size-4" />
          Скачать
        </button>
      </div>
      <div className="my-3 border-t" />
      {journal.length === 0 ? (
        <div className="text-sm text-muted-foreground">Событий пока нет.</div>
      ) : (
        <div className="space-y-1">
          {journal.map((ev, i) => (
            <div key={i} className="group relative -mx-2 flex cursor-default items-start gap-3 rounded-md px-2 py-1 text-sm hover:bg-muted/40">
              <span aria-hidden className="absolute -left-3 top-[9px] size-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-[#1D1D1F] opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="flex w-[112px] shrink-0 items-center gap-2 self-start pt-px text-xs tabular-nums text-muted-foreground">
                {ddmmyy(ev.date)}
                <span className="flex items-center gap-1"><Clock className="size-3 text-muted-foreground/60" />{ev.time}</span>
              </span>
              {showKind && (
                <span className="inline-flex w-28 shrink-0 items-center justify-center self-start rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {KIND_SHORT[ev.docKind] ?? ev.docKind}
                </span>
              )}
              <div className="min-w-0 flex-1 truncate group-hover:whitespace-normal">
                {ev.kind === "edit" && (
                  <>
                    <span className="font-medium">{ev.clause}</span>
                    <span className="text-muted-foreground"> · {ev.who}</span>
                  </>
                )}
                {ev.kind === "version" && (
                  <>
                    <span className="font-medium">Версия {ev.code}</span>
                    <span className="text-muted-foreground"> · {ev.who}{ev.note ? ` · ${ev.note}` : ""}</span>
                  </>
                )}
                {ev.kind === "conflict" && (
                  <span className="text-muted-foreground">
                    <AlertTriangle className="mr-1 inline size-3.5 align-[-2px] text-amber-500" />
                    Конфликт на «{ev.clause}»: <span className="font-medium text-foreground">{ev.who}</span> предложили разные формулировки — выбрать одну
                  </span>
                )}
              </div>
              <div className="flex w-40 shrink-0 justify-end self-start pt-px">
                {ev.kind === "edit" && <Meta m={ST[ev.status]} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
