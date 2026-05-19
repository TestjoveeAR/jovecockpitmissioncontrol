"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  Users,
  KanbanSquare,
  MapPin,
  Bot,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/neural-map", label: "Neural Map", icon: Network },
  { href: "/crm", label: "CRM Pipeline", icon: Users },
  { href: "/tasks", label: "Project Tasks", icon: KanbanSquare },
  { href: "/salons", label: "Salon Map", icon: MapPin },
  { href: "/agents", label: "Agents Hub", icon: Bot },
];

const secondary = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-border/60 glass">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="relative h-9 w-9 shrink-0">
          <Image
            src="/jovee-logo.png"
            alt="Jovée"
            fill
            sizes="36px"
            priority
            className="object-contain"
          />
        </div>
        <div className="leading-tight">
          <div className="font-display font-semibold tracking-tighter text-[15px]">Jovée</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">Mission Control</div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {nav.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}

        <div className="py-2">
          <div className="mx-3 h-px bg-border/60" />
        </div>

        {secondary.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border/60 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
        v0.1 · MVP
      </div>
    </aside>
  );
}

function isActive(pathname: string | null, href: string) {
  return pathname === href || (pathname?.startsWith(href + "/") ?? false);
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: any;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      )}
    >
      {/* Accent rail on active */}
      <span
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full transition-all",
          active ? "bg-primary" : "bg-transparent group-hover:bg-border"
        )}
      />
      <span
        className={cn(
          "grid place-items-center h-7 w-7 rounded-md transition-colors",
          active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground/80 group-hover:text-foreground"
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>
      <span className={cn("font-medium", active && "text-foreground")}>{label}</span>
    </Link>
  );
}
