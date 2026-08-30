import type { Metadata } from "next";
import SchemeChat from "../_components/SchemeChat";

export const metadata: Metadata = {
  title: "Building your scheme | Plotted",
};

export default function PlantSchemeChatPage() {
  return <SchemeChat />;
}
