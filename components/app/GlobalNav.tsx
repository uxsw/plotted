"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: { href: string; label: string; also?: string[] }[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/plants", label: "Plants" },
  /* /plant-scheme is the schemes hub being built alongside the live /schemes. */
  { href: "/schemes", label: "Schemes", also: ["/plant-scheme"] },
];

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function GlobalNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-sections" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isActive = [item.href, ...(item.also ?? [])].some((href) => matches(pathname, href));
        const activeClasses = "active border-marigold text-marigold";
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`nav-sections__item ${
              isActive
                ? `${activeClasses} o-type-weight--medium`
                : "border-transparent hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
