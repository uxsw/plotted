"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

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
}

export function Modal({
  isOpen,
  onClose,
  children,
  panelClassName,
  labelledBy,
  backdropOpacity = 0.4,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (firstFocusable ?? panelRef.current)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
