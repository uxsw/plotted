"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <label htmlFor={id} className="o-toggle__label">
      <span className="brevier">{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "o-toggle__action",
          checked ? "is-checked" : "foo",
        ].join(" ")}
      >
        <span
          className={[
            "is-switch",
            checked ? "ta" : "tb",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

export { Toggle };
export type { ToggleProps };
