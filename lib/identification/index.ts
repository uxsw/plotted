import { PlantNetAdapter } from "./plantnet";
import type { IdentificationAdapter } from "./types";

let cachedAdapter: IdentificationAdapter | null = null;

export function getIdentificationAdapter(): IdentificationAdapter {
  if (cachedAdapter) return cachedAdapter;

  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) {
    throw new Error("PLANTNET_API_KEY is not set");
  }

  cachedAdapter = new PlantNetAdapter(apiKey);
  return cachedAdapter;
}

export type {
  IdentificationAdapter,
  IdentificationCandidate,
  IdentificationResult,
  RegionHint,
} from "./types";
export { IdentificationProviderError, IdentificationTimeoutError } from "./types";
