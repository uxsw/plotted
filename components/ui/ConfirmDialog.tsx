"use client";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          <p className="text-sm font-sans text-ink-soft">{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
