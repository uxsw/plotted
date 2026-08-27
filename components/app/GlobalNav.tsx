"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home" },
  { href: "/plants", label: "Plants" },
  { href: "/schemes", label: "Schemes" },
] as const;

export default function GlobalNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-sections" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const activeClasses = "active border-marigold text-marigold";
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
