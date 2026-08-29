import Link from "next/link";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

// First-run garden block: a blank catalogue plate waiting for its first
// specimen, rather than a dead "nothing here" panel. Paper mat inside a
// hairline frame, a mono plate number, and a faint single-stroke sprig
// pressed into the page. Copy stays factual — it names what the next
// action does, no claims.
export default function GardenEmptyPlate() {
  return (
    <section aria-label="Lately in your garden" className="c-garden-plate">
      <p className="c-garden-plate__folio o-type-label">Pl. 01</p>

      <svg
        className="c-garden-plate__sprig"
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M60 108 C60 84 60 60 60 30" />
        <path d="M60 78 C44 74 34 64 32 48 C48 48 58 58 60 74" />
        <path d="M60 62 C76 58 86 47 88 31 C72 32 62 42 60 58" />
        <path d="M60 44 C48 40 41 31 40 19 C52 20 59 29 60 41" />
        <path d="M60 30 C60 22 63 15 70 11" />
      </svg>

      <div className="c-garden-plate__body">
        <h2 className="pica o-type-display kirk">Your first plant goes here</h2>
        <p className="brevier">
          Add it and the rest of this page fills in around it.
        </p>
        <Link
          href="/plants/new"
          className={clsx(buttonStyles["o-button"], buttonStyles["o-button--primary"])}
        >
          <Icon name="add" size={16} />
          Add plant
        </Link>
      </div>
    </section>
  );
}
