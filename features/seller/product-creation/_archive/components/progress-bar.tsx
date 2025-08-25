"use client";

import { cn } from "@/lib/utils";


type Props = { current: number; total: number };

export default function ProgressBar({ current, total }: Props) {
  // Avoid divide-by-zero
  const pct = total > 1 ? (current / (total - 1)) * 100 : 0;

  return (
    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700">
      <div
        className={cn("h-full transition-all duration-300", "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
