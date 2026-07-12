import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import AppFooter from "@/components/app/AppFooter";
import GlobalNav from "@/components/app/GlobalNav";
import Wordmark from "@/components/Wordmark";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-paper">
      <header>
        <div className="px-4 py-3 flex items-center justify-between">
          <Wordmark className="h-8 w-auto text-ink" />
          <UserMenu email={user.email ?? ""} />
        </div>
        <GlobalNav />
      </header>
      <main className="max-w-[500px] mx-auto px-4 py-8">{children}</main>
      <AppFooter />
      <FeedbackButton />
    </div>
  );
}
