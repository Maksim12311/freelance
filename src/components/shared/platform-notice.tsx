import { Info } from "lucide-react";

export function PlatformNotice({
  title = "StudentPro connects students",
  children,
  compact = false,
}: {
  title?: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <p className="flex items-start gap-2 text-xs leading-relaxed text-[#6f5f64]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e11d48]/80" />
        <span>
          {children ??
            `${title}. You arrange details yourselves — we don’t process service payments or guarantee outcomes.`}
        </span>
      </p>
    );
  }

  return (
    <div className="flex gap-3 rounded-2xl border border-[#f0d5db] bg-[#fff8f9] px-4 py-3 text-sm text-[#5c4a4f]">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#e11d48]" />
      <div>
        <p className="font-medium text-[#2a2124]">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-[#6f5f64]">
          {children ??
            "You agree on details independently and comply with applicable laws. StudentPro does not process service payments, employ students, or guarantee quality."}
        </p>
      </div>
    </div>
  );
}
