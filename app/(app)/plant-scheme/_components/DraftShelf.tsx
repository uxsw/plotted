/**
 * The hub's "Carry on" shelf — schemes still in conversation.
 *
 * Each draft's face is its own border elevation, half-drawn: the silhouettes
 * of what's on its list so far, dashed ghosts where a tier is still empty. It
 * is the workspace's sketch reused as a thumbnail (drawn at rest; the draw-in
 * animation belongs to the workspace), so a draft reads as a border partway
 * planted rather than a row of stats.
 *
 * Styles: `.c-scheme-drafts` / `.c-scheme-draft` in _scheme-hub.scss.
 */

import { Icon } from "@/components/ui/Icon";
import BorderElevation from "./BorderElevation";
import type { SchemeDraft } from "./mockDrafts";

function listNote(count: number): string {
  if (count === 0) return "Still answering questions";
  return `${count} plant${count === 1 ? "" : "s"} on the list`;
}

export default function DraftShelf({ drafts }: { drafts: SchemeDraft[] }) {
  return (
    <ul className="c-scheme-drafts">
      {drafts.map((draft) => (
        <li key={draft.id}>
          {/* A full page load, not client navigation: the mock workspace seed
              only applies to a directly opened ?preview=1 URL. */}
          <a href={draft.href} className="c-scheme-draft">
            <span className="c-scheme-draft__figure" aria-hidden="true">
              <BorderElevation plants={draft.plants} />
            </span>
            <span className="c-scheme-draft__body">
              <span className="c-scheme-draft__name long-primer o-type-display kirk">
                {draft.name}
              </span>
              <span className="c-scheme-draft__meta minion">
                {listNote(draft.plants.length)} · {draft.lastWorkedOn}
              </span>
              <span className="c-scheme-draft__last brevier">
                <span className="o-type-label">
                  {draft.lastSpeaker === "assistant" ? "Plotted" : "You"}
                </span>{" "}
                {draft.lastMessage}
              </span>
              <span className="c-scheme-draft__go o-type-label">
                Carry on
                <Icon name="arrowRight" size={14} className="c-scheme-draft__arrow" />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
