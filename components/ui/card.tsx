import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  id,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-xl border border-[#E2DDD2] bg-[#FFFEFA] dark:bg-[#1E2333] dark:border-[#333C52] text-[#252821] dark:text-[#E2E8F0]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: "neutral" | "forest" | "gold" | "warning" | "danger";
  className?: string;
}) {
  const styles = {
    neutral:
      "bg-[#EFECE4] text-[#252821] border-[#DDD7C9] dark:bg-[#242A3D] dark:text-[#E2E8F0] dark:border-[#333C52]",
    forest:
      "bg-[#173B30]/10 text-[#173B30] border-[#173B30]/20 dark:bg-[#0E2E23] dark:text-[#34D399] dark:border-[#1E4D3D]",
    gold:
      "bg-[#C4A46B]/18 text-[#6E5629] border-[#C4A46B]/40 dark:bg-[#2E2413] dark:text-[#FBBF24] dark:border-[#523F1E]",
    warning:
      "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    danger:
      "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

