"use client";

import { useState } from "react";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { PROJECTS, U } from "@/lib/fixtures";
import type { Currency, ProjectStatus } from "@/lib/types";
import { PROJ, dmy } from "@/lib/domain";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

export type NewProjectInput = {
  title: string;
  counterparty: string;
  inn: string;
  managerIds: string[];
  amount: number;
  currency: Currency;
  status: ProjectStatus;
  startDate: string | null;
};

const CUR_ITEMS: Record<string, string> = { RUB: "₽ RUB", USD: "$ USD", EUR: "€ EUR", CNY: "¥ CNY" };
const STATUS_ITEMS: Record<string, string> = Object.fromEntries(
  (Object.keys(PROJ) as (keyof typeof PROJ)[]).map((k) => [k, PROJ[k].label])
);

export function CreateProjectDialog({ onCreate }: { onCreate: (input: NewProjectInput) => void }) {
  const mgrs = [...new Set(PROJECTS.flatMap((p) => p.managerIds))];
  const MGR_ITEMS: Record<string, string> = Object.fromEntries(mgrs.map((m) => [m, U(m)]));

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [inn, setInn] = useState("");
  const [manager, setManager] = useState(mgrs[0] ?? "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("RUB");
  const [statusV, setStatusV] = useState<ProjectStatus>("draft");
  const [startDate, setStartDate] = useState(() => iso(new Date()));
  const [touched, setTouched] = useState<{ title?: boolean; counterparty?: boolean; inn?: boolean }>({});

  const titleErr = title.trim().length < 4;
  const cpErr = counterparty.trim().length < 4;
  const innErr = inn.trim().length === 0;
  const valid = !titleErr && !cpErr && !innErr;
  const errCls = (err: boolean, t?: boolean) =>
    err && t ? "border-2 border-red-300 focus-visible:border-red-300 focus-visible:ring-red-200/60" : "";

  const submit = () => {
    if (title.trim().length < 4) return toast.error("Название — обязательно, не менее 4 символов");
    if (counterparty.trim().length < 4) return toast.error("Контрагент — обязательно, не менее 4 символов");
    if (!inn.trim()) return toast.error("Укажите ИНН контрагента");
    onCreate({
      title: title.trim(),
      counterparty: counterparty.trim(),
      inn: inn.trim(),
      managerIds: manager ? [manager] : [],
      amount: +amount || 0,
      currency,
      status: statusV,
      startDate: startDate || null,
    });
    toast.success("Договор добавлен в реестр");
    setTitle(""); setCounterparty(""); setInn(""); setAmount(""); setCurrency("RUB"); setStatusV("draft"); setStartDate(iso(new Date())); setTouched({});
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex h-9 w-48 shrink-0 items-center justify-center gap-2 rounded-md bg-[#1D1D1F] px-4 text-sm font-medium text-white hover:opacity-90">
            <Plus className="size-4" />
            Добавить проект
          </button>
        }
      />
      <DialogContent className="gap-6 p-6 sm:max-w-lg">
        <DialogHeader className="-mx-6 -mt-6 rounded-t-xl border-b bg-muted/50 px-6 py-4">
          <DialogTitle>Новый договор</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="np-title">Название</Label>
            <Input id="np-title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, title: true }))} className={cn(errCls(titleErr, touched.title))} placeholder="Договор поставки №…" />
          </div>
          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="np-cp">Контрагент</Label>
            <Input id="np-cp" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, counterparty: true }))} className={cn(errCls(cpErr, touched.counterparty))} placeholder="ООО «…»" />
          </div>
          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="np-inn">ИНН контрагента</Label>
            <Input id="np-inn" inputMode="numeric" value={inn} onChange={(e) => setInn(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))} onBlur={() => setTouched((t) => ({ ...t, inn: true }))} className={cn(errCls(innErr, touched.inn))} placeholder="10 или 12 цифр" />
          </div>

          <div className="grid gap-1.5">
            <Label>Менеджер</Label>
            <Select value={manager} onValueChange={(v) => v && setManager(v)} items={MGR_ITEMS}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(MGR_ITEMS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Статус</Label>
            <Select value={statusV} onValueChange={(v) => v && setStatusV(v as ProjectStatus)} items={STATUS_ITEMS}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(STATUS_ITEMS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="np-amt">Сумма</Label>
            <Input id="np-amt" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" />
          </div>
          <div className="grid gap-1.5">
            <Label>Валюта</Label>
            <Select value={currency} onValueChange={(v) => v && setCurrency(v as Currency)} items={CUR_ITEMS}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(CUR_ITEMS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 grid gap-1.5">
            <Label>Дата начала</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <button type="button" className="flex h-9 w-full items-center gap-2 rounded-md border bg-transparent px-3 text-sm hover:bg-accent">
                    <CalendarIcon className="size-4 text-muted-foreground" />
                    <span className={cn(!startDate && "text-muted-foreground")}>{startDate ? dmy(startDate) : "Выберите дату"}</span>
                  </button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate ? fromISO(startDate) : undefined} onSelect={(d) => setStartDate(d ? iso(d) : "")} locale={ru} defaultMonth={startDate ? fromISO(startDate) : new Date()} autoFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="-mx-6 -mb-6 px-6">
          <Button variant="outline" className="px-6" onClick={() => setOpen(false)}>Отмена</Button>
          <Button className="px-6" onClick={submit} disabled={!valid}>Создать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
