"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { useId } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
}

function Select({
  label,
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  error,
  disabled,
  id: idProp,
}: SelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const errorId = `${id}-error`;
  const labelId = `${id}-label`;

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="o-type-label text-ink-soft">
        {label}
      </span>
      <RadixSelect.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          id={id}
          aria-labelledby={labelId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={[
            "flex items-center justify-between rounded border px-3 py-2",
            "brevier text-left w-full",
            "bg-paper transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-paper",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-marigold text-marigold focus:ring-marigold"
              : "border-sand-line text-ink focus:ring-marigold focus:border-marigold focus:bg-marigold",
          ].join(" ")}
        >
          <RadixSelect.Value placeholder={<span className="text-ink-soft/50">{placeholder}</span>} />
          <RadixSelect.Icon>
            <svg
              className="w-4 h-4 text-ink-soft shrink-0 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className={[
              "z-50 min-w-[var(--radix-select-trigger-width)] rounded-lg border border-sand-line",
              "bg-paper shadow-md overflow-hidden",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2",
            ].join(" ")}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className={[
                    "flex items-center px-3 py-2 brevier text-ink rounded cursor-pointer",
                    "select-none outline-none",
                    "data-[highlighted]:bg-marigold data-[highlighted]:text-ink",
                    "data-[state=checked]:font-medium",
                  ].join(" ")}
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && (
        <p id={errorId} role="alert" className="minion text-marigold">
          {error}
        </p>
      )}
    </div>
  );
}

export { Select };
export type { SelectProps, SelectOption };
