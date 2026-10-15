import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Sign In | Plotted",
};

/* The browser chrome takes the page's blossom ground on phones. */
export const viewport: Viewport = {
  themeColor: "#F8D6EC",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
