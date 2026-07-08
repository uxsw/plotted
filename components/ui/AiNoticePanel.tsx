export function AiNoticePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-gold-tint border border-gold/40 rounded-[10px] px-4 py-3 text-[13px] font-sans text-ink">
      {children}
    </div>
  );
}
