"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { buttonStyles } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const FeedbackModal = dynamic(() => import("./FeedbackModal"), { ssr: false });

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className={[
          buttonStyles["o-button"],
          buttonStyles["o-button--primary"],
          buttonStyles["o-button--pill"],
          // positional + shadow are component-level concerns, not o-button's
          "fixed bottom-6 right-6 z-50 shadow-lg",
        ].join(" ")}
      >
        <Icon name="message" aria-label="Send feedback" /> 
        Feedback
      </button>

      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}
