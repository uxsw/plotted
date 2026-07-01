import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import AppFooter from "@/components/app/AppFooter";
import GlobalNav from "@/components/app/GlobalNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-paper">
      <header>
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-display font-medium text-lg text-moss">
            Plotted
          </Link>
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
