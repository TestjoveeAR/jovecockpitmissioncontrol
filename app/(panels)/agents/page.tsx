"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, MessageSquare, Settings as SettingsIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatRelativeDate, cn } from "@/lib/utils";

interface Agent {
  id: number;
  name: string;
  description: string;
  systemPrompt: string | null;
  status: string;
  lastRun: string | null;
}

const STATUS_VARIANT: Record<string, "muted" | "success" | "warning"> = {
  not_deployed: "muted",
  active: "success",
  paused: "warning",
};
const STATUS_LABEL: Record<string, string> = {
  not_deployed: "Not deployed",
  active: "Active",
  paused: "Paused",
};

export default function AgentsPage() {
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => (await fetch("/api/agents")).json(),
  });
  const agents: Agent[] = data?.agents ?? [];

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 fade-up">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-primary status-dot pulse text-primary" />
            Agents · 3 waves
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tightest leading-[1.02]">
            Agents Hub
          </h1>
          <p className="text-[15px] text-muted-foreground max-w-[58ch] leading-relaxed">
            AI agents that run Jovée operations day-to-day. Deploy in waves —
            start with read-only summarizers, then move to outreach, then automation.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={1.75} /> New agent
        </Button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a, i) => (
            <article
              key={a.id}
              className={cn(
                "card-lift relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-diffuse",
                "fade-up",
                i < 5 && `fade-up-${i + 1}`
              )}
            >
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-2xl bg-primary/12 grid place-items-center shrink-0 ring-1 ring-inset ring-primary/25">
                  <Bot className="h-[18px] w-[18px] text-primary" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-[15px] font-semibold tracking-tight">
                    {a.name}
                  </h3>
                  <Badge variant={STATUS_VARIANT[a.status] ?? "muted"} className="mt-1.5">
                    <span
                      className={cn(
                        "status-dot",
                        a.status === "active" && "pulse"
                      )}
                      style={{ backgroundColor: "currentColor", color: "currentColor" }}
                    />
                    {STATUS_LABEL[a.status] ?? a.status}
                  </Badge>
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground mt-4 leading-relaxed line-clamp-3 max-w-[40ch]">
                {a.description}
              </p>
              <div className="text-[11px] text-muted-foreground/70 mt-3 font-mono">
                Last run: {a.lastRun ? formatRelativeDate(a.lastRun) : "never"}
              </div>
              <div className="mt-5 flex gap-2 pt-4 border-t border-border/60">
                <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>
                  <SettingsIcon className="h-3.5 w-3.5" strokeWidth={1.75} /> Configure
                </Button>
                {a.status === "active" && (
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Chat — coming soon")}>
                    <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> Chat
                  </Button>
                )}
              </div>
            </article>
          ))}

          <button
            onClick={() => setNewOpen(true)}
            className="card-lift group rounded-2xl border border-dashed border-border/70 grid place-items-center text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-card/30 transition-colors min-h-[200px]"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-muted/40 grid place-items-center group-hover:bg-primary/12 group-hover:text-primary transition-colors">
                <Plus className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <span className="font-medium">New agent</span>
            </div>
          </button>
        </div>
      )}

      <NewAgentDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={() => qc.invalidateQueries({ queryKey: ["agents"] })}
      />

      {editing && (
        <ConfigureAgentDialog
          agent={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["agents"] });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function NewAgentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ name: "", description: "", systemPrompt: "" });
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (!form.name || !form.description) {
      toast.error("Name and description required");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Agent created");
      onCreated();
      onOpenChange(false);
      setForm({ name: "", description: "", systemPrompt: "" });
    } else toast.error("Create failed");
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New agent</DialogTitle>
          <DialogDescription>
            Describe what the agent should do. You can wire it up to Claude later in Settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>System prompt (optional)</Label>
            <Textarea
              rows={4}
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              placeholder="You are an agent that…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfigureAgentDialog({
  agent,
  onClose,
  onSaved,
}: {
  agent: Agent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: agent.name,
    description: agent.description,
    systemPrompt: agent.systemPrompt ?? "",
    status: agent.status,
  });
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    const res = await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Updated");
      onSaved();
    } else toast.error("Update failed");
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure agent</DialogTitle>
          <DialogDescription>{agent.name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="not_deployed">Not deployed</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>System prompt</Label>
            <Textarea
              rows={5}
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
