"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECTS, DOCUMENTS } from "@/lib/fixtures";

type Crumb = { label: string; href?: string };

function useCrumbs(): Crumb[] {
  const path = usePathname();
  if (path.startsWith("/my")) return [{ label: "Мои правки" }];
  if (path.startsWith("/blockers")) return [{ label: "Блокеры" }];
  if (path.startsWith("/reports")) return [{ label: "Отчёты" }];
  if (path.startsWith("/agent")) return [{ label: "Как видит Claude" }];

  const pm = path.match(/^\/projects\/([^/]+)/);
  if (pm) {
    const p = PROJECTS.find((x) => x.id === pm[1]);
    return [{ label: "Реестр", href: "/" }, { label: p?.title ?? "Проект" }];
  }

  const dm = path.match(/^\/documents\/([^/]+)/);
  if (dm) {
    const d = DOCUMENTS.find((x) => x.id === dm[1]);
    const p = d ? PROJECTS.find((x) => x.id === d.projectId) : undefined;
    const out: Crumb[] = [{ label: "Реестр", href: "/" }];
    if (p) out.push({ label: p.title, href: `/projects/${p.id}` });
    out.push({ label: d?.title ?? "Документ" });
    return out;
  }

  return [{ label: "Реестр" }];
}

export function Topbar() {
  const crumbs = useCrumbs();
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <Fragment key={i}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {c.href && !last ? (
                    <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-md outline-none">
                <span className="hidden text-sm font-medium md:block">Аня Ю.</span>
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">АЮ</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Помощник юриста</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" />
              Профиль
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut className="size-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
