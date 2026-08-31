/**
 * Hardcoded mock content for the Stage 1 conversational planting scheme shell.
 *
 * None of this is real. The question sequence stands in for what will later be
 * an LLM-driven conversation; the scheme stands in for a generated result. All
 * user-facing copy here is placeholder — Natalie reviews real copy separately.
 */

export interface MockQuestion {
  id: string;
  /** The assistant's prompt text. */
  prompt: string;
  /** Optional tappable quick replies shown as chips above the input. */
  suggestions?: string[];
}

/**
 * The mock conversation. The first question has no "Quick answer" exit (a scheme
 * is never generated from zero context) — the chat shell enforces this by index.
 */
export const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: "aspect",
    prompt:
      "Which way does this bed face, and how much sun does it get through the day?",
    suggestions: ["Full sun", "Partial shade", "Full shade", "Not sure"],
  },
  {
    id: "soil",
    prompt:
      "What's the soil like — heavy and wet, light and dry, or somewhere in between?",
    suggestions: ["Free-draining", "Heavy clay", "Stays damp", "Not sure"],
  },
  {
    id: "intent",
    prompt:
      "What are you hoping this planting adds — colour, structure, wildlife, scent?",
    suggestions: ["Year-round colour", "Pollinators", "Evergreen structure", "Cut flowers"],
  },
  {
    id: "style",
    prompt:
      "Any style you're drawn to, or plants you'd rather avoid?",
    suggestions: ["Cottage / informal", "Architectural", "Low maintenance"],
  },
];

export interface MockSuggestion {
  id: string;
  commonName: string;
  latinName: string;
  tier: "back" | "mid" | "ground";
  note: string;
  badges: string[];
  /** Months in flower, 1–12 — feeds the scheme list's flowering-year strip. */
  months: number[];
}

export const MOCK_TIER_LABELS: Record<MockSuggestion["tier"], string> = {
  back: "Back of border",
  mid: "Mid border",
  ground: "Ground cover",
};

export const MOCK_TIER_ORDER: MockSuggestion["tier"][] = ["back", "mid", "ground"];

/** Placeholder generated scheme — six plants across the three structural tiers. */
export const MOCK_SUGGESTIONS: MockSuggestion[] = [
  {
    id: "s1",
    commonName: "Shrub rose",
    latinName: "Rosa",
    tier: "back",
    note: "Gives height at the back and repeat flowers into autumn.",
    badges: ["Wildlife friendly", "Scented"],
    months: [6, 7, 8, 9, 10],
  },
  {
    id: "s2",
    commonName: "Tall grass",
    latinName: "Calamagrostis",
    tier: "back",
    note: "Vertical movement and winter structure behind the perennials.",
    badges: ["Drought tolerant"],
    months: [6, 7, 8, 9],
  },
  {
    id: "s3",
    commonName: "Salvia",
    latinName: "Salvia",
    tier: "mid",
    note: "Long-flowering mid-height filler that pollinators work heavily.",
    badges: ["Pollinators", "Drought tolerant"],
    months: [6, 7, 8, 9, 10],
  },
  {
    id: "s4",
    commonName: "Achillea",
    latinName: "Achillea",
    tier: "mid",
    note: "Flat flower heads contrast the salvia spikes; good for cutting.",
    badges: ["Pollinators", "Cut flowers"],
    months: [6, 7, 8, 9],
  },
  {
    id: "s5",
    commonName: "Hardy geranium",
    latinName: "Geranium",
    tier: "ground",
    note: "Weaves through the front edge and suppresses weeds.",
    badges: ["Wildlife friendly", "Low maintenance"],
    months: [5, 6, 7, 8, 9],
  },
  {
    id: "s6",
    commonName: "Thyme",
    latinName: "Thymus",
    tier: "ground",
    note: "Aromatic mat for the sunny front corner; bees love it.",
    badges: ["Pollinators", "Edible"],
    months: [5, 6, 7],
  },
];

/**
 * Posted when the user sends a generic follow-up message in the split-pane view.
 * Note `s3` is deliberately re-proposed here (also in MOCK_SUGGESTIONS) to prove
 * that add-state is tracked per suggestion card, not globally per plant id.
 */
export const MOCK_FOLLOWUP_SUGGESTIONS: MockSuggestion[] = [
  {
    id: "f1",
    commonName: "Umbellifer",
    latinName: "Ammi",
    tier: "mid",
    note: "Airy lace-cap flowers to soften the block planting.",
    badges: ["Pollinators", "Cut flowers"],
    months: [6, 7, 8],
  },
  {
    id: "s3",
    commonName: "Salvia",
    latinName: "Salvia",
    tier: "mid",
    note: "Re-proposed from the starting scheme — add-state is per card.",
    badges: ["Pollinators", "Drought tolerant"],
    months: [6, 7, 8, 9, 10],
  },
];

export interface MockDirectionOption {
  id: string;
  label: string;
  blurb: string;
}

/**
 * Posted when the user's message trips the crude "wants something different"
 * check. Selecting one (except "something-else") posts the matching follow-up
 * suggestions below.
 */
export const MOCK_DIRECTION_OPTIONS: MockDirectionOption[] = [
  {
    id: "d-meadow",
    label: "Loose, meadow-like",
    blurb: "Naturalistic, self-seeding, informal.",
  },
  {
    id: "d-architectural",
    label: "Bold and architectural",
    blurb: "Strong shapes, evergreen structure, restrained palette.",
  },
  {
    id: "d-edible",
    label: "Productive / edible",
    blurb: "Herbs, cut flowers and crops woven through.",
  },
  {
    id: "d-something-else",
    label: "Something else — I'll describe it",
    blurb: "Tell me in your own words.",
  },
];

/** Follow-up suggestions per direction id. "d-something-else" has none by design. */
export const MOCK_DIRECTION_FOLLOWUP: Record<string, MockSuggestion[]> = {
  "d-meadow": [
    {
      id: "m1",
      commonName: "Knautia",
      latinName: "Knautia",
      tier: "mid",
      note: "Scrambling pincushion flowers over a long season.",
      badges: ["Pollinators", "Wildlife friendly"],
      months: [6, 7, 8, 9],
    },
    {
      id: "m2",
      commonName: "Molinia",
      latinName: "Molinia",
      tier: "back",
      note: "See-through grass for a hazy meadow layer.",
      badges: ["Drought tolerant"],
      months: [8, 9, 10],
    },
  ],
  "d-architectural": [
    {
      id: "a1",
      commonName: "Phormium",
      latinName: "Phormium",
      tier: "back",
      note: "Hard vertical accent, evergreen.",
      badges: ["Evergreen"],
      months: [7, 8],
    },
    {
      id: "a2",
      commonName: "Euphorbia",
      latinName: "Euphorbia",
      tier: "mid",
      note: "Acid-green domes that hold their shape.",
      badges: ["Drought tolerant", "Evergreen"],
      months: [3, 4, 5],
    },
  ],
  "d-edible": [
    {
      id: "e1",
      commonName: "Globe artichoke",
      latinName: "Cynara",
      tier: "back",
      note: "Dramatic silver foliage and an edible crop.",
      badges: ["Edible", "Pollinators"],
      months: [7, 8, 9],
    },
    {
      id: "e2",
      commonName: "Nasturtium",
      latinName: "Tropaeolum",
      tier: "ground",
      note: "Edible flowers and leaves, scrambles over bare soil.",
      badges: ["Edible", "Pollinators"],
      months: [6, 7, 8, 9, 10],
    },
  ],
};
