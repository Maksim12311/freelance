import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  priority?: boolean;
};

export function Logo({
  className,
  markClassName,
  showWordmark = true,
  wordmarkClassName,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="StudentPro"
        width={32}
        height={32}
        className={cn(
          "h-8 w-8 rounded-[10px] shadow-[0_8px_20px_-10px_rgba(225,29,72,0.95)]",
          markClassName,
        )}
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-heading text-lg font-semibold tracking-tight text-[#2a2124]",
            wordmarkClassName,
          )}
        >
          StudentPro
        </span>
      ) : null}
    </span>
  );
}
