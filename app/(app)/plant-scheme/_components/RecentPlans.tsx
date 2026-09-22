/**
 * The hub's "Recent plans" row — a glance at the last few plans, not a
 * browsing surface. Full management (rename, delete, retry a failed
 * generation) lives on /plant-scheme/plans; this row only previews and
 * links there. See the layout note in SchemesHub.tsx for why the finished
 * plans grid moved out of the hub entirely.
 *
 * Mobile: a horizontal scroller (the app's established
 * scroller-on-narrow-viewport idiom, e.g. the dashboard's card scrollers).
 * From --breakpoint-tablet: a plain row — three cards is never worth a
 * scroll affordance once there's room to just show them.
 *
 * Styles: `.c-recent-plans` in styles/components/_scheme-hub.scss.
 */

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";
import type { SchemeSummary } from "@/components/SchemeList";

const RECENT_COUNT = 3;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* Duplicated from SchemeList.tsx / SchemeCardScroller.tsx rather than
   shared — matches how those two already each carry their own copy. */
function SchemeIllustration() {
  return (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M24 78V50M24 50C24 50 17 44 17 34M24 50C24 50 31 44 31 34"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M48 78V38M48 38C48 38 39 30 39 18M48 38C48 38 57 30 57 18"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M72 78V54M72 54C72 54 65 48 65 40M72 54C72 54 79 48 79 40"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M12 78h72" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function RecentPlans({
  plans,
  plansError,
}: {
  plans: SchemeSummary[];
  plansError: string | null;
}) {
  if (plansError) {
    return (
      <section className="c-recent-plans" aria-labelledby="recent-plans-heading">
        <h2 id="recent-plans-heading" className="pica o-type-display kirk">
          Recent plans
        </h2>
        <p className="brevier c-scheme-hub__error" role="alert">
          Couldn&apos;t load your plans ({plansError}). Try refreshing the page.
        </p>
      </section>
    );
  }

  if (plans.length === 0) return null;

  const recent = plans.slice(0, RECENT_COUNT);

  return (
    <section className="c-recent-plans" aria-labelledby="recent-plans-heading">
      <div className="c-recent-plans__head">
        <h2 id="recent-plans-heading" className="pica o-type-display kirk">
          Recent plans
        </h2>
        <Link
          href="/plant-scheme/plans"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"],
            buttonStyles["o-button--flush-start"]
          )}
        >
          View all
          <Icon name="right" size={16} />
        </Link>
      </div>

      <ul className="c-recent-plans__row">
        {recent.map((scheme) => (
          <li key={scheme.id}>
            {scheme.status === "failed" ? (
              <Link href="/plant-scheme/plans" className="c-recent-plans__card is-failed">
                <div className="c-recent-plans__media is-failed">
                  <Icon name="alertTriangle" size={20} />
                </div>
                <div className="c-recent-plans__body">
                  <p className="brevier c-recent-plans__failed-label">Couldn&apos;t be generated</p>
                  <p className="minion c-recent-plans__date">{formatDate(scheme.created_at)}</p>
                </div>
              </Link>
            ) : (
              <Link href={`/schemes/${scheme.id}`} className="c-recent-plans__card">
                <div className="c-recent-plans__media">
                  {scheme.source_plant_photos[0] ? (
                    <Image
                      src={scheme.source_plant_photos[0]}
                      alt=""
                      fill
                      sizes="(max-width: 860px) 65vw, 20vw"
                      className="c-recent-plans__photo"
                    />
                  ) : (
                    <div className="c-recent-plans__placeholder">
                      <SchemeIllustration />
                    </div>
                  )}
                </div>
                <div className="c-recent-plans__body">
                  <h3 className="long-primer o-type-display kirk o-type-leading--tight">
                    {scheme.name ?? "Unnamed scheme"}
                  </h3>
                  <p className="minion c-recent-plans__date">{formatDate(scheme.created_at)}</p>
                </div>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
