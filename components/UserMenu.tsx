"use client";

import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

function initials(email: string): string | null {
  const local = email.split("@")[0];
  if (!local) return null;
  const segments = local.split(/[.\-_]/);
  const letters = segments
    .map((s) => s[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2);
  return letters.length > 0 ? letters.join("") : null;
}

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 8a6 6 0 1 1 12 0H4Z" />
    </svg>
  );
}

export default function UserMenu({ email }: { email: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const label = initials(email);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          aria-label="Account menu"
          className="w-9 h-9 rounded-full bg-moss text-paper flex items-center justify-center text-sm font-medium font-sans hover:bg-moss-deep transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          {label ?? <UserIcon />}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[200px] rounded-lg border border-sand-line bg-paper p-3 shadow-md flex flex-col gap-3 focus:outline-none"
        >
          <p className="text-xs font-sans text-ink-soft px-1 truncate">{email}</p>
          <Popover.Close asChild>
            <Link
              href="/account"
              className="inline-flex items-center justify-start gap-2 w-full rounded px-4 py-2 text-sm font-medium font-sans transition-colors duration-150 text-ink-soft bg-transparent hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Account settings
            </Link>
          </Popover.Close>
          <Popover.Close asChild>
            <Link
              href="/shopping-list"
              className="inline-flex items-center justify-start gap-2 w-full rounded px-4 py-2 text-sm font-medium font-sans transition-colors duration-150 text-ink-soft bg-transparent hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Shopping list
            </Link>
          </Popover.Close>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            Log out
          </Button>
          <Popover.Arrow className="fill-sand-line" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
