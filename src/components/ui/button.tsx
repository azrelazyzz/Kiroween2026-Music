import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold tracking-[-0.01em] transition-[transform,background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)] disabled:pointer-events-none disabled:opacity-45 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--oxblood)] text-white shadow-[0_12px_28px_rgba(96,23,37,0.28)] hover:bg-[#a53a4c]",
        secondary: "bg-[var(--paper)] text-[var(--ink)] hover:bg-white",
        outline:
          "border border-white/18 bg-white/5 text-[var(--paper)] hover:bg-white/10",
        ghost: "text-current hover:bg-current/8",
        danger: "bg-red-900 text-white hover:bg-red-800",
      },
      size: {
        default: "h-11",
        small: "h-9 min-h-9 px-4 text-xs",
        icon: "size-11 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
