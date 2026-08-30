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
      "Placeholder: which way does this bed face, and how much sun does it get through the day?",
    suggestions: ["Full sun", "Partial shade", "Full shade", "Not sure"],
  },
  {
    id: "soil",
    prompt:
      "Placeholder: what's the soil like — heavy and wet, light and dry, or somewhere in between?",
    suggestions: ["Free-draining", "Heavy clay", "Stays damp", "Not sure"],
  },
  {
    id: "intent",
    prompt:
      "Placeholder: what are you hoping this planting adds — colour, structure, wildlife, scent?",
    suggestions: ["Year-round colour", "Pollinators", "Evergreen structure", "Cut flowers"],
  },
  {
    id: "style",
    prompt:
      "Placeholder: any style you're drawn to, or plants you'd rather avoid?",
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
    commonName: "Placeholder shrub rose",
    latinName: "Rosa 'Placeholder'",
    tier: "back",
    note: "Placeholder rationale: gives height at the back and repeat flowers into autumn.",
    badges: ["Wildlife friendly", "Scented"],
  },
  {
    id: "s2",
    commonName: "Placeholder tall grass",
    latinName: "Calamagrostis 'Placeholder'",
    tier: "back",
    note: "Placeholder rationale: vertical movement and winter structure behind the perennials.",
    badges: ["Drought tolerant"],
  },
  {
    id: "s3",
    commonName: "Placeholder salvia",
    latinName: "Salvia 'Placeholder'",
    tier: "mid",
    note: "Placeholder rationale: long-flowering mid-height filler that pollinators work heavily.",
    badges: ["Pollinators", "Drought tolerant"],
  },
  {
    id: "s4",
    commonName: "Placeholder achillea",
    latinName: "Achillea 'Placeholder'",
    tier: "mid",
    note: "Placeholder rationale: flat flower heads contrast the salvia spikes; good for cutting.",
    badges: ["Pollinators", "Cut flowers"],
  },
  {
    id: "s5",
    commonName: "Placeholder hardy geranium",
    latinName: "Geranium 'Placeholder'",
    tier: "ground",
    note: "Placeholder rationale: weaves through the front edge and suppresses weeds.",
    badges: ["Wildlife friendly", "Low maintenance"],
  },
  {
    id: "s6",
    commonName: "Placeholder thyme",
    latinName: "Thymus 'Placeholder'",
    tier: "ground",
    note: "Placeholder rationale: aromatic mat for the sunny front corner; bees love it.",
    badges: ["Pollinators", "Edible"],
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
    commonName: "Placeholder umbellifer",
    latinName: "Ammi 'Placeholder'",
    tier: "mid",
    note: "Placeholder rationale: airy lace-cap flowers to soften the block planting.",
    badges: ["Pollinators", "Cut flowers"],
  },
  {
    id: "s3",
    commonName: "Placeholder salvia",
    latinName: "Salvia 'Placeholder'",
    tier: "mid",
    note: "Placeholder rationale: re-proposed from the starting scheme — add-state is per card.",
    badges: ["Pollinators", "Drought tolerant"],
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
    blurb: "Placeholder: naturalistic, self-seeding, informal.",
  },
  {
    id: "d-architectural",
    label: "Bold and architectural",
    blurb: "Placeholder: strong shapes, evergreen structure, restrained palette.",
  },
  {
    id: "d-edible",
    label: "Productive / edible",
    blurb: "Placeholder: herbs, cut flowers and crops woven through.",
  },
  {
    id: "d-something-else",
    label: "Something else — I'll describe it",
    blurb: "Placeholder: tell me in your own words.",
  },
];

/** Follow-up suggestions per direction id. "d-something-else" has none by design. */
export const MOCK_DIRECTION_FOLLOWUP: Record<string, MockSuggestion[]> = {
  "d-meadow": [
    {
      id: "m1",
      commonName: "Placeholder knautia",
      latinName: "Knautia 'Placeholder'",
      tier: "mid",
      note: "Placeholder rationale: scrambling pincushion flowers over a long season.",
      badges: ["Pollinators", "Wildlife friendly"],
    },
    {
      id: "m2",
      commonName: "Placeholder molinia",
      latinName: "Molinia 'Placeholder'",
      tier: "back",
      note: "Placeholder rationale: see-through grass for a hazy meadow layer.",
      badges: ["Drought tolerant"],
    },
  ],
  "d-architectural": [
    {
      id: "a1",
      commonName: "Placeholder phormium",
      latinName: "Phormium 'Placeholder'",
      tier: "back",
      note: "Placeholder rationale: hard vertical accent, evergreen.",
      badges: ["Evergreen"],
    },
    {
      id: "a2",
      commonName: "Placeholder euphorbia",
      latinName: "Euphorbia 'Placeholder'",
      tier: "mid",
      note: "Placeholder rationale: acid-green domes that hold their shape.",
      badges: ["Drought tolerant", "Evergreen"],
    },
  ],
  "d-edible": [
    {
      id: "e1",
      commonName: "Placeholder globe artichoke",
      latinName: "Cynara 'Placeholder'",
      tier: "back",
      note: "Placeholder rationale: dramatic silver foliage and an edible crop.",
      badges: ["Edible", "Pollinators"],
    },
    {
      id: "e2",
      commonName: "Placeholder nasturtium",
      latinName: "Tropaeolum 'Placeholder'",
      tier: "ground",
      note: "Placeholder rationale: edible flowers and leaves, scrambles over bare soil.",
      badges: ["Edible", "Pollinators"],
    },
  ],
};
