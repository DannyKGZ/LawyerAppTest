"use client";

import { type ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale } from "lucide-react";
import { NAV } from "@/lib/nav";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

function active(href: string, path: string) {
  return href === "/"
    ? path === "/" || path.startsWith("/projects") || path.startsWith("/documents")
    : path.startsWith(href);
}

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const path = usePathname();
  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader className="h-16 justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Scale className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">LawyerApp</span>
                <span className="truncate text-xs text-muted-foreground">история правок</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((it) => {
                const Icon = it.icon;
                const isAct = active(it.href, path);
                return (
                  <SidebarMenuItem key={it.href}>
                    <SidebarMenuButton tooltip={it.label} render={<Link href={it.href} />}>
                      <Icon />
                      <span>{it.label}</span>
                      {isAct && <span className="ml-auto size-1.5 rounded-full bg-foreground" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
