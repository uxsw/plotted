"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="o-stack">
        <h2 className="long-primer">{title}</h2>
        <p className="primer">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            onClick={onClose}
            className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--ghost"]
            )}  
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={clsx(
                  buttonStyles["o-button"],
                  buttonStyles["o-button--primary"]
                )}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
