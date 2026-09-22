"use client";

/**
 * The one-time "how a scheme comes together" interstitial — a dialog over
 * the hub, not a separate page. SchemesHub renders it unconditionally
 * alongside the real hub (see page.tsx's showWelcome gate); the hub is
 * already there underneath, so dismissing it reveals the page the gardener
 * was already on, rather than navigating anywhere.
 *
 * Content is OnboardingCarousel — one step at a time, not a static grid —
 * see its own doc comment for why. This component owns the dialog's
 * chrome: a heavier backdrop than a routine confirm dialog (a first
 * impression earns real attention, not a page merely dimmed behind it), the
 * accessible name (a stable, visually-hidden heading — the carousel's own
 * per-slide title is content, not a fitting target for aria-labelledby,
 * since it changes under the gardener as they step through), and an
 * explicit close button.
 *
 * That close button IS the skip option: three short steps don't need a
 * second, separate "Skip" link alongside Escape and the backdrop click the
 * shared Modal already offers — one more affordance to notice would be
 * friction this brief explicitly asked to avoid. A visible, tappable X
 * (mobile has no Escape key, and the backdrop's tap target shrinks with the
 * panel) is the one genuinely new affordance worth adding.
 *
 * Marks itself seen on mount, the same fire-and-forget convention
 * SchemeResults.tsx uses for its own one-time notices — being shown IS
 * being seen; every dismissal path (finish, close, Escape, backdrop) closes
 * the same way and none of them un-sees it.
 *
 * Initial focus goes to this heading (`initialFocusSelector`), not
 * Modal's own default of "first focusable descendant" — that default
 * would land on the carousel's first step-dot, a secondary navigation
 * aid, ahead of any real content or the primary Next action. `tabIndex=
 * {-1}` makes the heading a valid, if unusual, focus target without
 * adding a tab stop; a screen reader announces the dialog's name first,
 * same as opening any well-behaved modal.
 *
 * Finish is the one exit that isn't a plain close, though (see `finish`
 * below) — a critique caught the carousel's last step promising "Choose
 * your plants" and then just closing, identical to every other exit. A
 * first-time gardener who just read the whole pitch and clicked the
 * confident button deserves to land somewhere, not nowhere.
 *
 * Styles: `.c-scheme-welcome-dialog` in styles/components/_scheme-hub.scss.
 */

import { useEffect, useId, useState } from "react";
import clsx from "clsx";
import { Modal } from "@/components/ui/Modal";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";
import { markSchemeOnboardingSeen } from "@/app/actions/schemes";
import OnboardingCarousel from "./OnboardingCarousel";

export default function SchemeWelcomeDialog({ markSeen = true }: { markSeen?: boolean }) {
  const [open, setOpen] = useState(true);
  const titleId = useId();

  useEffect(() => {
    if (markSeen) markSchemeOnboardingSeen();
  }, [markSeen]);

  function close() {
    setOpen(false);
  }

  /* Finishing the carousel (not skipping it) hands off to the real task:
     close, then — once the dialog's own unmount has handed focus back per
     Modal's own restore-focus effect — steal it back onto the "Add a
     plant" field and scroll it into view. A plain requestAnimationFrame is
     enough; the field already exists in the DOM underneath (the hub is
     rendered the whole time, per this file's own opening note), so there's
     no data to wait on, just a paint to let happen first. Distinct from
     `close` on purpose: Escape/backdrop/X are a gardener saying "let me
     just look around," not "take me to the field" — only the button that
     says so does. */
  function finish() {
    close();
    requestAnimationFrame(() => {
      const field = document.querySelector<HTMLInputElement>(
        '[data-onboarding-target="add-plant-field"]'
      );
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      field?.focus({ preventScroll: true });
    });
  }

  return (
    <Modal
      isOpen={open}
      onClose={close}
      panelClassName="c-scheme-welcome-dialog"
      labelledBy={titleId}
      backdropOpacity={0.75}
      initialFocusSelector="[data-modal-initial-focus]"
    >
      <h2 id={titleId} tabIndex={-1} data-modal-initial-focus className="u-visually-hidden">
        Welcome to planting schemes
      </h2>

      <OnboardingCarousel onFinish={finish} />

      <button
        type="button"
        onClick={close}
        aria-label="Skip — go straight to planting schemes"
        className={clsx(
          buttonStyles["o-button"],
          buttonStyles["o-button--ghost"],
          buttonStyles["o-button--icon"],
          "c-scheme-welcome-dialog__close"
        )}
      >
        <Icon name="close" size={18} />
      </button>
    </Modal>
  );
}
