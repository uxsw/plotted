import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | Plotted",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
