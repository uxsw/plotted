import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { T } from "./_components/tokens";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: T.paper, color: T.ink, overflowX: "hidden" }}>
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
