import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import Wordmark from "@/components/Wordmark";
import { Icon } from "@/components/ui/Icon";
import buttonStyles from "@/components/ui/Button.module.css";

export const metadata: Metadata = {
  title: "Welcome | Plotted",
};

export default async function WelcomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="c-auth-page">
      <div className="o-stack--compact is-brand">
        <Wordmark />
      </div>
      <div className="c-auth-page__form o-stack">
        <h1 className="pica o-type-display kirk o-row is-heading">
          <Icon name="check" aria-label="confirmed" />
          {/* TODO: Natalie — placeholder copy for review */}
          You&apos;re in
        </h1>

        {/* TODO: Natalie — placeholder copy for review */}
        <p className="primer">Your account is confirmed and your garden is ready.</p>
        {/* TODO: Natalie — placeholder copy for review */}
        <p className="brevier">
          Add your garden&apos;s location to get weather and planting suggestions, then start
          logging what you&apos;ve planted.
        </p>

        <Link
          href="/dashboard"
          className={clsx(buttonStyles["o-button"], buttonStyles["o-button--primary"], "w-full justify-center")}
        >
          {/* TODO: Natalie — placeholder copy for review */}
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
