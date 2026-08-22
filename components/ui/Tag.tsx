type TagColor = "sun" | "season" | "neutral";

interface TagProps {
  color?: TagColor;
  children: React.ReactNode;
}

const colorClasses: Record<TagColor, string> = {
  sun: "bg-yellow text-ink border border-yellow/30",
  season: "bg-marigold text-marigold border border-marigold/30",
  neutral: "bg-sand text-ink-soft border border-sand-line",
};

function Tag({ color = "neutral", children }: TagProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full",
        "text-xs font-medium font-sans",
        colorClasses[color],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export { Tag };
export type { TagProps, TagColor };
