import type { User, Project, Doc, Version, Edit } from "./types";
import { isOpenEdit, isOverdue } from "./domain";

export const USERS: Record<string, User> = {
  assist: { id: "assist", name: "Аня (помощник юриста)", role: "Помощник юриста" },
  lawyer: { id: "lawyer", name: "Юрист (аутсорс)", role: "Юрист" },
  senior: { id: "senior", name: "Орлов (ст. юрист)", role: "Старший юрист" },
  ivanov: { id: "ivanov", name: "Иванов", role: "Менеджер" },
  petrov: { id: "petrov", name: "Петров", role: "Менеджер" },
  buh: { id: "buh", name: "Кузьмина (бухгалтер)", role: "Бухгалтер" },
  ceo: { id: "ceo", name: "Сидоров (гендир)", role: "Гендиректор" },
};
export const U = (id: string | null) => (id && USERS[id] ? USERS[id].name : "—");

export const PROJECTS: Project[] = [
  { id: "p1", number: 12, code: "RMK12", title: "Договор поставки №12", counterparty: "ООО «Ромашка»", managerIds: ["ivanov", "petrov"], lawyerId: "lawyer", seniorId: "senior", amount: 1200000, currency: "RUB", status: "active", startDate: "2026-05-20", signedAt: "2026-05-30" },
  { id: "p2", number: 7, code: "RMK7", title: "Договор подряда №7", counterparty: "ООО «Ромашка»", managerIds: ["petrov"], lawyerId: "lawyer", seniorId: "senior", amount: 480000, currency: "RUB", status: "dispute", startDate: "2026-04-01", signedAt: "2026-04-12" },
  { id: "p3", number: 3, code: "RMK3", title: "Договор аренды №3", counterparty: "ИП Громов", managerIds: ["ivanov"], lawyerId: "lawyer", seniorId: "senior", amount: 2400000, currency: "RUB", status: "draft", startDate: "2026-06-05", signedAt: null },
  { id: "p4", number: 15, code: "RMK15", title: "Поставка оборудования №15", counterparty: "АО «ТехноПром»", managerIds: ["ivanov"], lawyerId: "lawyer", seniorId: "senior", amount: 54000, currency: "USD", status: "negotiation", startDate: "2026-06-01", signedAt: null },
  { id: "p5", number: 9, code: "RMK9", title: "Лицензионный договор №9", counterparty: "SoftLine GmbH", managerIds: ["petrov"], lawyerId: "lawyer", seniorId: "senior", amount: 90000, currency: "EUR", status: "signed", startDate: "2026-03-15", signedAt: "2026-03-20" },
  { id: "p6", number: 18, code: "RMK18", title: "Сервисный договор №18", counterparty: "GlobalTrade Ltd", managerIds: ["ivanov", "petrov"], lawyerId: "lawyer", seniorId: "senior", amount: 350000, currency: "CNY", status: "active", startDate: "2026-05-10", signedAt: "2026-05-14" },
  { id: "p7", number: 5, code: "RMK5", title: "Договор поставки №5", counterparty: "ООО «Ромашка»", managerIds: ["petrov"], lawyerId: "lawyer", seniorId: "senior", amount: 750000, currency: "RUB", status: "active", startDate: "2026-02-01", signedAt: "2026-02-05" },
];

export const DOCUMENTS: Doc[] = [
  { id: "d1", projectId: "p1", code: "OSN", kind: "Основной договор", title: "Основной договор", currentVersion: 3 },
  { id: "d2", projectId: "p1", code: "PRIL1", kind: "Приложение", title: "Приложение №1 (спецификация)", currentVersion: 1 },
  { id: "d3", projectId: "p1", code: "DS1", kind: "Допсоглашение", title: "Допсоглашение №1", currentVersion: 2 },
  { id: "d4", projectId: "p2", code: "OSN", kind: "Основной договор", title: "Основной договор", currentVersion: 2 },
  { id: "d5", projectId: "p7", code: "OSN", kind: "Основной договор", title: "Основной договор", currentVersion: 2 },
];

export const VERSIONS: Version[] = [
  { id: "v3", docId: "d1", number: 3, code: "RMK12.OSN.v3", date: "2026-06-09", source: "uploaded", hash: "a1f3…9e" },
  { id: "v2", docId: "d1", number: 2, code: "RMK12.OSN.v2", date: "2026-06-05", source: "uploaded", hash: "77c0…b2" },
  { id: "v1", docId: "d1", number: 1, code: "RMK12.OSN.v1", date: "2026-05-28", source: "uploaded", hash: "12ab…04" },
];

