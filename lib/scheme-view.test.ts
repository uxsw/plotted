import { describe, it, expect } from "vitest";
import {
  describeMonthRuns,
  formatJobSpan,
  formatMonthRuns,
  heightRange,
  jobsBySeason,
  jobsInMonth,
  monthRuns,
  nextJob,
  numberWord,
  peakSeason,
} from "./scheme-view";
import { jobMonths, readStoredArticle, type SchemeJob } from "./scheme-article";

const job = (from: number, to: number, title: string): SchemeJob => ({ from, to, title, detail: "x", plants: [] });

describe("monthRuns", () => {
  it("joins consecutive months and keeps gaps apart", () => {
    expect(monthRuns([5, 6, 7, 9, 10])).toEqual([[5, 7], [9, 10]]);
  });

  it("joins a run across the new year into one, listed first", () => {
    expect(monthRuns([11, 12, 1, 2, 6])).toEqual([[11, 2], [6, 6]]);
  });

  it("handles all year, nothing, and out-of-range months", () => {
    expect(monthRuns([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toEqual([[1, 12]]);
    expect(monthRuns(null)).toEqual([]);
    expect(monthRuns([0, 13, 4])).toEqual([[4, 4]]);
  });

  it("formats for a label and for a sentence", () => {
    expect(formatMonthRuns([5, 6, 7, 9])).toBe("May–Jul, Sep");
    expect(formatMonthRuns([11, 12, 1, 2])).toBe("Nov–Feb");
    expect(formatMonthRuns([])).toBeNull();
    expect(describeMonthRuns([5, 6, 7])).toBe("May to July");
  });
});

describe("peakSeason", () => {
  it("picks the season with the most plant-months, counting June as summer", () => {
    expect(peakSeason([{ flowering_months: [6, 7, 8] }, { flowering_months: [4, 5, 6] }])).toBe("summer");
    expect(peakSeason([{ flowering_months: [9, 10] }, { flowering_months: [10, 11] }, { flowering_months: [7] }])).toBe("autumn");
  });

  it("falls back to spring when nothing is known", () => {
    expect(peakSeason([{ flowering_months: null }])).toBe("spring");
  });
});

describe("jobs through the year", () => {
  const jobs = [job(2, 3, "Cut back"), job(7, 7, "Shear"), job(10, 11, "Plant"), job(11, 2, "Leave seed heads")];

  it("groups by the season a job starts in, the current season first", () => {
    const seasons = jobsBySeason(jobs, 10);
    expect(seasons.map((s) => s.season)).toEqual(["autumn", "winter", "spring", "summer"]);
    expect(seasons[0].isNow).toBe(true);
    expect(seasons[0].jobs.map((j) => j.title)).toEqual(["Plant", "Leave seed heads"]);
    expect(seasons[1].jobs.map((j) => j.title)).toEqual(["Cut back"]);
    expect(seasons[2].jobs).toEqual([]);
  });

  it("finds what is due this month, including a job running over the new year", () => {
    expect(jobsInMonth(jobs, 1).map((j) => j.title)).toEqual(["Leave seed heads"]);
    expect(jobsInMonth(jobs, 5)).toEqual([]);
    expect(jobMonths({ from: 11, to: 2 })).toEqual([11, 12, 1, 2]);
  });

  it("finds the next job to start, wrapping round the year", () => {
    expect(nextJob(jobs, 5)?.title).toBe("Shear");
    expect(nextJob(jobs, 12)?.title).toBe("Cut back");
    expect(nextJob([], 5)).toBeNull();
  });

  it("labels a job's span", () => {
    expect(formatJobSpan({ from: 7, to: 7 })).toBe("Jul");
    expect(formatJobSpan({ from: 2, to: 3 })).toBe("Feb–Mar");
  });
});

describe("small formatters", () => {
  it("writes numbers as words to twenty", () => {
    expect(numberWord(0)).toBe("no");
    expect(numberWord(8)).toBe("eight");
    expect(numberWord(21)).toBe("21");
  });

  it("gives a height range", () => {
    expect(heightRange([{ height_cm: 5 }, { height_cm: 220 }, { height_cm: null }])).toBe("5–220cm");
    expect(heightRange([{ height_cm: null }])).toBeNull();
  });
});

describe("readStoredArticle", () => {
  it("keeps only plants that are in the scheme, and returns null for junk", () => {
    const article = readStoredArticle(
      {
        key_idea: "One idea.",
        pairings: [{ a: "Rosa canina", b: "Digitalis purpurea", why: "x" }],
        jobs: [{ from: 3, to: 4, title: "Mulch", detail: "x", plants: ["Digitalis purpurea", "Rosa canina"] }],
      },
      ["Digitalis purpurea"]
    );
    expect(article?.pairings).toEqual([]);
    expect(article?.jobs[0].plants).toEqual(["Digitalis purpurea"]);
    expect(readStoredArticle(null, [])).toBeNull();
    expect(readStoredArticle({ glance: {}, jobs: "nope" }, [])).toBeNull();
  });
});
