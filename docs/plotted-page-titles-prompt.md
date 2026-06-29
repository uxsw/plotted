# Task: Add page titles across all routes

Add `metadata` exports (or `generateMetadata` for the plant detail page) to give each page a descriptive browser tab title. The root layout already exports `metadata` with `title: "Plotted"` — leave that as the global fallback.

All titles follow the format `Page Name | Plotted`, except the marketing home which uses just `Plotted`.

## Pages to update

### 1. `app/(marketing)/page.tsx`
Add at the top of the file (before the default export):
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plotted",
};
```

### 2. `app/(marketing)/privacy/page.tsx`
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Plotted",
};
```

### 3. `app/(app)/plants/page.tsx`
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Garden | Plotted",
};
```

### 4. `app/(app)/plants/new/page.tsx`
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Plant | Plotted",
};
```

### 5. `app/(app)/plants/[id]/page.tsx`
Replace the static `metadata` export with `generateMetadata`. The page already fetches the plant from Supabase — replicate the same fetch pattern:

```ts
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: plant } = await supabase
    .from("plants")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: plant?.name ? `${plant.name} | Plotted` : "Plant | Plotted",
  };
}
```

### 6. `app/(app)/plants/[id]/edit/page.tsx`
First, check what plant name field is available. If the page already fetches the plant, use `generateMetadata` the same way as above but with title `Edit [Plant Name] | Plotted` (fallback: `Edit Plant | Plotted`). If it doesn't fetch the plant, use a static export:
```ts
export const metadata: Metadata = {
  title: "Edit Plant | Plotted",
};
```

### 7. `app/auth/login/page.tsx`
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Plotted",
};
```

### 8. `app/auth/signup/page.tsx`
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | Plotted",
};
```

### 9. `app/auth/forgot-password/page.tsx`
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | Plotted",
};
```

### 10. `app/auth/reset-password/page.tsx`
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password | Plotted",
};
```

### 11. `app/(app)/admin/feedback/page.tsx`
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback | Plotted",
};
```

## Notes
- Do not touch `app/layout.tsx` — the root `title: "Plotted"` stays as the fallback
- Do not touch `app/design-check/page.tsx` — internal tooling, no title needed
- Each `metadata` export should be added near the top of the file, after any existing imports
- No other changes — this is metadata only

## Commit
`feat: add descriptive page titles across all routes`
