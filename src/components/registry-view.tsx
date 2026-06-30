"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, Check, Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Meta, Dot } from "@/components/ui-bits";
import { CreateProjectDialog, type NewProjectInput } from "@/components/create-project-dialog";
import { PROJECTS, projHealth, isApproved, U } from "@/lib/fixtures";
import type { Currency, Project } from "@/lib/types";
import { CUR, PROJ, money, toRub, dmy } from "@/lib/domain";

const COL = "grid grid-cols-[44px_1fr_120px_92px_128px_150px] gap-4";
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const SORT_ITEMS: Record<string, string> = {
  num: "По порядку (№)", amount_desc: "Дороже", amount_asc: "Дешевле",
};
const CUR_ITEMS: Record<string, string> = {
  all: "Валюта", RUB: "₽ RUB", USD: "$ USD", EUR: "€ EUR", CNY: "¥ CNY",
};
const STATUS_ITEMS: Record<string, string> = {
  all: "Все статусы",
  ...Object.fromEntries((Object.keys(PROJ) as (keyof typeof PROJ)[]).map((k) => [k, PROJ[k].label])),
};

export function RegistryView() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [mgr, setMgr] = useState("all");
  const [cur, setCur] = useState<Currency | "all">("all");
  const [amt, setAmt] = useState("");
  const [sort, setSort] = useState("num");
  const [range, setRange] = useState<DateRange | undefined>();
  const [onlyB, setOnlyB] = useState(false);
  const [onlyO, setOnlyO] = useState(false);

  const mgrs = [...new Set(PROJECTS.flatMap((p) => p.managerIds))];
  const MGR_ITEMS: Record<string, string> = {
    all: "Все менеджеры",
    ...Object.fromEntries(mgrs.map((m) => [m, U(m)])),
  };
  const step = cur !== "all" ? CUR[cur].step : 0;
  const amountActive = cur !== "all" && !!amt;

  let rows = projects.filter((p) => {
    if (q && !(p.title + p.counterparty + p.code + " №" + p.number).toLowerCase().includes(q.toLowerCase())) return false;
    if (status !== "all" && p.status !== status) return false;
    if (mgr !== "all" && !p.managerIds.includes(mgr)) return false;
    if (cur !== "all" && p.currency !== cur) return false;
    if (amountActive) {
      const n = +amt;
      if (p.amount < n - step || p.amount > n + step) return false;
    }
    if (range?.from) {
      const from = iso(range.from);
      const to = range.to ? iso(range.to) : from;
      if (!p.startDate || p.startDate < from || p.startDate > to) return false;
    }
    const h = projHealth(p.id);
    if (onlyB && h.blockers === 0) return false;
    if (onlyO && h.overdue === 0) return false;
    return true;
  });
  const eff = amountActive ? "amount_desc" : sort;
  rows = [...rows].sort((a, b) =>
    eff === "num" ? a.number - b.number : eff === "amount_asc" ? toRub(a) - toRub(b) : toRub(b) - toRub(a)
  );
  const total = rows.reduce((s, p) => s + toRub(p), 0);
  const active = !!(q || status !== "all" || mgr !== "all" || cur !== "all" || amt || range?.from || onlyB || onlyO);
  const reset = () => {
    setQ(""); setStatus("all"); setMgr("all"); setCur("all"); setAmt(""); setRange(undefined); setOnlyB(false); setOnlyO(false);
  };

  const onCreate = (input: NewProjectInput) => {
    const number = projects.reduce((m, p) => Math.max(m, p.number), 0) + 1;
    const proj: Project = {
      id: `new-${number}`, number, code: `NEW${number}`,
      title: input.title, counterparty: input.counterparty, inn: input.inn, managerIds: input.managerIds,
      lawyerId: "lawyer", seniorId: "senior",
      amount: input.amount, currency: input.currency, status: input.status,
      startDate: input.startDate, signedAt: null,
    };
    setProjects((ps) => [proj, ...ps]);
  };

  const dateLabel = range?.from
    ? range.to && iso(range.to) !== iso(range.from)
      ? `${dmy(iso(range.from))}–${dmy(iso(range.to))}`
      : dmy(iso(range.from))
    : "Дата начала";

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Реестр договоров</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Поиск, фильтры и сортировка по портфелю договоров</p>
        </div>
        <CreateProjectDialog onCreate={onCreate} />
      </div>

      <div className="mb-6 space-y-2">
        {/* строка 1: поиск + сортировка */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию, №, реквизитам…" className="pr-8" />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Очистить" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
          <Select value={sort} onValueChange={(v) => v && setSort(v)} items={SORT_ITEMS} disabled={amountActive}>
            <SelectTrigger className="w-48 shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_ITEMS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* строка 2: фильтры (правый край выровнен с полем поиска), справа — дата */}
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2">
            <Input value={amt} inputMode="numeric" onChange={(e) => setAmt(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Сумма" className="w-36 shrink-0" />
            <Select value={cur} onValueChange={(v) => v && setCur(v as Currency | "all")} items={CUR_ITEMS}>
              <SelectTrigger className="w-28 shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CUR_ITEMS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={mgr} onValueChange={(v) => setMgr(v ?? "all")} items={MGR_ITEMS}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MGR_ITEMS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "all")} items={STATUS_ITEMS}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_ITEMS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={onlyB ? "default" : "outline"} className="shrink-0" onClick={() => setOnlyB((v) => !v)}>Блокеры</Button>
            <Button variant={onlyO ? "default" : "outline"} className="shrink-0" onClick={() => setOnlyO((v) => !v)}>Просрочка</Button>
          </div>
          <Popover>
            <PopoverTrigger
              render={
                <button className="flex h-9 w-48 shrink-0 items-center gap-2 rounded-md border bg-transparent px-3 text-sm hover:bg-accent">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  <span className={cn("truncate", !range?.from && "text-muted-foreground")}>{dateLabel}</span>
                </button>
              }
            />
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" selected={range} onSelect={setRange} locale={ru} numberOfMonths={1} defaultMonth={new Date(2026, 4, 1)} autoFocus />
              {range?.from && (
                <div className="border-t p-2">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setRange(undefined)}>Очистить дату</Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Найдено: <b className="text-foreground">{rows.length}</b> · портфель ~{Math.round(total).toLocaleString("ru-RU")} ₽
          {amountActive && <> · сумма {money(Math.max(0, +amt - step), cur as Currency)}–{money(+amt + step, cur as Currency)} по убыванию</>}
          {amt && cur === "all" && <> · укажите валюту для фильтра по сумме</>}
        </div>
        {active && <button onClick={reset} className="underline hover:text-foreground">Сбросить фильтры</button>}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className={`${COL} border-b bg-muted/50 px-4 py-2.5 text-[11px] uppercase tracking-wide text-muted-foreground`}>
          <div className="text-center">№</div>
          <div>Договор</div>
          <div className="text-center">Менеджеры</div>
          <div className="text-center">Начало</div>
          <div className="text-center">Сумма</div>
          <div>Статус</div>
        </div>
        {rows.length === 0 && <div className="px-4 py-10 text-center text-sm text-muted-foreground">Ничего не найдено.</div>}
        {rows.map((p) => {
          const h = projHealth(p.id);
          const approved = isApproved(p);
          return (
            <div
              key={p.id}
              onClick={() => router.push(`/projects/${p.id}`)}
              className={`${COL} cursor-pointer items-center border-b px-4 py-3 text-sm last:border-0 hover:bg-muted/50`}
            >
              <div className="text-center tabular-nums text-muted-foreground">{p.number}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn("truncate font-medium", approved && "text-emerald-600")}>{p.title}</span>
                  {approved && <Check className="size-4 shrink-0 text-emerald-600" aria-label="утверждён" />}
                </div>
                <div className="truncate text-[11px] text-muted-foreground"><span className="font-mono">{p.code}</span> · {p.counterparty}</div>
              </div>
              <div className="truncate text-center text-muted-foreground">{p.managerIds.map(U).join(", ")}</div>
              <div className="text-center text-xs tabular-nums text-muted-foreground">{dmy(p.startDate)}</div>
              <div className="text-center tabular-nums">{money(p.amount, p.currency)}</div>
              <div className="flex items-center gap-2">
                <Meta m={PROJ[p.status]} />
                {h.blockers > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] text-red-600" title="блокеры">
                    <AlertTriangle className="size-3" />{h.blockers}
                  </span>
                )}
                {h.overdue > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-red-600" title="просрочка">
                    <Dot className="bg-red-500" />{h.overdue}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
