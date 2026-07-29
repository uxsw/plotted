import React, { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Card.module.css";

interface CardProps {
  photoUrl?: string | null;
  photoAlt?: string;
  placeholder?: ReactNode;
  badge?: ReactNode;
  sunBadge?: ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tags?: ReactNode;
  footer?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  priority?: boolean;
  variant?: "default" | "flat";
  /** Rendered as data-identification-status on the outer element, unstyled — see plants.identification_status. */
  identificationStatus?: string;
}

function Card({
  photoUrl,
  photoAlt,
  placeholder,
  badge,
  sunBadge,
  title,
  subtitle,
  tags,
  footer,
  href,
  onClick,
  className = "",
  priority = false,
  variant = "default",
  identificationStatus,
}: CardProps) {
  const interactive = !!(href || onClick);
  const sharedClassName = [
    styles["o-card"],
    variant === "flat" ? styles["o-card--flat"] : "",
    interactive ? styles["o-card--interactive"] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className={styles["o-card__image"]}>
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={photoAlt ?? ""}
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
        {sunBadge && (
          <div className="absolute top-2 left-2">{sunBadge}</div>
        )}
        {badge && (
          <div className="absolute top-2 right-2">{badge}</div>
        )}
      </div>

      <div className={styles["o-card__body"]}>
        <h3 className="font-display font-medium text-base leading-snug">
          {title}
        </h3>
        {subtitle && (
          <p className="font-sans text-xs text-ink-soft leading-snug">
            {subtitle}
          </p>
        )}
        {tags && (
          <div className="flex flex-wrap gap-1.5 mt-1">{tags}</div>
        )}
      </div>

      {footer && (
        <div className={styles["o-card__footer"]}>{footer}</div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={sharedClassName} data-identification-status={identificationStatus}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={sharedClassName} data-identification-status={identificationStatus}>
        {content}
      </button>
    );
  }

  return (
    <div className={sharedClassName} data-identification-status={identificationStatus}>
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

export { Card, styles as cardStyles };
export type { CardProps };
