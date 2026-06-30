"use client";

import { useState } from "react";
import { FilePlus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

const ALL_TYPES = ["Основной договор", "Приложение", "Допсоглашение", "Другой"];

export function AddDocumentDialog({
  hasMain,
  onCreate,
}: {
  hasMain: boolean;
  onCreate: (input: { kind: string; title: string; fileName: string }) => void;
}) {
  const available = ALL_TYPES.filter((t) => t !== "Основной договор" || !hasMain);
  const TYPE_ITEMS: Record<string, string> = Object.fromEntries(available.map((t) => [t, t]));

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(available[0]);
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [touched, setTouched] = useState(false);

  const onOpenChange = (o: boolean) => {
    if (o) { setKind(available[0]); setTitle(""); setFileName(""); setTouched(false); }
    setOpen(o);
  };

  const titleErr = title.trim().length < 3;
  const valid = !titleErr && !!fileName;
  const submit = () => {
    if (!valid) return;
    onCreate({ kind, title: title.trim(), fileName });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <button className="flex h-9 w-48 items-center justify-center gap-2 rounded-md bg-[#1D1D1F] px-4 text-sm font-medium text-white hover:opacity-90">
            <FilePlus className="size-4" />
            Добавить документ
          </button>
        }
      />
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader className="-mx-6 -mt-6 rounded-t-xl border-b bg-muted/50 px-6 py-4">
          <DialogTitle>Новый документ</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Тип документа</Label>
            <Select value={kind} onValueChange={(v) => v && setKind(v)} items={TYPE_ITEMS}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{available.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            {hasMain && (
              <p className="text-xs text-muted-foreground">Основной договор уже есть — для нестандартных бумаг выберите «Другой».</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="nd-title">Название</Label>
            <Input id="nd-title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setTouched(true)} className={cn(touched && titleErr && "border-2 border-red-300 focus-visible:border-red-300 focus-visible:ring-red-200/60")} placeholder="напр. «Приложение №2 (спецификация)»" />
          </div>
          <div className="grid gap-1.5">
            <Label>Файл документа</Label>
            <label className={cn("flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-accent", touched && !fileName && "border-2 border-red-300")}>
              <Upload className="size-5" />
              {fileName ? <span className="font-medium text-foreground">{fileName}</span> : <span>Выберите файл — docx или pdf</span>}
              <input type="file" accept=".docx,.pdf" className="hidden" onChange={(e) => { setTouched(true); setFileName(e.target.files?.[0]?.name ?? ""); }} />
            </label>
            <p className="text-xs text-muted-foreground">Без файла документ создать нельзя — это его первая версия.</p>
          </div>
        </div>

        <DialogFooter className="-mx-6 -mb-6 px-6">
          <Button variant="outline" className="px-6" onClick={() => setOpen(false)}>Отмена</Button>
          <Button className="px-6" onClick={submit} disabled={!valid}>Добавить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
