"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Search } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface Salon {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  ownerName: string | null;
  isVietnameseOwned: boolean;
  status: string;
  lastContacted: string | null;
  notes: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  onboarded: "#10b981",
  in_conversation: "#eab308",
  contacted: "#f97316",
  cold: "#6b7280",
  declined: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  onboarded: "Onboarded",
  in_conversation: "In conversation",
  contacted: "Contacted",
  cold: "Cold",
  declined: "Declined",
};

function makeIcon(color: string) {
  // A tasteful pin-style div icon. Leaflet's default uses sprite assets that
  // break under Next bundling, so we render our own SVG-ish marker.
  const html = `<div style="
    position:relative;width:18px;height:18px;
    border-radius:9999px;background:${color};
    box-shadow:0 0 0 3px rgba(0,0,0,0.35), 0 0 0 5px ${color}40;
  "></div>`;
  return L.divIcon({
    html,
    className: "jovee-salon-marker",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const CHARLOTTE: [number, number] = [35.2271, -80.8431];

export function SalonMap() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Salon | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["salons"],
    queryFn: async () => {
      const res = await fetch("/api/salons");
      const j = await res.json();
      return j.salons as Salon[];
    },
  });

  const salons = Array.isArray(data) ? data : [];

  const counts = useMemo(() => {
    const c: Record<string, number> = { onboarded: 0, in_conversation: 0, contacted: 0, cold: 0, declined: 0 };
    for (const s of salons) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [salons]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-4 border-b border-border/60 glass px-5 py-3">
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
            Outreach · Charlotte
          </div>
          <div className="font-display text-[15px] font-semibold tracking-tight">
            {salons.length} salons mapped
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 ml-2 flex-wrap">
          <Pip color={STATUS_COLORS.onboarded} label={`${counts.onboarded} onboarded`} pulse />
          <Pip color={STATUS_COLORS.in_conversation} label={`${counts.in_conversation} in conversation`} />
          <Pip color={STATUS_COLORS.contacted} label={`${counts.contacted} contacted`} />
          <Pip color={STATUS_COLORS.cold} label={`${counts.cold} cold`} />
          <Pip color={STATUS_COLORS.declined} label={`${counts.declined} declined`} />
        </div>
        <Button size="sm" className="ml-auto" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={1.75} /> Add salon
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.info("CSV import — coming soon")}
        >
          Import CSV
        </Button>
      </div>

      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground bg-background/60 z-[500]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        <MapContainer
          center={CHARLOTTE}
          zoom={11}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
          {salons.map((s) => (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={makeIcon(STATUS_COLORS[s.status] ?? "#6b7280")}
              eventHandlers={{ click: () => setSelected(s) }}
            />
          ))}
          <Recenter salons={salons} />
        </MapContainer>
      </div>

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent>
          {selected && (
            <SalonDrawer
              salon={selected}
              onClose={() => setSelected(null)}
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ["salons"] });
                setSelected(null);
              }}
            />
          )}
        </DrawerContent>
      </Drawer>

      <AddSalonDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={() => qc.invalidateQueries({ queryKey: ["salons"] })}
      />
    </div>
  );
}

function Pip({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground">
      <span
        className={`status-dot ${pulse ? "pulse" : ""}`}
        style={{ backgroundColor: color, color }}
      />
      {label}
    </div>
  );
}

function Recenter({ salons }: { salons: Salon[] }) {
  const map = useMap();
  useEffect(() => {
    if (!salons.length) return;
    // Don't auto-fit aggressively; just trigger a redraw so markers paint.
    map.invalidateSize();
  }, [salons, map]);
  return null;
}

