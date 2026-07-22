"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", accent: "moss" },
  { href: "/plants", label: "Plants", accent: "moss" },
  { href: "/schemes", label: "Schemes", accent: "clay" },
] as const;

export default function GlobalNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-sections" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const activeClasses = item.accent === "clay" ? "border-clay text-clay" : "active border-moss text-moss";
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`nav-sections__item ${
              isActive
                ? `${activeClasses} font-medium`
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
