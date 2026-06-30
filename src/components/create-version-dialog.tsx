"use client";

import { useState } from "react";
import { Upload, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { U } from "@/lib/fixtures";
import type { Edit } from "@/lib/types";

export function CreateVersionDialog({
  nextCode,
  candidates,
  onCreate,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  nextCode: string;
  candidates: Edit[];
  onCreate: (p: { note: string; fileName: string; appliedIds: string[] }) => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (o: boolean) => (onOpenChangeProp ? onOpenChangeProp(o) : setOpenInternal(o));
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("");
  const [checked, setChecked] = useState<Set<string>>(() => new Set(candidates.map((e) => e.id)));

  const onOpenChange = (o: boolean) => {
    if (o) setChecked(new Set(candidates.map((e) => e.id)));
    setOpen(o);
  };

  const toggle = (id: string) =>
    setChecked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const submit = () => {
    if (!fileName) return;
    onCreate({ note: note.trim(), fileName, appliedIds: [...checked] });
    setFileName(""); setNote(""); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <button className="flex h-9 w-48 items-center justify-center gap-2 rounded-md bg-[#1D1D1F] px-4 text-sm font-medium text-white hover:opacity-90">
            <Upload className="size-4" />
            Добавить версию
          </button>
        }
      />
      <DialogContent className="gap-6 p-6 sm:max-w-lg">
        <DialogHeader className="-mx-6 -mt-6 rounded-t-xl border-b bg-muted/50 px-6 py-4">
          <DialogTitle>
            Новая версия · <span className="font-mono text-sm text-muted-foreground">{nextCode}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Файл версии</Label>
            <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-accent">
              <Upload className="size-5" />
              {fileName ? <span className="font-medium text-foreground">{fileName}</span> : <span>Выберите файл — docx или pdf</span>}
              <input type="file" accept=".docx,.pdf" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
            </label>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="nv-note">Комментарий <span className="font-normal text-muted-foreground">(необязательно)</span></Label>
            <Input id="nv-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="напр. «отправлено клиенту»" />
          </div>

          <div className="grid gap-1.5">
            <Label>Какие правки вошли в эту версию</Label>
            {candidates.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Нет принятых правок, ожидающих внесения.</div>
            ) : (
              <div className="grid gap-1.5">
                {candidates.map((e) => {
                  const on = checked.has(e.id);
                  return (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => toggle(e.id)}
                      className="flex items-center gap-2 rounded-md border p-2 text-left text-sm hover:bg-accent"
                    >
                      <span className={cn("flex size-4 shrink-0 items-center justify-center rounded border", on ? "border-foreground bg-foreground text-background" : "bg-background")}>
                        {on && <Check className="size-3" />}
                      </span>
                      <span className="flex-1 truncate">{e.clause}</span>
                      <span className="text-xs text-muted-foreground">{U(e.responsibleId)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="-mx-6 -mb-6 px-6">
          <Button variant="outline" className="px-6" onClick={() => setOpen(false)}>Отмена</Button>
          <Button className="px-6" onClick={submit} disabled={!fileName}>Загрузить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
