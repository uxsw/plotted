"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type FeedbackType = "bug" | "ux" | "other";

interface FeedbackPayload {
  type: FeedbackType;
  description: string;
  page_url: string;
}

interface FeedbackSuccess {
  reference_code: string;
}

interface FeedbackError {
  error: string;
}

export async function submitFeedback(
  payload: FeedbackPayload
): Promise<FeedbackSuccess | FeedbackError> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { type, description, page_url } = payload;

  if (!["bug", "ux", "other"].includes(type)) {
    return { error: "Invalid feedback type" };
  }

  const trimmedDescription = description.trim();
  if (!trimmedDescription) {
    return { error: "Description is required" };
  }

  const headersList = await headers();
  const user_agent = headersList.get("user-agent") ?? undefined;

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      user_id: user.id,
      type,
      description: trimmedDescription,
      page_url: page_url || null,
      user_agent: user_agent ?? null,
    })
    .select("reference_code")
    .single();

  if (error) return { error: error.message };

  return { reference_code: data.reference_code };
}
