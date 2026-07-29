import { describe, it, expect, vi } from "vitest";
import { enforceDailyIdentifyLimit, DAILY_IDENTIFY_LIMIT } from "./dailyLimit";
import { IdentificationLimitError } from "./types";

// Minimal stand-in for the bits of SupabaseClient this function actually
// calls: .from("user_flags").select(...).eq(...).maybeSingle() and .upsert(...).
function mockSupabase(row: { identify_count: number; identify_count_date: string | null } | null) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const client = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: row }),
        }),
      }),
      upsert,
    }),
  };
  return { client, upsert };
}

const today = new Date().toISOString().slice(0, 10);

describe("enforceDailyIdentifyLimit", () => {
  it("allows a first-ever request (no user_flags row yet) and writes count 1", async () => {
    const { client, upsert } = mockSupabase(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await enforceDailyIdentifyLimit(client as any, "user-1");
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "user-1", identify_count: 1, identify_count_date: today },
      { onConflict: "user_id" }
    );
  });

  it("increments an existing same-day count", async () => {
    const { client, upsert } = mockSupabase({ identify_count: 5, identify_count_date: today });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await enforceDailyIdentifyLimit(client as any, "user-1");
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "user-1", identify_count: 6, identify_count_date: today },
      { onConflict: "user_id" }
    );
  });

  it("resets to 1 when the stored count is from a previous day", async () => {
    const { client, upsert } = mockSupabase({ identify_count: DAILY_IDENTIFY_LIMIT, identify_count_date: "2020-01-01" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await enforceDailyIdentifyLimit(client as any, "user-1");
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "user-1", identify_count: 1, identify_count_date: today },
      { onConflict: "user_id" }
    );
  });

  it("throws IdentificationLimitError once today's count is at the cap, without writing", async () => {
    const { client, upsert } = mockSupabase({ identify_count: DAILY_IDENTIFY_LIMIT, identify_count_date: today });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enforceDailyIdentifyLimit(client as any, "user-1")
    ).rejects.toBeInstanceOf(IdentificationLimitError);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("allows exactly one more request at count - 1", async () => {
    const { client, upsert } = mockSupabase({ identify_count: DAILY_IDENTIFY_LIMIT - 1, identify_count_date: today });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await enforceDailyIdentifyLimit(client as any, "user-1");
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "user-1", identify_count: DAILY_IDENTIFY_LIMIT, identify_count_date: today },
      { onConflict: "user_id" }
    );
  });
});
