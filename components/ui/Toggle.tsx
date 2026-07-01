"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="font-sans text-sm text-ink">{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          checked ? "bg-moss" : "bg-sand-line",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-150",
            checked ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

export { Toggle };
export type { ToggleProps };
