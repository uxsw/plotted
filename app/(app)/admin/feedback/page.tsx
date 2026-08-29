import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Feedback | Plotted",
};
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import FeedbackTable, { type FeedbackRow } from "./FeedbackTable";

const ADMIN_USER_ID = "856d3a60-7739-4340-b9be-2e3be72b1851";

export default async function FeedbackAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.id !== ADMIN_USER_ID) redirect("/plants");

  const serviceClient = createServiceClient();
  const { data: rows, error } = await serviceClient
    .from("feedback")
    .select("id, reference_code, type, description, page_url, user_agent, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="brevier text-marigold">
        Failed to load feedback: {error.message}
      </p>
    );
  }

  return (

    <div className="o-stack">
      <div className="o-row o-row--space-between">
        <h1 className="pica">Feedback</h1>
        <span className="minion">
          {rows?.length ?? 0} {rows?.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      <FeedbackTable rows={(rows ?? []) as FeedbackRow[]} />
    </div>
  );
}
