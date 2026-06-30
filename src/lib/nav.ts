import { List, SquarePen, ShieldAlert, BarChart3, type LucideIcon } from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

export const NAV: NavItem[] = [
  { label: "Реестр договоров", href: "/", icon: List },
  { label: "Мои правки", href: "/my", icon: SquarePen },
  { label: "Блокеры", href: "/blockers", icon: ShieldAlert },
  { label: "Отчёты", href: "/reports", icon: BarChart3 },
];
