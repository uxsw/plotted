import {
  type IdentificationAdapter,
  type IdentificationResult,
  type RegionHint,
  IdentificationProviderError,
  IdentificationTimeoutError,
} from "./types";

const ENDPOINT_BASE = "https://my-api.plantnet.org/v2/identify";
const TIMEOUT_MS = 20_000;

// Pl@ntNet "project" flora regions. Region hint currently only distinguishes
// "we have a location" from "we don't" — a single Western European project
// covers Plotted's expected user base; refine to finer-grained projects later
// if that assumption stops holding.
const WESTERN_EUROPE_PROJECT = "weurope";
const ALL_PROJECT = "all";

function pickProject(region: RegionHint): string {
  return region ? WESTERN_EUROPE_PROJECT : ALL_PROJECT;
}

type PlantNetSpeciesGroup = { scientificNameWithoutAuthor: string };

type PlantNetResult = {
  score: number;
  species: {
    scientificName: string;
    genus?: PlantNetSpeciesGroup;
    family?: PlantNetSpeciesGroup;
    commonNames?: string[];
  };
  images?: { url: { o?: string; m?: string; s?: string } }[];
};

type PlantNetResponse = {
  results?: PlantNetResult[];
};

export class PlantNetAdapter implements IdentificationAdapter {
  constructor(private readonly apiKey: string) {}

  async identify(image: Buffer, region: RegionHint): Promise<IdentificationResult> {
    const project = pickProject(region);
    const url = new URL(`${ENDPOINT_BASE}/${project}`);
    url.searchParams.set("api-key", this.apiKey);
    url.searchParams.set("include-related-images", "true");

    const form = new FormData();
    form.append("images", new Blob([new Uint8Array(image)]), "photo.jpg");
    // No capture guidance in the UI yet (later stage), so we can't tell
    // Pl@ntNet which plant part this is. "other" is the most neutral of its
    // fixed organ values (leaf, flower, fruit, bark, habit, other).
    form.append("organs", "other");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new IdentificationTimeoutError("Pl@ntNet request timed out");
      }
      throw new IdentificationProviderError(
        err instanceof Error ? err.message : "Pl@ntNet request failed"
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new IdentificationProviderError(`Pl@ntNet error: ${response.status}`);
    }

    let data: PlantNetResponse;
    try {
      data = await response.json();
    } catch {
      throw new IdentificationProviderError("Pl@ntNet returned an unparsable response");
    }

    const candidates = (data.results ?? []).map((r) => ({
      scientificName: r.species.scientificName,
      genus: r.species.genus?.scientificNameWithoutAuthor ?? "",
      family: r.species.family?.scientificNameWithoutAuthor ?? "",
      commonNames: r.species.commonNames ?? [],
      score: r.score,
      referenceImages: (r.images ?? [])
        .map((img) => img.url.m ?? img.url.o ?? img.url.s)
        .filter((u): u is string => Boolean(u)),
    }));

    return { candidates };
  }
}