export const EDITS: Edit[] = [
  { id: "e1", docId: "d1", date: "2026-06-09", clause: "п. 5.2 Срок оплаты", type: "commercial", tier: "responsible", before: "Оплата в течение 10 (десяти) рабочих дней с даты поставки.", after: "Оплата в течение 30 (тридцати) календарных дней с даты поставки.", authorId: "assist", responsibleId: "ivanov", argument: "Заказчик просит отсрочку; согласовано на встрече 08.06 с гендиром.", privateNote: "Риск кассового разрыва — заложить пеню в п. 7.1.", deadline: "2026-06-10", bitrix: "https://bitrix.example/task/4821", proof: "скрин_0609.png", status: "accepted", approverId: "ceo", appliedIn: null },
  { id: "e2", docId: "d1", date: "2026-06-09", clause: "п. 7.1 Неустойка", type: "commercial", tier: "blocker", before: "Неустойка 0,1% от суммы за каждый день просрочки.", after: "Неустойка 0,05% от суммы за каждый день просрочки.", authorId: "assist", responsibleId: "petrov", argument: "Контрагент просит снизить ставку неустойки вдвое.", privateNote: "", deadline: "2026-06-11", bitrix: "https://bitrix.example/task/4822", proof: null, status: "in_review", approverId: null, appliedIn: null },
  { id: "e7", docId: "d1", date: "2026-06-09", clause: "п. 7.1 Неустойка", type: "commercial", tier: "blocker", before: "Неустойка 0,1% от суммы за каждый день просрочки.", after: "Неустойка 0,2% от суммы за каждый день просрочки (ужесточить).", authorId: "assist", responsibleId: "senior", argument: "Ст. юрист, наоборот, предлагает усилить неустойку для защиты. Конфликт с правкой Петрова.", privateNote: "", deadline: "2026-06-11", bitrix: "https://bitrix.example/task/4824", proof: null, status: "in_review", approverId: null, appliedIn: null },
  { id: "e6", docId: "d1", date: "2026-06-09", clause: "п. 3.4 Порядок приёмки", type: "legal_wording", tier: "responsible", before: "Приёмка в течение 5 дней.", after: "Приёмка в течение 10 рабочих дней с подписанием акта.", authorId: "assist", responsibleId: "buh", argument: "Бухгалтерия просит синхронизировать с регламентом приёмки.", privateNote: "", deadline: "2026-06-12", bitrix: "https://bitrix.example/task/4823", proof: null, status: "in_review", approverId: null, appliedIn: null },
  { id: "e3", docId: "d1", date: "2026-06-05", clause: "п. 2.3 Предмет", type: "legal_wording", tier: "self", before: "Поставщик обязуется поставить оборудование согласно заявке.", after: "Поставщик обязуется поставить оборудование согласно Спецификации (Приложение №1).", authorId: "assist", responsibleId: "assist", argument: "Уточнение формулировки, привязка к спецификации. Низкий риск.", privateNote: "", deadline: "2026-06-06", bitrix: "https://bitrix.example/task/4790", proof: "скрин_0605.png", status: "applied", approverId: "senior", appliedIn: 2 },
  { id: "e4", docId: "d1", date: "2026-06-05", clause: "п. 9.1 Реквизиты", type: "requisites", tier: "self", before: "р/с 4070… (старый банк)", after: "р/с 4070… (новый банк, с 01.06)", authorId: "assist", responsibleId: "buh", argument: "Сменили обслуживающий банк, обновить реквизиты.", privateNote: "", deadline: "2026-06-07", bitrix: "https://bitrix.example/task/4791", proof: null, status: "rejected", approverId: "senior", appliedIn: null },
  { id: "e5", docId: "d1", date: "2026-05-28", clause: "п. 4.1 Гарантийный срок", type: "commercial", tier: "responsible", before: "Гарантийный срок — 12 месяцев.", after: "Гарантийный срок — 24 месяца.", authorId: "assist", responsibleId: "ivanov", argument: "Менеджер предложил увеличить гарантию. Ждём подтверждения — он в отпуске.", privateNote: "", deadline: "2026-05-30", bitrix: "https://bitrix.example/task/4701", proof: null, status: "in_review", approverId: null, appliedIn: null },
  { id: "e8", docId: "d5", date: "2026-02-01", clause: "п. 3.1 Цена", type: "commercial", tier: "responsible", before: "Цена 700 000 ₽.", after: "Цена 750 000 ₽.", authorId: "assist", responsibleId: "petrov", argument: "Согласована индексация цены, утверждено гендиром.", privateNote: "", deadline: "2026-02-03", bitrix: "https://bitrix.example/task/4100", proof: "скрин_0201.png", status: "applied", approverId: "ceo", appliedIn: 2 },
  { id: "e9", docId: "d5", date: "2026-02-02", clause: "п. 5.1 Срок поставки", type: "deadlines", tier: "self", before: "Срок поставки 30 дней.", after: "Срок поставки 45 дней.", authorId: "assist", responsibleId: "petrov", argument: "Уточнён срок поставки по согласованию сторон.", privateNote: "", deadline: "2026-02-04", bitrix: "https://bitrix.example/task/4101", proof: null, status: "applied", approverId: "senior", appliedIn: 2 },
];

export function projHealth(pid: string) {
  const ids = DOCUMENTS.filter((d) => d.projectId === pid).map((d) => d.id);
  const es = EDITS.filter((e) => ids.includes(e.docId));
  return {
    blockers: es.filter((e) => e.tier === "blocker" && isOpenEdit(e)).length,
    overdue: es.filter(isOverdue).length,
    open: es.filter(isOpenEdit).length,
    total: es.length,
  };
}

/** Утверждён = действует и вся история правок закрыта (прошёл все стадии). */
export function isApproved(p: Project) {
  const h = projHealth(p.id);
  return (
    (p.status === "active" || p.status === "signed") &&
    h.total > 0 && h.open === 0 && h.blockers === 0 && h.overdue === 0
  );
}
