import React, { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

interface CardProps {
  photoUrl?: string | null;
  photoAlt?: string;
  placeholder?: ReactNode;
  badge?: ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  tags?: ReactNode;
  footer?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  priority?: boolean;
}

function Card({
  photoUrl,
  photoAlt,
  placeholder,
  badge,
  title,
  subtitle,
  tags,
  footer,
  href,
  onClick,
  className = "",
  priority = false,
}: CardProps) {
  const interactive = !!(href || onClick);
  const sharedClassName = [
    "flex flex-col rounded-lg overflow-hidden",
    "border border-sand-line bg-paper",
    "transition-shadow duration-150",
    interactive ? "cursor-pointer hover:shadow-md text-left w-full" : "",
    interactive ? "active:scale-[0.98] active:opacity-75 transition-transform duration-75" : "",
    className,
  ].join(" ");

  const content = (
    <>
      {/* Image area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-deep">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={photoAlt ?? title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            priority={priority}
          />
        ) : placeholder ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {placeholder}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <DefaultPlaceholder />
          </div>
        )}
        {badge && (
          <div className="absolute top-2 right-2">{badge}</div>
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <h3 className="font-display font-medium text-base text-ink leading-snug">
          {title}
        </h3>
        {subtitle && (
          <p className="font-sans text-sm text-ink-soft leading-snug">
            {subtitle}
          </p>
        )}
        {tags && (
          <div className="flex flex-wrap gap-1.5 mt-1">{tags}</div>
        )}
      </div>

      {footer && (
        <div className="px-4 pb-4 pt-0 border-t border-sand-line/60 mt-auto">
          {footer}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={sharedClassName}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={sharedClassName}>
        {content}
      </button>
    );
  }

  return (
    <div className={sharedClassName}>
      {content}
    </div>
  );
}

function DefaultPlaceholder() {
  return (
    <svg
      className="w-12 h-12 text-sand-line"
      fill="none"
      viewBox="0 0 48 48"
      stroke="currentColor"
      strokeWidth={1}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M24 8c-4 0-8 4-8 8s4 8 8 8c0 4-2 8-8 12h16c-6-4-8-8-8-12 4 0 8-4 8-8s-4-8-8-8z"
      />
    </svg>
  );
}

export { Card };
export type { CardProps };
