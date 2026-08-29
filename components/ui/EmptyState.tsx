import { ReactNode } from "react";

interface EmptyStateProps {
  illustration?: ReactNode;
  heading: string;
  body?: string;
  action?: ReactNode;
}

function EmptyState({ illustration, heading, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-4">
      {illustration && (
        <div className="w-24 h-24 text-sand-line flex items-center justify-center">
          {illustration}
        </div>
      )}
      <div className="flex flex-col gap-2 max-w-xs">
        <h2 className="o-type-display kirk paragon text-ink">
          {heading}
        </h2>
        {body && (
          <p className="brevier text-ink-soft o-type-leading--relaxed">{body}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
