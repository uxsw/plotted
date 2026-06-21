"use client";

import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className="text-xs font-semibold font-sans uppercase tracking-wider text-ink-soft"
          style={{ fontVariant: "small-caps" }}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={[
            "rounded border px-3 py-2 text-sm font-sans text-ink",
            "bg-paper placeholder:text-ink-soft/50",
            "transition-colors duration-150",
            error
              ? "border-clay focus:outline-none focus:ring-2 focus:ring-clay focus:ring-offset-1 focus:ring-offset-paper focus:border-clay"
              : "border-sand-line focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-1 focus:ring-offset-paper focus:border-moss focus:bg-moss-tint/30",
            className,
          ].join(" ")}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs font-sans text-clay">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
