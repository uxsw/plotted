"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-moss text-white hover:bg-moss-deep disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "border border-moss text-moss bg-transparent hover:bg-moss-tint disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "text-ink-soft bg-transparent hover:bg-sand cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "bg-clay text-white hover:bg-clay-deep disabled:opacity-50 disabled:cursor-not-allowed",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          "inline-flex items-center justify-center gap-2",
          "rounded px-4 py-2 text-sm font-medium font-sans",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          variantClasses[variant],
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, Variant as ButtonVariant };
