"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
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
        Enter mission control
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-[100dvh] grid place-items-center px-6 py-12 overflow-hidden">
      {/* Jovée signature corner blobs — mint top-right, coral bottom-left */}
      <div className="jovee-blob-teal -top-32 -right-32" aria-hidden />
      <div className="jovee-blob-rose -bottom-32 -left-32" aria-hidden />
      <div className="relative w-full max-w-sm fade-up z-10">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="relative h-10 w-10 shrink-0">
            <Image
              src="/jovee-logo.png"
              alt="Jovée"
              fill
              sizes="40px"
              priority
              className="object-contain"
            />
          </div>
          <div className="leading-tight">
            <div className="font-display font-semibold tracking-tighter text-base">Jovée</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Mission Control
            </div>
          </div>
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tightest leading-[1.05] mb-1">
          Team password
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Ask Bobby for the shared mission control password — it is stored only as a server-side
          environment variable.
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
