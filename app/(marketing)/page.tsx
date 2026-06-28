import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Hero from "./_components/Hero";
import Features from "./_components/Features";
import Demo from "./_components/Demo";
import Ethos from "./_components/Ethos";
import RequestAccess from "./_components/RequestAccess";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/plants");

  return (
    <main>
      <Hero />
      <Features />
      <Demo />
      <Ethos />
      <RequestAccess />
    </main>
  );
}
