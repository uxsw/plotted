import React, { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface CardProps {
  photoUrl?: string | null;
  photoAlt?: string;
  placeholder?: ReactNode;
  badge?: ReactNode;
  sunBadge?: ReactNode;
  /** Overlay pinned top-left of the media well, opposite the sun badge. */
  marker?: ReactNode;
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
  marker,
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
    "o-card",
    variant === "flat" ? "o-card--flat" : "",
    interactive ? "o-card--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="o-card__media">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={photoAlt ?? ""}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="is-image"
            priority={priority}
          />
        ) : placeholder ? (
          <div className="is-placeholder">
            {placeholder}
          </div>
        ) : (
          <div className="is-placeholder">
            <Icon name="sprout" aria-label="none" size={32} /> 
          </div>
        )}
        {sunBadge && (
          <div className="is-badge">{sunBadge}</div>
        )}
        {badge && (
          <div className="is-badge">{badge}</div>
        )}
        {marker && (
          <div className="is-marker">{marker}</div>
        )}
      </div>

      <div className="o-card__body">
        <h3 className="o-type-display long-primer o-type-leading--tight o-type--italic kirk">
          {title}
        </h3>
        {subtitle && (
          <p className="brevier">
            {subtitle}
          </p>
        )}
        {tags && (
          <div className="u-margin-top-auto">{tags}</div>
        )}
      </div>

      {footer && (
        <div className="o-card__footer">{footer}</div>
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

export { Card };
export type { CardProps };
