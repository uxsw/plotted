"use client";

/**
 * Reusable, domain-neutral chat primitives for the `c-chat` surface (styles in
 * styles/components/_chat.scss). No planting-scheme knowledge lives here — a
 * host supplies the messages, the composer wiring, and any inline attachments.
 *
 * Pieces: ChatMessage (carries the assistant identity mark) · TypingIndicator ·
 * QuickReplies · ChatComposer.
 */

import { forwardRef, useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export type ChatRole = "assistant" | "user";

/**
 * One message. Render `showFrom` on the first of a run of same-role messages so
 * the attribution line ("Plotted") isn't repeated on every bubble.
 */
export function ChatMessage({
  role,
  showFrom = false,
  fromLabel = "Plotted",
  children,
}: {
  role: ChatRole;
  showFrom?: boolean;
  fromLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className={`c-chat__msg c-chat__msg--${role}`}>
      {showFrom && role === "assistant" && (
        <span className="c-chat__from o-type-label">
          <Icon name="sprout" size={20} className="c-chat__avatar" />
          {fromLabel}
        </span>
      )}
      <div className="c-chat__bubble primer">{children}</div>
    </div>
  );
}

/** Animated "…thinking" dots with a screen-reader status label. */
export function TypingIndicator({ label = "Plotted is thinking" }: { label?: string }) {
  return (
    <div className="c-chat__typing" role="status">
      <span />
      <span />
      <span />
      <span className="u-visually-hidden">{label}</span>
    </div>
  );
}

/** Tappable quick replies shown above the composer for the current turn. */
export function QuickReplies({
  options,
  onPick,
  disabled = false,
}: {
  options: string[];
  onPick: (value: string) => void;
  disabled?: boolean;
}) {
  if (options.length === 0) return null;
  return (
    <div className="c-chat__chips">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="c-chat__chip brevier"
          disabled={disabled}
          onClick={() => onPick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/**
 * Auto-growing composer. Enter sends; Shift+Enter inserts a newline. Focus is
 * the host's to manage after a send (keep it here).
 *
 * `label` is the gardener's side of the correspondence — shown, in the same
 * mono-and-mark treatment as the assistant's attribution line, so the input
 * reads as the next turn in the conversation rather than as page furniture. It
 * also supplies the field's accessible name; `ariaLabel` overrides that name
 * for hosts that need a longer one than the visible label.
 */
export const ChatComposer = forwardRef<
  HTMLTextAreaElement,
  {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    placeholder: string;
    label: string;
    ariaLabel?: string;
    disabled?: boolean;
  }
>(function ChatComposer(
  { value, onChange, onSend, placeholder, label, ariaLabel, disabled = false },
  ref
) {
  const id = useId();
  return (
    <div className="c-chat__composer">
      <label className="c-chat__composer-label o-type-label" htmlFor={id}>
        <Icon name="pencil" size={16} className="c-chat__composer-mark" />
        {label}
      </label>
      <div className="c-chat__composer-row">
        <textarea
          id={id}
          ref={ref}
          className="c-chat__input brevier"
          rows={1}
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button
          type="button"
          className="c-chat__send"
          onClick={onSend}
          disabled={disabled || value.trim().length === 0}
          aria-label="Send message"
        >
          <Icon name="send" size={16} />
        </button>
      </div>
    </div>
  );
});
