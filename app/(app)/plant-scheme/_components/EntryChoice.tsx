"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { usePlantScheme } from "./PlantSchemeContext";
import buttonStyles from "@/components/ui/Button.module.css";

export default function EntryChoice() {
  const router = useRouter();
  const { choosePath, reset } = usePlantScheme();

  function start(path: "existing" | "scratch") {
    reset();
    choosePath(path);
    router.push(`/plant-scheme/${path}`);
  }

  return (
    <div className="o-stack">
      <div className="o-stack">
        <p className="minion">Placeholder · new conversational scheme</p>
        <h1 className="long-primer o-type-display kirk">Start a planting scheme</h1>
        <p className="primer">
          Placeholder: we&apos;ll ask a few questions about your space to suggest plants that
          suit it. You can stop early at any point.
        </p>
      </div>

      <div className="o-stack--compact">
        <button
          type="button"
          onClick={() => start("existing")}
          className="c-scheme-prefs__choice is-default"
          style={{ textAlign: "left", alignItems: "flex-start" }}
        >
          <span className="primer">Build from plants already in my garden</span>
          <span className="minion">
            Placeholder: pick from what Plotted already knows you&apos;re growing.
          </span>
        </button>

        <button
          type="button"
          onClick={() => start("scratch")}
          className="c-scheme-prefs__choice is-default"
          style={{ textAlign: "left", alignItems: "flex-start" }}
        >
          <span className="primer">Start from scratch</span>
          <span className="minion">
            Placeholder: type the plants you&apos;re considering — they don&apos;t need to be in
            your garden yet.
          </span>
        </button>
      </div>

      <Link
        href="/schemes"
        className={clsx(
          buttonStyles["o-button"],
          buttonStyles["o-button--ghost"],
          buttonStyles["o-button--flush-start"]
        )}
      >
        ← Back to planting schemes
      </Link>
    </div>
  );
}
