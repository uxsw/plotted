/**
 * Mock in-progress schemes for the hub's "Carry on" shelf.
 *
 * Nothing in the conversational journey is saved yet (see
 * PlantSchemeContext.tsx), so these stand in for the drafts the spec's
 * "Reopen and continue" requirement will produce. Built from the journey's own
 * mock data so the shelf's border sketches match what the workspace draws.
 * Replace with a real query once conversations persist.
 */

import { MOCK_QUESTIONS, MOCK_SUGGESTIONS } from "./mockData";
import type { SchemePlant } from "./PlantSchemeContext";

export interface SchemeDraft {
  id: string;
  /** Named from its starting plants until the gardener writes it up. */
  name: string;
  startingPlants: string[];
  /** On the scheme list so far — drives the border sketch. */
  plants: SchemePlant[];
  lastSpeaker: "assistant" | "user";
  lastMessage: string;
  lastWorkedOn: string;
  /** Mock: every draft reopens the seeded workspace preview. */
  href: string;
}

function onList(ids: string[]): SchemePlant[] {
  return MOCK_SUGGESTIONS.filter((s) => ids.includes(s.id)).map((s) => ({
    id: `draft:${s.id}`,
    origin: "suggestion",
    sourceEntryId: null,
    plantId: s.id,
    commonName: s.commonName,
    latinName: s.latinName,
    tier: s.tier,
    note: s.note,
    badges: s.badges,
    months: s.months,
    photoUrl: null,
    addedToShoppingList: false,
  }));
}

export const MOCK_DRAFTS: SchemeDraft[] = [
  {
    id: "draft-1",
    name: "Lavender, catmint and thyme",
    startingPlants: ["Lavender", "Catmint", "Thyme"],
    plants: onList(["s1", "s3", "s4", "s6"]),
    lastSpeaker: "assistant",
    lastMessage: "Here are a couple more that could work — add any you like.",
    lastWorkedOn: "12 Sep",
    href: "/plant-scheme/chat?preview=1",
  },
  {
    id: "draft-2",
    name: "Hosta and hart's-tongue fern",
    startingPlants: ["Hosta", "Hart's-tongue fern"],
    plants: [],
    lastSpeaker: "assistant",
    lastMessage: MOCK_QUESTIONS[1].prompt,
    lastWorkedOn: "3 Sep",
    href: "/plant-scheme/chat?preview=1",
  },
];
