export type UUID = string;
export type ISODate = string;

export type Currency = "RUB" | "USD" | "EUR" | "CNY";
export type ProjectStatus =
  | "draft" | "negotiation" | "signed" | "active" | "dispute" | "terminated" | "archived";
export type EditStatus =
  | "draft" | "in_review" | "accepted" | "rework" | "rejected" | "applied";
export type EditType = "commercial" | "legal_wording" | "requisites" | "deadlines" | "other";
export type EditTier = "self" | "responsible" | "blocker";
export type VersionSource = "uploaded" | "ai_generated";

export interface User {
  id: UUID;
  name: string;
  role: string;
}

export interface Project {
  id: UUID;
  number: number;
  code: string;
  title: string;
  counterparty: string;
  inn?: string;
  managerIds: UUID[];
  lawyerId: UUID;
  seniorId: UUID;
  amount: number;
  currency: Currency;
  status: ProjectStatus;
  startDate: ISODate | null;
  signedAt: ISODate | null;
}

export interface Doc {
  id: UUID;
  projectId: UUID;
  code: string;
  kind: string;
  title: string;
  currentVersion: number;
}

export interface Version {
  id: UUID;
  docId: UUID;
  number: number;
  code: string;
  date: ISODate;
  source: VersionSource;
  hash: string;
  note?: string;
}

export interface Edit {
  id: UUID;
  docId: UUID;
  date: ISODate;
  clause: string;
  type: EditType;
  tier: EditTier;
  before: string;
  after: string;
  authorId: UUID;
  responsibleId: UUID;
  argument: string;
  privateNote: string;
  deadline: ISODate | null;
  bitrix: string | null;
  proof: string | null;
  status: EditStatus;
  approverId: UUID | null;
  appliedIn: number | null;
}
