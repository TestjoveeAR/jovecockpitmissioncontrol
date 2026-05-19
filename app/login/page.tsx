"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/home";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      setError("Wrong password.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || !password} className="w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Enter cockpit
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[100dvh] grid place-items-center px-6 py-12">
      <div className="w-full max-w-sm fade-up">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 grid place-items-center ring-1 ring-primary/30">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-semibold tracking-tighter text-base">Jovée</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Cockpit
            </div>
          </div>
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tightest leading-[1.05] mb-1">
          Team password
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Ask Bobby for the shared cockpit password — it is stored only as a server-side
          environment variable.
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
