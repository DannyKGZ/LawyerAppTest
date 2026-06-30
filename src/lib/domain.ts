import type {
  Project, Edit, Currency, EditStatus, ProjectStatus, EditTier, EditType,
} from "./types";

/** Зафиксированная «сегодня» для демо-данных. */
export const TODAY = "2026-06-11";

export const CUR: Record<Currency, { sym: string; step: number; rate: number }> = {
  RUB: { sym: "₽", step: 50000, rate: 1 },
  USD: { sym: "$", step: 5000, rate: 90 },
  EUR: { sym: "€", step: 5000, rate: 100 },
  CNY: { sym: "¥", step: 30000, rate: 12.5 },
};

export const money = (a: number | null, c: Currency = "RUB") =>
  a != null ? a.toLocaleString("ru-RU") + " " + CUR[c].sym : "—";
export const toRub = (p: Project) => (p.amount || 0) * CUR[p.currency].rate;
export const dmy = (s: string | null) => (s ? s.split("-").reverse().join(".") : "—");

type Meta = { label: string; dot: string };

export const ST: Record<EditStatus, Meta> = {
  draft: { label: "Черновик", dot: "bg-zinc-300" },
  in_review: { label: "На рассмотрении", dot: "bg-amber-500" },
  accepted: { label: "Принято", dot: "bg-emerald-500" },
  rework: { label: "На доработку", dot: "bg-amber-500" },
  rejected: { label: "Отклонено", dot: "bg-red-500" },
  applied: { label: "Внесено", dot: "bg-emerald-600" },
};

export const PROJ: Record<ProjectStatus, Meta> = {
  draft: { label: "Черновик", dot: "bg-zinc-300" },
  negotiation: { label: "Согласование", dot: "bg-amber-500" },
  signed: { label: "Подписан", dot: "bg-zinc-400" },
  active: { label: "Действует", dot: "bg-emerald-500" },
  dispute: { label: "Спор", dot: "bg-red-500" },
  terminated: { label: "Расторгнут", dot: "bg-zinc-300" },
  archived: { label: "Архив", dot: "bg-zinc-200" },
};

export const TIER: Record<EditTier, Meta & { hint: string }> = {
  self: {
    label: "Можно самим", dot: "bg-zinc-300",
    hint: "Низкий риск — ПЮ может прогнать через нейросеть, оформить ЗРС и принять допустимый риск сам.",
  },
  responsible: {
    label: "Решает ответственный", dot: "bg-zinc-500",
    hint: "Обычный ЗРС — решение за назначенным ответственным.",
  },
  blocker: {
    label: "Блокер · командой", dot: "bg-red-500",
    hint: "Вне нашей компетенции. Юрист НЕ принимает один — эскалация и защита командой.",
  },
};

export const TYPE: Record<EditType, string> = {
  commercial: "Коммерческие",
  legal_wording: "Формулировки",
  requisites: "Реквизиты",
  deadlines: "Сроки",
  other: "Прочее",
};

export const OPEN_ST: EditStatus[] = ["draft", "in_review", "rework"];
export const isOpenEdit = (e: Edit) => OPEN_ST.includes(e.status);
export const isOverdue = (e: Edit) => !!e.deadline && e.deadline < TODAY && isOpenEdit(e);
export const isClosedEdit = (e: Edit) => !isOpenEdit(e);

/** Пункты с двумя и более открытыми правками — конфликт. */
export function conflictClauses(edits: Edit[]): Set<string> {
  const openByClause: Record<string, number> = {};
  edits.filter(isOpenEdit).forEach((e) => {
    openByClause[e.clause] = (openByClause[e.clause] || 0) + 1;
  });
  return new Set(Object.keys(openByClause).filter((k) => openByClause[k] > 1));
}

const urgency = (e: Edit, conflicts: Set<string>) => {
  if (conflicts.has(e.clause) && isOpenEdit(e)) return 0;
  if (e.tier === "blocker" && isOpenEdit(e)) return 1;
  if (isOverdue(e)) return 2;
  if (isOpenEdit(e)) return 3;
  if (e.status === "accepted") return 4;
  return 5;
};

/** Открытые и рискованные — вверх; закрытые — вниз, по дате. */
export function sortEditsForDisplay(edits: Edit[]): Edit[] {
  const conflicts = conflictClauses(edits);
  return [...edits].sort((a, b) => {
    const ua = urgency(a, conflicts);
    const ub = urgency(b, conflicts);
    if (ua !== ub) return ua - ub;
    return b.date.localeCompare(a.date);
  });
}

export function docEditStats(edits: Edit[]) {
  const conflicts = conflictClauses(edits);
  const open = edits.filter(isOpenEdit);
  return {
    open: open.length,
    blockers: open.filter((e) => e.tier === "blocker").length,
    overdue: edits.filter(isOverdue).length,
    conflicts: conflicts.size,
    acceptedPending: edits.filter((e) => e.status === "accepted" && !e.appliedIn).length,
    closed: edits.filter(isClosedEdit).length,
  };
}

export function dayStatus(es: Edit[]): Meta {
  const open = es.filter(isOpenEdit);
  if (open.length === 0) return { label: "Закрыта", dot: "bg-emerald-500" };
  if (open.some(isOverdue)) return { label: "Просрочка · " + open.length, dot: "bg-red-500" };
  return { label: "Открыто " + open.length, dot: "bg-amber-500" };
}
