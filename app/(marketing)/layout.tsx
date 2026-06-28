export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#F4EEE1", color: "#2C3122", overflowX: "hidden" }}>
      {children}
    </div>
  );
}
