"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { buttonStyles } from "@/components/ui/Button";

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
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1.5 2C1.22386 2 1 2.22386 1 2.5V10.5C1 10.7761 1.22386 11 1.5 11H4V13.5C4 13.6893 4.10892 13.8613 4.27924 13.9436C4.44955 14.0259 4.65183 14.0038 4.8 13.875L7.9375 11H13.5C13.7761 11 14 10.7761 14 10.5V2.5C14 2.22386 13.7761 2 13.5 2H1.5Z"
            fill="currentColor"
          />
        </svg>
        Feedback
      </button>

      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}
