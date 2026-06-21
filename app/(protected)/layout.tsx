import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-paper">
      <nav className="border-b border-sand-line px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-display font-medium text-lg text-moss">
          Plotted
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs font-sans text-ink-soft">{user.email}</span>
          <LogoutButton />
        </div>
      </nav>
      <main className="max-w-[500px] mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
