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
        <label htmlFor={id} className="o-type-label text-ink-soft">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={[
            "rounded border px-3 py-2 brevier text-ink",
            "bg-paper placeholder:text-ink-soft/50",
            "transition-colors duration-150",
            error
              ? "border-marigold focus:outline-none focus:ring-2 focus:ring-marigold focus:ring-offset-1 focus:ring-offset-paper focus:border-marigold"
              : "border-sand-line focus:outline-none focus:ring-2 focus:ring-marigold focus:ring-offset-1 focus:ring-offset-paper focus:border-marigold focus:bg-marigold",
            className,
          ].join(" ")}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="minion text-marigold">
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
