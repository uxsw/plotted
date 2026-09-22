import { redirect } from "next/navigation";

/* Picking garden plants now happens in the hub's start panel. */
export default function PlantSchemeExistingPage() {
  redirect("/plant-scheme");
}
