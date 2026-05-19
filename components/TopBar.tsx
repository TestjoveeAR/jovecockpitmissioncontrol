"use client";

import { Search, Sun, Moon, Command } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 glass px-4 md:px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" strokeWidth={1.75} />
        <input
          type="search"
          placeholder="Search vault, salons, agents…"
          className="focus-glow h-10 w-full rounded-xl border border-border/60 bg-background/40 pl-9 pr-16 text-sm placeholder:text-muted-foreground/70 focus:border-ring/60 transition-colors"
        />
        <kbd className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-0.5 rounded-md border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70">
          <Command className="h-3 w-3" /> K
        </kbd>
      </div>

      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/30">
        <span className="h-1.5 w-1.5 rounded-full bg-primary status-dot pulse text-primary" />
        <span className="text-xs font-medium text-muted-foreground">{today}</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        className="rounded-xl tactile"
      >
        {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <div className="relative h-9 w-9 rounded-full grid place-items-center text-xs font-semibold tracking-tight">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-[2px] opacity-80" />
        <span className="relative h-8 w-8 rounded-full bg-background grid place-items-center ring-1 ring-border">
          BT
        </span>
      </div>
    </header>
  );
}