function SalonDrawer({
  salon,
  onSaved,
}: {
  salon: Salon;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(salon.status);
  const [notes, setNotes] = useState(salon.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/salons/${salon.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status,
        notes,
        lastContacted: status !== "cold" ? new Date().toISOString() : salon.lastContacted,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Salon updated");
      onSaved();
    } else {
      toast.error("Update failed");
    }
  }

  return (
    <>
      <DrawerHeader>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[salon.status] }}
          />
          <Badge variant="muted" className="text-[10px]">
            {STATUS_LABELS[salon.status] ?? salon.status}
          </Badge>
          {salon.isVietnameseOwned && (
            <Badge variant="secondary" className="text-[10px]">VN-owned</Badge>
          )}
        </div>
        <DrawerTitle>{salon.name}</DrawerTitle>
        <DrawerDescription>
          {salon.address}, {salon.city}, {salon.state} {salon.zip ?? ""}
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody>
        <div className="space-y-4 text-sm">
          {salon.ownerName && (
            <Field label="Owner" value={salon.ownerName} />
          )}
          {salon.phone && <Field label="Phone" value={salon.phone} />}
          {salon.lastContacted && (
            <Field
              label="Last contacted"
              value={new Date(salon.lastContacted).toLocaleDateString()}
            />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="cold">Cold (not contacted)</option>
              <option value="contacted">Contacted (no response)</option>
              <option value="in_conversation">In conversation</option>
              <option value="onboarded">Onboarded</option>
              <option value="declined">Declined</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conversation history, deal context, follow-ups…"
            />
          </div>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </DrawerFooter>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}

function AddSalonDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    zip: "",
    lat: "",
    lng: "",
    phone: "",
    ownerName: "",
    isVietnameseOwned: false,
    status: "cold",
    notes: "",
  });
  const [geo, setGeo] = useState<{ loading: boolean; ok: boolean | null }>({
    loading: false,
    ok: null,
  });
  const [saving, setSaving] = useState(false);

  async function geocode() {
    if (!form.address) {
      toast.error("Enter an address first");
      return;
    }
    setGeo({ loading: true, ok: null });
    try {
      const q = encodeURIComponent(`${form.address}, Charlotte, NC ${form.zip}`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const j = await res.json();
      if (Array.isArray(j) && j[0]?.lat && j[0]?.lon) {
        setForm((f) => ({ ...f, lat: j[0].lat, lng: j[0].lon }));
        setGeo({ loading: false, ok: true });
      } else {
        setGeo({ loading: false, ok: false });
        toast.error("Address not found — set lat/lng manually");
      }
    } catch {
      setGeo({ loading: false, ok: false });
      toast.error("Geocoder unreachable");
    }
  }

  async function submit() {
    if (!form.name || !form.address || !form.lat || !form.lng) {
      toast.error("Need name, address, lat, and lng");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/salons", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        address: form.address,
        zip: form.zip || undefined,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        phone: form.phone || undefined,
        ownerName: form.ownerName || undefined,
        isVietnameseOwned: form.isVietnameseOwned,
        status: form.status,
        notes: form.notes || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Salon added");
      onAdded();
      onOpenChange(false);
      setForm({
        name: "",
        address: "",
        zip: "",
        lat: "",
        lng: "",
        phone: "",
        ownerName: "",
        isVietnameseOwned: false,
        status: "cold",
        notes: "",
      });
    } else {
      toast.error("Failed to add");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add salon</DialogTitle>
          <DialogDescription>
            Use the Geocode-address button to autodetect lat/lng (free via OpenStreetMap Nominatim).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2">
          <Row>
            <Field2 label="Name *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field2>
            <Field2 label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field2>
          </Row>
          <Field2 label="Address *">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field2>
          <Row>
            <Field2 label="Zip">
              <Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
            </Field2>
            <Field2 label="Owner">
              <Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            </Field2>
          </Row>
          <Row>
            <Field2 label="Latitude *">
              <Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
            </Field2>
            <Field2 label="Longitude *">
              <Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
            </Field2>
          </Row>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={geocode} disabled={geo.loading}>
              {geo.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Geocode address
            </Button>
            {geo.ok === true && <span className="text-xs text-emerald-500">✓ Found</span>}
            {geo.ok === false && <span className="text-xs text-destructive">Not found</span>}
          </div>
          <Field2 label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="cold">Cold (not contacted)</option>
              <option value="contacted">Contacted (no response)</option>
              <option value="in_conversation">In conversation</option>
              <option value="onboarded">Onboarded</option>
              <option value="declined">Declined</option>
            </Select>
          </Field2>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isVietnameseOwned}
              onChange={(e) => setForm({ ...form, isVietnameseOwned: e.target.checked })}
            />
            Vietnamese-owned
          </label>
          <Field2 label="Notes">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field2>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add salon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}
function Field2({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
