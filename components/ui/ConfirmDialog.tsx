"use client";

import { useId } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  const titleId = useId();

  // Cancel comes first in the DOM, so the Modal opens with the caret on it:
  // Enter can't confirm (or delete) by accident.
  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={titleId}>
      <div className="o-stack">
        <h2 id={titleId} className="long-primer o-type-display kirk">
          {title}
        </h2>
        <p className="primer">{message}</p>
        <div className="u-justify-end o-row">
          <Button type="button" variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
