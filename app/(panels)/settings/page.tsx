"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ExternalLink, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingsResp {
  settings: Record<string, string>;
}

const FIELDS = [
  {
    key: "VAULT_PATH" as const,
    label: "Obsidian Vault Path",
    type: "text",
    helper: "Folder containing your .md notes. Used by the Neural Map.",
    secret: false,
    service: "vault" as const,
  },
  {
    key: "HUBSPOT_PRIVATE_APP_TOKEN" as const,
    label: "Hubspot Private App Token",
    type: "password",
    helper: "Create a Private App in Hubspot and paste its access token.",
    docs: "https://developers.hubspot.com/docs/api/private-apps",
    secret: true,
    service: "hubspot" as const,
  },
  {
    key: "TRELLO_API_KEY" as const,
    label: "Trello API Key",
    type: "password",
    helper: "Both Trello fields are required together.",
    docs: "https://trello.com/app-key",
    secret: true,
    service: null,
  },
  {
    key: "TRELLO_API_TOKEN" as const,
    label: "Trello API Token",
    type: "password",
    helper: "Pairs with the API key above.",
    docs: "https://trello.com/app-key",
    secret: true,
    service: "trello" as const,
  },
  {
    key: "ANTHROPIC_API_KEY" as const,
    label: "Anthropic API Key",
    type: "password",
    helper: "Powers the chat/agent layer.",
    docs: "https://console.anthropic.com/settings/keys",
    secret: true,
    service: "anthropic" as const,
  },
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await fetch("/api/settings")).json() as Promise<SettingsResp>,
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      // For secrets, the API returns "set" or "". Use "" so the input is blank
      // until the user types — typing replaces the stored secret.
      const next: Record<string, string> = {};
      for (const f of FIELDS) {
        const v = data.settings[f.key];
        next[f.key] = f.secret ? "" : v ?? "";
      }
      setForm(next);
    }
  }, [data]);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Settings saved to .env.local");
      qc.invalidateQueries({ queryKey: ["settings"] });
    } else toast.error("Save failed");
  }

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-3xl mx-auto space-y-8">
      <header className="fade-up space-y-2">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
          <span className="h-1.5 w-1.5 rounded-full bg-primary status-dot pulse text-primary" />
          Config
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tightest leading-[1.02]">
          Settings
        </h1>
        <p className="text-[15px] text-muted-foreground max-w-[58ch] leading-relaxed">
          API keys and paths. Saved to{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code>{" "}
          — never sent anywhere.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {FIELDS.map((f) => (
            <FieldRow
              key={f.key}
              field={f}
              currentValue={form[f.key] ?? ""}
              storedState={data?.settings[f.key] ?? ""}
              onChange={(v) => setForm({ ...form, [f.key]: v })}
            />
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  currentValue,
  storedState,
  onChange,
}: {
  field: (typeof FIELDS)[number];
  currentValue: string;
  storedState: string;
  onChange: (v: string) => void;
}) {
  const [test, setTest] = useState<{ loading: boolean; ok: boolean | null; error?: string }>({
    loading: false,
    ok: null,
  });

  async function runTest() {
    if (!field.service) return;
    setTest({ loading: true, ok: null });
    const res = await fetch("/api/settings/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ service: field.service }),
    });
    const j = await res.json();
    setTest({ loading: false, ok: j.ok, error: j.error });
  }

  const stored = field.secret && storedState === "set";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>{field.label}</CardTitle>
            <CardDescription>{field.helper}</CardDescription>
          </div>
          {stored && (
            <span className="text-[10px] uppercase tracking-widest text-emerald-500 shrink-0">
              Saved
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor={field.key} className="sr-only">{field.label}</Label>
          <Input
            id={field.key}
            type={field.type}
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              field.secret && stored
                ? "•••••••••••  (leave blank to keep current)"
                : field.label
            }
          />
        </div>
        <div className="flex items-center gap-3">
          {(field as any).docs && (
            <a
              href={(field as any).docs}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              Get this key <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {field.service && (
            <Button size="sm" variant="outline" onClick={runTest} disabled={test.loading} className="ml-auto">
              {test.loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : test.ok === true ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : test.ok === false ? (
                <X className="h-3.5 w-3.5 text-destructive" />
              ) : null}
              Test connection
            </Button>
          )}
        </div>
        {test.ok === false && test.error && (
          <div className="text-xs text-destructive">{test.error}</div>
        )}
      </CardContent>
    </Card>
  );
}
