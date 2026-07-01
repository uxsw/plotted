"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export type SchemeSummary = {
  id: string;
  name: string;
  created_at: string;
  suggestion_count: number;
  source_plant_photos: string[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ThumbnailStack({ photos }: { photos: string[] }) {
  const shown = photos.slice(0, 4);
  return (
    <div className="flex -space-x-3">
      {shown.map((url, i) => (
        <div
          key={i}
          className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-paper"
          style={{ zIndex: shown.length - i }}
        >
          <Image src={url} alt="" fill sizes="48px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

export default function SchemeList({ schemes }: { schemes: SchemeSummary[] }) {
  const router = useRouter();

  if (schemes.length === 0) {
    return (
      <EmptyState
        illustration={<SchemeIllustration />}
        heading="No planting schemes yet"
        body="Select a few plants from your garden and let Plotted suggest companions to fill the gaps."
        action={
          <Button variant="primary" onClick={() => router.push("/schemes/new")}>
            Create your first scheme
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
      {schemes.map((scheme) => (
        <Card
          key={scheme.id}
          href={`/schemes/${scheme.id}`}
          placeholder={
            scheme.source_plant_photos.length > 0 ? (
              <ThumbnailStack photos={scheme.source_plant_photos} />
            ) : undefined
          }
          title={scheme.name}
          subtitle={formatDate(scheme.created_at)}
          tags={
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium font-sans leading-none bg-moss-tint text-moss-deep">
              {scheme.suggestion_count} suggestion{scheme.suggestion_count === 1 ? "" : "s"}
            </span>
          }
        />
      ))}
    </div>
  );
}

function SchemeIllustration() {
  return (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path
        d="M24 78V50M24 50C24 50 17 44 17 34M24 50C24 50 31 44 31 34"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M48 78V38M48 38C48 38 39 30 39 18M48 38C48 38 57 30 57 18"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M72 78V54M72 54C72 54 65 48 65 40M72 54C72 54 79 48 79 40"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M12 78h72" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
