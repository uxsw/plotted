// A small in-memory stand-in for the Supabase client, for code that does
// several dependent reads and writes on the same rows (claim → run → finish).
// Supports only the query shapes the shopping list lookup uses.

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

class Query implements PromiseLike<{ data: unknown; error: null; count?: number }> {
  private filters: Filter[] = [];
  private op: "select" | "update" | "insert" | "delete" = "select";
  private payload: Row = {};
  private returning = false;
  private head = false;
  private one = false;
  private max: number | null = null;

  constructor(private rows: Row[], private log: { op: string; table: string; payload?: Row }[], private table: string) {}

  select(_columns?: string, options?: { count?: string; head?: boolean }) {
    this.returning = true;
    if (options?.head) this.head = true;
    return this;
  }
  update(payload: Row) {
    this.op = "update";
    this.payload = payload;
    this.returning = false;
    return this;
  }
  insert(payload: Row) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }
  is(column: string, value: null) {
    this.filters.push((row) => (row[column] ?? null) === value);
    return this;
  }
  not(column: string, _operator: "is", value: null) {
    this.filters.push((row) => (row[column] ?? null) !== value);
    return this;
  }
  gt(column: string, value: string) {
    this.filters.push((row) => typeof row[column] === "string" && (row[column] as string) > value);
    return this;
  }
  /** Only the retry action's filter: failed, or pending and older than a cutoff. */
  or(expression: string) {
    const cutoff = /lookup_requested_at\.lt\."([^"]+)"/.exec(expression)?.[1] ?? "";
    this.filters.push(
      (row) =>
        row.lookup_status === "failed" ||
        (row.lookup_status === "pending" &&
          typeof row.lookup_requested_at === "string" &&
          row.lookup_requested_at < cutoff)
    );
    return this;
  }
  order() {
    return this;
  }
  limit(count: number) {
    this.max = count;
    return this;
  }
  maybeSingle() {
    this.one = true;
    return this;
  }
  single() {
    this.one = true;
    return this;
  }

  private run() {
    this.log.push({ op: this.op, table: this.table, payload: this.op === "select" ? undefined : this.payload });

    if (this.op === "insert") {
      const row = { id: `row-${this.rows.length + 1}`, created_at: new Date().toISOString(), ...this.payload };
      this.rows.push(row);
      return { data: this.one ? row : [row], error: null };
    }

    let matched = this.rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.op === "update") {
      for (const row of matched) Object.assign(row, this.payload);
      if (!this.returning) return { data: null, error: null };
    }
    if (this.op === "delete") {
      for (const row of matched) this.rows.splice(this.rows.indexOf(row), 1);
      return { data: null, error: null };
    }
    if (this.head) return { data: null, error: null, count: matched.length };
    if (this.max !== null) matched = matched.slice(0, this.max);
    // Copies, as a real client returns: a later write must not change a row
    // the caller has already read.
    const copies = matched.map((row) => ({ ...row }));
    return { data: this.one ? (copies[0] ?? null) : copies, error: null };
  }

  then<A = { data: unknown; error: null; count?: number }, B = never>(
    resolve?: ((value: { data: unknown; error: null; count?: number }) => A | PromiseLike<A>) | null,
    reject?: ((reason: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.run()).then(resolve, reject);
  }
}

export function createFakeDb(tables: Record<string, Row[]>, userId = "user-123") {
  const log: { op: string; table: string; payload?: Row }[] = [];
  const uploaded: string[] = [];
  const removed: string[] = [];
  const state = { failUpload: false };

  const bucket = {
    upload: async (path: string) => {
      if (state.failUpload) return { error: { message: "upload failed" } };
      uploaded.push(path);
      return { error: null };
    },
    remove: async (paths: string[]) => {
      removed.push(...paths);
      return { error: null };
    },
    getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
  };

  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: userId } } }),
      getSession: async () => ({ data: { session: { access_token: "test-token" } } }),
    },
    from: (table: string) => new Query((tables[table] ??= []), log, table),
    storage: { from: () => bucket },
  };

  return {
    client,
    tables,
    log,
    uploaded,
    removed,
    state,
    /** Every table any query touched. */
    tablesTouched: () => [...new Set(log.map((entry) => entry.table))],
    /** Every payload written to a table. */
    writesTo: (table: string) =>
      log.filter((entry) => entry.table === table && entry.payload).map((entry) => entry.payload!),
  };
}
