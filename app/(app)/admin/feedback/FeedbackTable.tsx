"use client";

import { Fragment, useState } from "react";

type FeedbackType = "bug" | "ux" | "other";

export interface FeedbackRow {
  id: string;
  reference_code: string;
  type: FeedbackType;
  description: string;
  page_url: string | null;
  user_agent: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Bug",
  ux: "Something feels off",
  other: "Feedback",
};

const TYPE_MODIFIERS: Record<FeedbackType, string> = {
  bug: "is-bug",
  ux: "is-feedback",
  other: "is-feedback",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function pathOnly(url: string | null) {
  if (!url) return "—";
  try {
    const u = new URL(url);
    return u.pathname || "/";
  } catch {
    return url;
  }
}

function truncate(str: string, max: number) {
  return str.length <= max ? str : str.slice(0, max).trimEnd() + "…";
}

export default function FeedbackTable({ rows }: { rows: FeedbackRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="brevier text-ink-soft text-center py-12">
        No feedback submitted yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4">
      <table className="w-full brevier border-collapse min-w-[520px]">
        <thead>
          <tr className="border-b border-sand-line">
            {["Reference", "Type", "Description", "Page", "Date"].map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left o-type-label text-ink-soft"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isOpen = expanded === row.id;
            return (
              <Fragment key={row.id}>
                <tr
                  onClick={() => setExpanded(isOpen ? null : row.id)}
                  className={[
                    "border-b border-sand-line cursor-pointer transition-colors duration-100",
                    isOpen ? "bg-sand/40" : "hover:bg-sand/30",
                  ].join(" ")}
                >
                  <td className="px-4 py-3 font-mono minion text-marigold whitespace-nowrap">
                    {row.reference_code}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`o-badge ${TYPE_MODIFIERS[row.type] ?? "is-feedback"}`}>
                      {TYPE_LABELS[row.type] ?? row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink max-w-[180px]">
                    <span className="block truncate" title={row.description}>
                      {truncate(row.description, 80)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft max-w-[100px]">
                    <span className="block truncate font-mono minion" title={row.page_url ?? ""}>
                      {truncate(pathOnly(row.page_url), 24)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft whitespace-nowrap minion">
                    {formatDate(row.created_at)}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-sand/40 border-b border-sand-line">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="o-type-label text-ink-soft mb-1">
                            Description
                          </p>
                          <p className="brevier text-ink o-type-leading--relaxed whitespace-pre-wrap">{row.description}</p>
                        </div>
                        <div>
                          <p className="o-type-label text-ink-soft mb-1">
                            Page URL
                          </p>
                          <p className="minion font-mono text-ink-soft break-all">{row.page_url ?? "—"}</p>
                        </div>
                        <div>
                          <p className="o-type-label text-ink-soft mb-1">
                            User Agent
                          </p>
                          <p className="minion font-mono text-ink-soft break-all">{row.user_agent ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
