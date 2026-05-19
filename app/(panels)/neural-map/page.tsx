"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const NeuralMap = dynamic(
  () => import("@/components/NeuralMap").then((m) => m.NeuralMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full grid place-items-center">
        <Skeleton className="h-2/3 w-2/3" />
      </div>
    ),
  }
);

function NeuralMapWrapper() {
  const params = useSearchParams();
  const section = params.get("section");
  return <NeuralMap initialSection={section} />;
}

export default function NeuralMapPage() {
  return (
    <div className="h-full w-full">
      <Suspense fallback={<div className="h-full w-full" />}>
        <NeuralMapWrapper />
      </Suspense>
    </div>
  );
}
