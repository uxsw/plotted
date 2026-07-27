// Provider-agnostic identification contract. Nothing outside lib/identification
// should know which provider is behind it or use provider-specific field names.

export type IdentificationCandidate = {
  scientificName: string;
  genus: string;
  family: string;
  commonNames: string[];
  score: number;
  referenceImages: string[];
};

export type IdentificationResult = {
  candidates: IdentificationCandidate[];
};

// Region hint derived from the user's stored garden location. Providers that
// support regional flora filtering translate this themselves; providers that
// don't can ignore it.
export type RegionHint = { latitude: number; longitude: number } | null;

export interface IdentificationAdapter {
  identify(image: Buffer, region: RegionHint): Promise<IdentificationResult>;
}

export class IdentificationProviderError extends Error {}
export class IdentificationTimeoutError extends Error {}
