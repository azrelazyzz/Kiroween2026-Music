import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ className, id, label, hint, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="grid gap-2 text-sm text-[var(--muted)]" htmlFor={inputId}>
      <span className="font-medium text-[var(--paper)]">{label}</span>
      <input
        id={inputId}
        className={cn(
          "h-12 w-full rounded-2xl border border-white/12 bg-white/[0.055] px-4 text-base text-[var(--paper)] transition outline-none placeholder:text-white/30 focus:border-[var(--brass)] focus:ring-2 focus:ring-[var(--brass)]/20",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs leading-relaxed">{hint}</span> : null}
    </label>
  );
}
