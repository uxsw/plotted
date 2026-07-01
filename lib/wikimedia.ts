export type WikimediaImage = {
  url: string;
  attribution: string;
};

/**
 * Looks up a representative thumbnail for a plant via the Wikipedia REST
 * summary endpoint. The summary endpoint doesn't expose real photographer/
 * licence metadata, so the desktop page link is stored as the attribution —
 * the UI renders it as an "Image: Wikimedia Commons" link, per spec.
 */
export async function fetchWikimediaImage(latinName: string): Promise<WikimediaImage | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(latinName)}`
    );
    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (typeof data !== "object" || data === null) return null;
    const d = data as Record<string, unknown>;

    const thumbnail = d.thumbnail as Record<string, unknown> | undefined;
    const url = thumbnail?.source;
    if (typeof url !== "string") return null;

    const contentUrls = d.content_urls as Record<string, unknown> | undefined;
    const desktop = contentUrls?.desktop as Record<string, unknown> | undefined;
    const pageUrl = desktop?.page;

    return {
      url,
      attribution: typeof pageUrl === "string" ? pageUrl : "https://commons.wikimedia.org",
    };
  } catch {
    return null;
  }
}
