"use client";

/**
 * Reusable, domain-neutral chat primitives for the `c-chat` surface (styles in
 * styles/components/_chat.scss). No planting-scheme knowledge lives here — a
 * host supplies the messages, the composer wiring, and any inline attachments.
 *
 * Pieces: ChatMessage (carries the assistant identity mark) · TypingIndicator ·
 * SendFailedNotice · QuickReplies · ChatComposer.
 */

import { forwardRef, useEffect, useId, useState, type ReactNode } from "react";
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

/** How long a reply can run before the dots admit they're still going. Long
 *  enough that a normal reply never shows it — this is Visibility of System
 *  Status for the genuinely slow case, not a progress bar for the common one. */
const STALL_MS = 6000;

/**
 * Animated "…thinking" dots with a screen-reader status label. Owns its own
 * stall timer: mounting *is* "a reply is in flight" for every host that uses
 * this, so after `STALL_MS` it quietly admits it's taking a while rather than
 * spinning forever with no signal — the same wording reaches sighted readers
 * (a visible caption) and screen-reader users (the `role="status"` region's
 * text changes, which re-announces on its own).
 */
export function TypingIndicator({ label = "Plotted is thinking" }: { label?: string }) {
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setStalled(true), STALL_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="c-chat__typing" role="status">
      <span className="c-chat__typing-dot" />
      <span className="c-chat__typing-dot" />
      <span className="c-chat__typing-dot" />
      {stalled && <span className="c-chat__typing-stall minion">Still thinking…</span>}
      <span className="u-visually-hidden">{stalled ? "Still thinking" : label}</span>
    </div>
  );
}

/**
 * The calm failure affordance for a turn that didn't go through — a network
 * drop or a model error, once this is wired to a real endpoint. Attaches
 * under the optimistic bubble it belongs to, in the same quiet marigold
 * `role="alert"` convention as every other inline error in the app (see
 * `Input.tsx` / `Select.tsx`): the bubble itself is untouched (it's still
 * what the gardener said or chose), so only this line — not the whole
 * message — reads as a problem.
 *
 * Two ways out, both real: Retry re-attempts the same turn; Discard drops it
 * and returns the surface to idle without resending. Neither is hidden behind
 * the other, so the host is never left with only a dead end.
 */
export function SendFailedNotice({
  onRetry,
  onDiscard,
  label = "Couldn't send",
}: {
  onRetry: () => void;
  onDiscard: () => void;
  label?: string;
}) {
  return (
    <div className="c-chat__failed minion" role="alert">
      <Icon name="alertTriangle" size={14} className="c-chat__failed-icon" />
      <span>{label}.</span>
      <button type="button" className="c-chat__failed-action" onClick={onRetry}>
        <Icon name="retry" size={12} />
        Retry
      </button>
      <button type="button" className="c-chat__failed-action" onClick={onDiscard}>
        Discard
      </button>
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
