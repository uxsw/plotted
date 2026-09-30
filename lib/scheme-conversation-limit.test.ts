import { describe, it, expect, vi } from "vitest";
import {
  enforceHourlySchemeTurnLimit,
  HOURLY_SCHEME_TURN_LIMIT,
  SCHEME_TURN_WINDOW_MS,
  SchemeTurnLimitError,
} from "./scheme-conversation-limit";

// Minimal stand-in for the bits of SupabaseClient this function actually
// calls: .from("user_flags").select(...).eq(...).maybeSingle() and .upsert(...).
function mockSupabase(
  row: { scheme_turn_count: number; scheme_turn_window_start: string | null } | null,
  opts: { readError?: string; writeError?: string } = {}
) {
  const upsert = vi
    .fn()
    .mockResolvedValue({ error: opts.writeError ? { message: opts.writeError } : null });
  const client = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: row,
            error: opts.readError ? { message: opts.readError } : null,
          }),
        }),
      }),
      upsert,
    }),
  };
  return { client, upsert };
}

const NOW = new Date("2026-09-27T12:00:00.000Z");
const TEN_MIN_AGO = new Date(NOW.getTime() - 10 * 60 * 1000).toISOString();
const OVER_AN_HOUR_AGO = new Date(NOW.getTime() - SCHEME_TURN_WINDOW_MS - 1).toISOString();

describe("enforceHourlySchemeTurnLimit", () => {
  it("allows a first-ever turn (no user_flags row yet) and opens a window at count 1", async () => {
    const { client, upsert } = mockSupabase(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await enforceHourlySchemeTurnLimit(client as any, "user-1", NOW);
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "user-1", scheme_turn_count: 1, scheme_turn_window_start: NOW.toISOString() },
      { onConflict: "user_id" }
    );
  });

  it("increments within the current window, keeping its start", async () => {
    const { client, upsert } = mockSupabase({ scheme_turn_count: 5, scheme_turn_window_start: TEN_MIN_AGO });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await enforceHourlySchemeTurnLimit(client as any, "user-1", NOW);
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "user-1", scheme_turn_count: 6, scheme_turn_window_start: TEN_MIN_AGO },
      { onConflict: "user_id" }
    );
  });

  it("resets to 1 and opens a new window once the old one is over an hour old", async () => {
    const { client, upsert } = mockSupabase({
      scheme_turn_count: HOURLY_SCHEME_TURN_LIMIT,
      scheme_turn_window_start: OVER_AN_HOUR_AGO,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await enforceHourlySchemeTurnLimit(client as any, "user-1", NOW);
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "user-1", scheme_turn_count: 1, scheme_turn_window_start: NOW.toISOString() },
      { onConflict: "user_id" }
    );
  });

  it("throws SchemeTurnLimitError at the cap, without writing", async () => {
    const { client, upsert } = mockSupabase({
      scheme_turn_count: HOURLY_SCHEME_TURN_LIMIT,
      scheme_turn_window_start: TEN_MIN_AGO,
    });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enforceHourlySchemeTurnLimit(client as any, "user-1", NOW)
    ).rejects.toBeInstanceOf(SchemeTurnLimitError);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("allows exactly one more turn at count - 1", async () => {
    const { client, upsert } = mockSupabase({
      scheme_turn_count: HOURLY_SCHEME_TURN_LIMIT - 1,
      scheme_turn_window_start: TEN_MIN_AGO,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await enforceHourlySchemeTurnLimit(client as any, "user-1", NOW);
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "user-1", scheme_turn_count: HOURLY_SCHEME_TURN_LIMIT, scheme_turn_window_start: TEN_MIN_AGO },
      { onConflict: "user_id" }
    );
  });

  it("fails closed when the counter can't be read (e.g. migration not applied)", async () => {
    const { client, upsert } = mockSupabase(null, { readError: "column does not exist" });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enforceHourlySchemeTurnLimit(client as any, "user-1", NOW)
    ).rejects.toThrow(/read failed/);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("fails closed when the increment can't be written", async () => {
    const { client } = mockSupabase(null, { writeError: "permission denied" });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enforceHourlySchemeTurnLimit(client as any, "user-1", NOW)
    ).rejects.toThrow(/write failed/);
  });
});
