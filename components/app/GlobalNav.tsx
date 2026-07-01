"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/plants", label: "My plants" },
  { href: "/schemes", label: "Planting schemes" },
];

export default function GlobalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-b border-sand-line" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 text-center text-sm font-sans py-2.5 border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-moss text-moss font-medium"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
