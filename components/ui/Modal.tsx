"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/* Nothing to subscribe to — this only needs the client/server snapshot
   split. The recommended shape for an SSR-safe "has this mounted on the
   client yet" check (see react.dev), and it sidesteps the
   react-hooks/set-state-in-effect lint rule a plain
   useEffect(() => setMounted(true), []) trips. */
function noopSubscribe() {
  return () => {};
}

function useIsMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Appended to the panel's base `.o-dialog` class — e.g. to widen a
   *  dialog whose content outgrows the default 24rem confirm-dialog size. */
  panelClassName?: string;
  /** Sets `aria-labelledby` on the panel, pointing at the id of the
   *  dialog's own visible heading. Omit to fall back to no accessible name
   *  beyond the dialog role (acceptable for a short confirm-style body). */
  labelledBy?: string;
  /** Backdrop darkness, 0–1. Default 0.4 suits a quick confirm dialog where
   *  the page behind stays legible context; a dialog asking for real
   *  attention (an onboarding moment, first content a gardener meets) wants
   *  the page behind it read as clearly dismissed, not merely dimmed. */
  backdropOpacity?: number;
  /** CSS selector for the element that should receive focus on open,
   *  instead of the default "first focusable descendant in DOM order".
   *  The default is right for most dialogs (usually a single primary
   *  action or a short form), but wrong for one whose first focusable
   *  descendant is secondary navigation — e.g. a carousel's step dots
   *  sitting before its Next button. Point this at a `tabIndex={-1}`
   *  heading or similar; falls back to the default if nothing matches. */
  initialFocusSelector?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  panelClassName,
  labelledBy,
  backdropOpacity = 0.4,
  initialFocusSelector,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  /* document.body doesn't exist during SSR — a client component still
     renders server-side for its initial HTML. Most callers only flip
     isOpen to true from a client event (safe by then), but one
     (SchemeWelcomeDialog) opens on mount, so this guard is load-bearing,
     not defensive-for-nothing. Portal only once mounted on the client. */
  const mounted = useIsMounted();

  useEffect(() => {
    /* Also gated on `mounted`, not just `isOpen`: the portal (and
       panelRef) doesn't exist yet on the render where `mounted` is still
       false, so an effect that only depends on [isOpen, onClose] would
       capture panelRef.current as null forever — silently killing both
       the initial focus and the Tab trap below, since neither a ref
       attaching nor `mounted` flipping true re-runs an effect that isn't
       listed as depending on either. */
    if (!isOpen || !mounted) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const panel = panelRef.current;
    const preferred = initialFocusSelector
      ? panel?.querySelector<HTMLElement>(initialFocusSelector)
      : null;
    const firstFocusable = panel ? getFocusable(panel)[0] : undefined;
    (preferred ?? firstFocusable ?? panel)?.focus();

    /* Keyboard trap: Escape closes, Tab/Shift+Tab cycle within the panel
       instead of escaping into whatever the backdrop is still covering.
       Re-queries focusable descendants on every Tab press rather than
       caching them once, since a modal's content can change while open
       (e.g. the welcome dialog's step-by-step carousel). */
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, mounted, onClose, initialFocusSelector]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: `rgba(43,42,36,${backdropOpacity})` }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={panelClassName ? `o-dialog ${panelClassName}` : "o-dialog"}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.06'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "300px 300px",
          backgroundBlendMode: "multiply",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
