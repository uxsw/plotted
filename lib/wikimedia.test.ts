import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWikimediaImage, fetchWikipediaSummary } from "./wikimedia";

const PAGE = {
  type: "standard",
  title: "Echinacea purpurea",
  description: "Species of flowering plant in the daisy family",
  extract: "Echinacea purpurea, the eastern purple coneflower, is a species of flowering plant.",
  thumbnail: { source: "https://upload.wikimedia.org/echinacea.jpg" },
  content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Echinacea_purpurea" } },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("fetchWikipediaSummary", () => {
  it("returns the text extract, description, type, image and page link", async () => {
    fetchMock.mockResolvedValue(json(PAGE));
    expect(await fetchWikipediaSummary("Echinacea purpurea")).toEqual({
      status: "found",
      summary: {
        title: "Echinacea purpurea",
        type: "standard",
        description: "Species of flowering plant in the daisy family",
        extract: "Echinacea purpurea, the eastern purple coneflower, is a species of flowering plant.",
        image: {
          url: "https://upload.wikimedia.org/echinacea.jpg",
          attribution: "https://en.wikipedia.org/wiki/Echinacea_purpurea",
        },
        pageUrl: "https://en.wikipedia.org/wiki/Echinacea_purpurea",
      },
    });
  });

  it("sends a descriptive User-Agent and a per-request timeout, and encodes the title", async () => {
    fetchMock.mockResolvedValue(json(PAGE));
    await fetchWikipediaSummary("Euphorbia × martini");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://en.wikipedia.org/api/rest_v1/page/summary/Euphorbia%20%C3%97%20martini");
    const headers = init.headers as Record<string, string>;
    expect(headers["User-Agent"]).toMatch(/^Plotted\/[\d.]+ \(https?:\/\/.+\)$/);
    expect(headers["Api-User-Agent"]).toBe(headers["User-Agent"]);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("reports a 404 as missing, without retrying", async () => {
    fetchMock.mockResolvedValue(json({ type: "Internal error" }, 404));
    expect(await fetchWikipediaSummary("Zzyzx plantus")).toEqual({ status: "missing" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once on a network error, and reports error if it fails again", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    expect(await fetchWikipediaSummary("Echinacea purpurea")).toEqual({ status: "error" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("recovers when the retry succeeds", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 503)).mockResolvedValueOnce(json(PAGE));
    expect((await fetchWikipediaSummary("Echinacea purpurea")).status).toBe("found");
  });

  it("doesn't retry once the caller has given up", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(async () => {
      controller.abort();
      throw new Error("aborted");
    });
    expect(await fetchWikipediaSummary("Echinacea purpurea", { signal: controller.signal })).toEqual({ status: "error" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("copes with a page that has no thumbnail or extract", async () => {
    fetchMock.mockResolvedValue(json({ type: "standard", title: "Ypsilandra" }));
    expect(await fetchWikipediaSummary("Ypsilandra")).toMatchObject({
      status: "found",
      summary: { extract: null, description: null, image: null, pageUrl: null },
    });
  });
});

describe("fetchWikimediaImage (scheme path, behaviour unchanged)", () => {
  it("returns the thumbnail with the page link as attribution", async () => {
    fetchMock.mockResolvedValue(json(PAGE));
    expect(await fetchWikimediaImage("Echinacea purpurea")).toEqual({
      url: "https://upload.wikimedia.org/echinacea.jpg",
      attribution: "https://en.wikipedia.org/wiki/Echinacea_purpurea",
    });
  });

  it("returns null on a 404 without retrying, and retries once when a page has no thumbnail", async () => {
    fetchMock.mockResolvedValue(json({}, 404));
    expect(await fetchWikimediaImage("Salvia 'Caradonna'")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockReset().mockResolvedValue(json({ type: "standard", title: "X" }));
    expect(await fetchWikimediaImage("X")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
