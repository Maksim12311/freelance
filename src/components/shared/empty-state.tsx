import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#f0d5db] bg-[#fff8f9] px-6 py-12 text-center",
        className,
      )}
    >
      <h3 className="font-heading text-lg font-semibold text-[#2a2124]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#6f5f64]">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
