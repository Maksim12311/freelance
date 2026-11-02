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
        "inline-flex rounded-full border border-[#f0d5db] bg-white/90 p-1 text-sm shadow-sm",
        className,
      )}
      role="tablist"
      aria-label="Account mode"
    >
      {(["customer", "specialist"] as const).map((mode) => {
        const active = activeMode === mode;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={pending || active}
            onClick={() =>
              startTransition(() => {
                void switchModeAction(mode);
              })
            }
            className={cn(
              "rounded-full px-3.5 py-1.5 font-medium capitalize transition duration-300",
              active
                ? "bg-[#e11d48] text-white shadow-sm"
                : "text-[#6f5f64] hover:text-[#2a2124]",
              pending ? "opacity-60" : "",
            )}
          >
            {mode}
          </button>
        );
      })}
    </div>
  );
}
