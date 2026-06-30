"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DOCUMENTS, VERSIONS, EDITS } from "@/lib/fixtures";
import { dmy, isOverdue, isOpenEdit } from "@/lib/domain";

function ToolCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 rounded-lg border">
      <div className="border-b bg-muted/50 px-4 py-2.5">
        <div className="font-mono text-xs">{title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <div className="p-4 text-sm">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

export function AgentView() {
  const doc = DOCUMENTS.find((d) => d.id === "d1")!;
  const my = EDITS.filter((e) => e.docId === "d1");
  const openZrs = my.filter((e) => e.status === "in_review");
  const cand = my.filter((e) => e.status === "accepted" && !e.appliedIn);
  const over = my.filter(isOverdue);
  const blockers = my.filter((e) => e.tier === "blocker" && isOpenEdit(e));
  const [code, setCode] = useState("RMK12.OSN.v3");
  const r = VERSIONS.find((v) => v.code === code);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Как видит Claude</h1>
      <p className="mt-0.5 mb-5 text-sm text-muted-foreground">
        Демо agent-слоя: то же приложение через «кнопки» (MCP) — ответы на вопросы, а не сырые таблицы.
      </p>

      <ToolCard title="get_state(«Основной договор»)" sub="На чём остановились">
        <Row k="Актуальная версия" v="v3 · RMK12.OSN.v3" />
        <Row k="На рассмотрении" v={openZrs.length} />
        <Row k="Принято, не внесено (в v4)" v={cand.length || "—"} />
        <Row k="Просрочено" v={over.length} />
        <Row k="Блокеры (решает команда)" v={blockers.length} />
      </ToolCard>

      <ToolCard title="resolve_document({revisionCode})" sub="Опознай присланный файл">
        <Input value={code} onChange={(e) => setCode(e.target.value)} className="mb-3 font-mono" />
        {r ? (
          <div className="text-foreground/80">
            Опознано: <b>{doc.title}</b>, версия v{r.number} от {dmy(r.date)} · источник:{" "}
            {r.source === "uploaded" ? "загружен человеком" : "сгенерирован Claude"} · хеш{" "}
            <span className="font-mono text-muted-foreground">{r.hash}</span>.
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="size-3.5 text-amber-500" />
            Код не найден — проверю по footer&apos;у/хешу или это неучтённый черновик.
          </div>
        )}
      </ToolCard>

      <ToolCard title="prepare_next_version(«Основной договор»)" sub="Подготовь черновик v4">
        <div className="text-foreground/80">
          Беру v3 + принятые-не-внесённые правки ({cand.length}). На доработку/отклонённые — не вношу. Черновик
          помечается <span className="font-mono text-muted-foreground">ai_generated</span> и{" "}
          <b>официальной версией становится только после подтверждения человеком</b>.
        </div>
      </ToolCard>
    </div>
  );
}
