import Link from "next/link";
import { cn } from "@/lib/utils";

export function Dot({ className }: { className?: string }) {
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", className)} />;
}

export function Meta({ m, className }: { m: { label: string; dot: string }; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap", className)}>
      <Dot className={m.dot} />
      {m.label}
    </span>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-border">/</span>}
          {it.href ? (
            <Link href={it.href} className="hover:text-foreground">{it.label}</Link>
          ) : (
            <span className="text-foreground">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
