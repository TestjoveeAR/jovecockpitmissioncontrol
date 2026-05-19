"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Leaflet requires window; load it client-only.
const SalonMap = dynamic(() => import("@/components/SalonMap").then((m) => m.SalonMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full grid place-items-center">
      <Skeleton className="h-2/3 w-2/3" />
    </div>
  ),
});

export default function SalonsPage() {
  return (
    <div className="h-full w-full">
      <SalonMap />
    </div>
  );
}
