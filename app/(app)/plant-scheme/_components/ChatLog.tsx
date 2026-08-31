"use client";

/**
 * Reusable, domain-neutral chat primitives for the `c-chat` surface (styles in
 * styles/components/_chat.scss). No planting-scheme knowledge lives here — a
 * host supplies the messages, the composer wiring, and any inline attachments.
 *
 * Pieces: PlottedMark (assistant identity) · ChatMessage · TypingIndicator ·
 * QuickReplies · ChatComposer.
 */

import { forwardRef, type ReactNode } from "react";

export type ChatRole = "assistant" | "user";

/** The assistant's identity mark — a single-stroke sprout in the brand accent. */
export function PlottedMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 18V8" />
      <path d="M10 11.5C6.4 11 3.8 8.4 3.3 4.8 6.9 5.3 9.5 7.9 10 11.5Z" />
      <path d="M10 9.5C13 9 15 6.6 15.4 3.6 12.4 4 10.4 6 10 9.5Z" />
    </svg>
  );
}

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
          <PlottedMark className="c-chat__avatar" />
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

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 13.5V3" />
      <path d="M3.5 7.5 8 3l4.5 4.5" />
    </svg>
  );
}

/**
 * Auto-growing composer. Enter sends; Shift+Enter inserts a newline. Focus is
 * the host's to manage after a send (keep it here).
 */
export const ChatComposer = forwardRef<
  HTMLTextAreaElement,
  {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    placeholder: string;
    ariaLabel: string;
    disabled?: boolean;
  }
>(function ChatComposer(
  { value, onChange, onSend, placeholder, ariaLabel, disabled = false },
  ref
) {
  return (
    <div className="c-chat__composer">
      <textarea
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
        <SendIcon />
      </button>
    </div>
  );
});
