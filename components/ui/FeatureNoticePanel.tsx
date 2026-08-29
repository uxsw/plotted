// Sand/paper-toned notice for general feature introductions.
// Use AiNoticePanel (yellow tint) for AI-content notices; this variant is for
// UI feature intros that have no AI-content semantic.
export function FeatureNoticePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-sand border border-sand-line rounded-[10px] px-4 py-3 brevier text-ink">
      {children}
    </div>
  );
}
