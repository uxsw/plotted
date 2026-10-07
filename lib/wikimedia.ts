export type WikimediaImage = {
  url: string;
  attribution: string;
};

/** What the Wikipedia REST summary endpoint says about one page title. */
export type WikipediaSummary = {
  /** The page's canonical title, after any redirect. */
  title: string;
  /** "standard", "disambiguation", "no-extract", … */
  type: string;
  /** Short Wikidata description, e.g. "Species of flowering plant". */
  description: string | null;
  /** Plain-text first paragraph. */
  extract: string | null;
  image: WikimediaImage | null;
  pageUrl: string | null;
};

// Stagger the start of each request within this range to avoid tripping
// Wikipedia's rate limiter when fetching images for several suggestions at once.
const STAGGER_MS = 120;
const RETRY_DELAY_MS = 500;

// Wikimedia's User-Agent policy asks for a descriptive agent with a way to
// reach the operator; requests without one can be throttled or blocked.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://plotted.garden";
export const WIKIMEDIA_USER_AGENT = `Plotted/1.0 (${SITE_URL}; garden planning app)`;
const HEADERS = {
  "User-Agent": WIKIMEDIA_USER_AGENT,
  "Api-User-Agent": WIKIMEDIA_USER_AGENT,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Per request. Wikipedia normally answers in well under a second; without a
// limit a hung connection holds its caller open indefinitely.
const REQUEST_TIMEOUT_MS = 8000;

async function attemptSummary(
  title: string,
  signal?: AbortSignal
): Promise<{ summary: WikipediaSummary | null; is404: boolean }> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: HEADERS, signal: signal ? AbortSignal.any([signal, timeout]) : timeout }
  );
  if (!res.ok) return { summary: null, is404: res.status === 404 };

  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null) return { summary: null, is404: false };
  const d = data as Record<string, unknown>;

  const contentUrls = d.content_urls as Record<string, unknown> | undefined;
  const desktop = contentUrls?.desktop as Record<string, unknown> | undefined;
  const pageUrl = nonEmptyString(desktop?.page);

  const thumbnail = d.thumbnail as Record<string, unknown> | undefined;
  const imageUrl = nonEmptyString(thumbnail?.source);

  return {
    summary: {
      title: nonEmptyString(d.title) ?? title,
      type: nonEmptyString(d.type) ?? "standard",
      description: nonEmptyString(d.description),
      extract: nonEmptyString(d.extract),
      image: imageUrl
        ? { url: imageUrl, attribution: pageUrl ?? "https://commons.wikimedia.org" }
        : null,
      pageUrl,
    },
    is404: false,
  };
}

export type WikipediaSummaryResult =
  | { status: "found"; summary: WikipediaSummary }
  /** Wikipedia has no page with this title. */
  | { status: "missing" }
  /** Network error or bad status, after one retry — says nothing about whether a page exists. */
  | { status: "error" };

/**
 * Fetches the Wikipedia REST summary for a page title: description, text
 * extract, thumbnail and page link. Each request is limited to 8 seconds and
 * retried once after a short delay on non-404 failures. A 404 is reported as "missing" without a retry, and is
 * kept distinct from "error" so callers can tell "no such page" from "couldn't
 * ask".
 */
export async function fetchWikipediaSummary(
  title: string,
  options: { signal?: AbortSignal } = {}
): Promise<WikipediaSummaryResult> {
  const { signal } = options;
  try {
    const first = await attemptSummary(title, signal);
    if (first.summary) return { status: "found", summary: first.summary };
    if (first.is404) return { status: "missing" };
  } catch {
    // network error — fall through to retry
  }

  if (signal?.aborted) return { status: "error" };
  await delay(RETRY_DELAY_MS);

  try {
    const second = await attemptSummary(title, signal);
    if (second.summary) return { status: "found", summary: second.summary };
    return second.is404 ? { status: "missing" } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

/**
 * Looks up a representative thumbnail for a plant via the Wikipedia REST
 * summary endpoint. The summary endpoint doesn't expose real photographer/
 * licence metadata, so the desktop page link is stored as the attribution —
 * the UI renders it as an "Image: Wikimedia Commons" link, per spec.
 *
 * Retries once after a short delay on non-404 failures (network errors, bad
 * statuses, missing thumbnail data). A 404 means there's no Wikipedia page
 * at all — typically a cultivar name — so it fails silently without a retry.
 */
export async function fetchWikimediaImage(latinName: string): Promise<WikimediaImage | null> {
  try {
    const first = await attemptSummary(latinName);
    if (first.summary?.image || first.is404) return first.summary?.image ?? null;
  } catch {
    // network error — fall through to retry
  }

  await delay(RETRY_DELAY_MS);

  try {
    const second = await attemptSummary(latinName);
    return second.summary?.image ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches Wikimedia images for multiple plants, staggering the start of each
 * request rather than firing them all at once, to stay under Wikipedia's
 * rate limiter. Results are returned in the same order as the input names.
 */
export async function fetchWikimediaImages(latinNames: string[]): Promise<(WikimediaImage | null)[]> {
  const results: (WikimediaImage | null)[] = new Array(latinNames.length).fill(null);
  const pending: Promise<void>[] = [];

  for (let i = 0; i < latinNames.length; i++) {
    if (i > 0) await delay(STAGGER_MS);
    pending.push(
      fetchWikimediaImage(latinNames[i]).then((image) => {
        results[i] = image;
      })
    );
  }

  await Promise.all(pending);
  return results;
}
