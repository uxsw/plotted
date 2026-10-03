import { redirect } from "next/navigation";

/* Starting a scheme now happens in the conversational flow at /plant-scheme. */
export default function NewSchemePage() {
  redirect("/plant-scheme");
}
