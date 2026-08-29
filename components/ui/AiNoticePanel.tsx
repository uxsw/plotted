export function AiNoticePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-yellow border border-yellow/40 px-4 py-3 brevier text-ink">
      {children}
    </div>
  );
}
