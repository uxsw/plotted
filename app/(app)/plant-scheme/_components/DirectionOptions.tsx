"use client";

/**
 * The "which direction?" attachment: a choose-one set of plates inside a chat
 * panel, each standing for one planting style.
 *
 * Every row carries a choose-one mark — an empty checkbox that animates to a
 * checked one on hover, previewing the pick before it is made, and stays
 * checked once it is. Choosing closes the group: from that point the panel is
 * a record of a decision, and the conversation carries on in the composer
 * (which is what the assistant's reply invites) — the same "current turn
 * only" contract the quick-reply chips have.
 *
 * A labelled group of `aria-pressed` buttons rather than a `radiogroup`: these
 * act on click, so they are one-shot actions, not a selection you commit
 * later. A real radiogroup would owe arrow-key navigation, and arrow keys
 * there move the selection — which here would fire a request per keypress.
 *
 * Rows stack full-width in one column, bold label leading, the choose-one
 * mark held to the trailing edge. The layout, states and mark belong to the
 * neutral `.c-chat__option` object (styles/components/_chat.scss); nothing
 * here is scheme-specific.
 *
 * A closed group isn't a dead end: once `entry.chosenOptionId` is genuinely
 * committed (not just the transient optimistic pick), a quiet "Choose a
 * different direction" action stays attached below it. Reopening only clears
 * that stamp so the group is interactive again — it does not retract
 * anything the choice already posted (the assistant's reply, any suggestion
 * cards already in the transcript); picking again just adds another round,
 * same as choosing fresh.
 */

import { Icon } from "@/components/ui/Icon";
import type { ChatEntry, DirectionOption } from "./PlantSchemeContext";

type DirectionsEntry = Extract<ChatEntry, { kind: "directions" }>;

export function DirectionOptions({
  entry,
  onChoose,
  onReopen,
  pendingChoiceId,
  disabled,
}: {
  entry: DirectionsEntry;
  onChoose: (entryId: string, option: DirectionOption) => void;
  /** Clears a committed choice so the group re-opens — the undo path. */
  onReopen: (entryId: string) => void;
  /** Optimistic: shown as chosen while the host waits for the reply to land. */
  pendingChoiceId?: string;
  disabled: boolean;
}) {
  const committed = entry.chosenOptionId !== undefined;
  const chosenId = entry.chosenOptionId ?? pendingChoiceId;
  const decided = chosenId !== undefined;

  return (
    <div className="c-chat__panel">
      <p className="c-chat__panel-title brevier" id={`${entry.id}-title`}>
        {entry.title}
      </p>
      <div className="c-chat__options" role="group" aria-labelledby={`${entry.id}-title`}>
        {entry.options.map((option, i) => {
          const chosen = chosenId === option.id;
          return (
            /* Plates settle in one after another — the same arrival the
               suggestion cards use, so anything the assistant lays out
               arrives as a planting rather than a dump. */
            <button
              key={option.id}
              type="button"
              aria-pressed={chosen}
              className={`c-chat__option c-scheme-chat__arrive${chosen ? " is-chosen" : ""}`}
              style={{ "--_delay": `${i * 70}ms` } as React.CSSProperties}
              disabled={disabled || decided}
              onClick={() => onChoose(entry.id, option)}
            >
              <span className="c-chat__option__text">
                <span className="c-chat__option__label primer">{option.label}</span>
                <span className="c-chat__option__blurb minion">{option.blurb}</span>
              </span>
              <span className="c-chat__option__mark" aria-hidden="true">
                <Icon
                  name="square"
                  size={18}
                  className="c-chat__option__mark-icon c-chat__option__mark-icon--empty"
                />
                <Icon
                  name="squareCheck"
                  size={18}
                  className="c-chat__option__mark-icon c-chat__option__mark-icon--checked"
                />
              </span>
            </button>
          );
        })}
      </div>
      {committed && (
        <button
          type="button"
          className="c-chat__options-reopen minion"
          disabled={disabled}
          onClick={() => onReopen(entry.id)}
        >
          <Icon name="retry" size={12} />
          Choose a different direction — what&rsquo;s already here stays
        </button>
      )}
    </div>
  );
}
