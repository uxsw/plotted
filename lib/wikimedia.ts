export type WikimediaImage = {
  url: string;
  attribution: string;
};

// Stagger the start of each request within this range to avoid tripping
// Wikipedia's rate limiter when fetching images for several suggestions at once.
const STAGGER_MS = 120;
const RETRY_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptFetch(latinName: string): Promise<{ image: WikimediaImage | null; is404: boolean }> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(latinName)}`
  );
  if (!res.ok) return { image: null, is404: res.status === 404 };

  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null) return { image: null, is404: false };
  const d = data as Record<string, unknown>;

  const thumbnail = d.thumbnail as Record<string, unknown> | undefined;
  const url = thumbnail?.source;
  if (typeof url !== "string") return { image: null, is404: false };

  const contentUrls = d.content_urls as Record<string, unknown> | undefined;
  const desktop = contentUrls?.desktop as Record<string, unknown> | undefined;
  const pageUrl = desktop?.page;

  return {
    image: {
      url,
      attribution: typeof pageUrl === "string" ? pageUrl : "https://commons.wikimedia.org",
    },
    is404: false,
  };
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
    const first = await attemptFetch(latinName);
    if (first.image || first.is404) return first.image;
  } catch {
    // network error — fall through to retry
  }

  await delay(RETRY_DELAY_MS);

  try {
    const second = await attemptFetch(latinName);
    return second.image;
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
