"use client";

import { useTransition } from "react";
import { switchModeAction } from "@/lib/actions/mode";
import { cn } from "@/lib/utils";

export function ModeSwitcher({
  activeMode,
  className,
}: {
  activeMode: "customer" | "specialist";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm",
        className,
      )}
    >
      {(["customer", "specialist"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          disabled={pending || activeMode === mode}
          onClick={() => startTransition(() => void switchModeAction(mode))}
          className={cn(
            "rounded-lg px-3 py-1.5 font-medium capitalize transition",
            activeMode === mode
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800",
          )}
        >
          {mode} mode
        </button>
      ))}
    </div>
  );
}
