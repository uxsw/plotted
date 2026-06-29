import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password | Plotted",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
