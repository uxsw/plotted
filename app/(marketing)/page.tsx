import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WalkRail, { type Stop } from "./_components/WalkRail";
import { Garden, Catalogue, Week, Schemes, List, Visitors } from "./_components/Stops";
import Gate from "./_components/Gate";

export const metadata: Metadata = {
  title: "Plotted",
  description:
    "A companion for your own garden: a record of every plant you grow, the week ahead where you are, planting schemes and a shopping list that knows plant names.",
};

/* One July evening, top of the garden to the gate. Each id is a band in Stops.tsx. */
const STOPS: Stop[] = [
  { id: "garden", time: "4 pm", label: "The garden", tone: "light" },
  { id: "catalogue", time: "5 pm", label: "Your plants", tone: "light" },
  { id: "week", time: "7 pm", label: "This week", tone: "light" },
  { id: "schemes", time: "8.30", label: "Schemes", tone: "light" },
  { id: "list", time: "9.15", label: "Shopping list", tone: "dark" },
  { id: "visitors", time: "9.45", label: "Visitors", tone: "dark" },
  { id: "gate", time: "10 pm", label: "Request access", tone: "dark" },
];

/* The direction this page was built to, kept in the markup so it can be audited against the render. */
const CONTRACT = `<!--
THESIS: the page is one walk round the garden at the end of the day; the light changes as you go. Refuses the cream-paper catalogue hero with a phone and three feature cards.
OWN-WORLD: seven bands of flat, total colour (euphorbia lime, sky, gold, coral, mulberry, indigo, damson); damson or blossom ink; the app's engraved single-stroke plants at border scale on every ground line; white sheets for the app itself; photographs as unframed windows.
STORY: Plotted knows every plant you grow and what this week means for it; five stops each prove one thing; you ask for an invitation at the gate.
FIRST VIEWPORT: lime field edge to edge. Wordmark and Log in top. Display headline left in Zodiak italic, lead and marigold Request access beneath. Portrait photograph right, running to the ground line. Engraved border drawing itself across the bottom, in front of the photograph. Time rail at the left edge, sun at 4 pm.
FORM: The Evening Round, 6 of 7 on the ordered list. Seed f41bad66.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="c-walk">
      <div hidden dangerouslySetInnerHTML={{ __html: CONTRACT }} />
      <WalkRail stops={STOPS} />
      <main>
        <Garden />
        <Catalogue />
        <Week />
        <Schemes />
        <List />
        <Visitors />
        <Gate />
      </main>
    </div>
  );
}
