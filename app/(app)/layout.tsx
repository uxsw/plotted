import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import AppFooter from "@/components/app/AppFooter";
import GlobalNav from "@/components/app/GlobalNav";
import Wordmark from "@/components/Wordmark";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <div className="min-h-screen">
      <OfflineBanner />
      <header>
        <div className="c-head">
          <Wordmark className="is-wordmark" />
          <UserMenu email={user.email ?? ""} />
        </div>
        <GlobalNav />
      </header>
      <main className="o-page">{children}</main>
      <AppFooter />
      <FeedbackButton />
    </div>
  );
}
