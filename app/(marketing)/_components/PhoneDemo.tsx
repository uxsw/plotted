"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

/**
 * The looping phone demo: browse, filter by sun, add a plant by name, watch
 * the lookup fill in the details. The loop is the one the old homepage ran;
 * the screen is redrawn in the app's current identity (paper ground, white
 * cards, bold roman Zodiak, marigold action). Runs only while on screen.
 */

const P = {
  paper: "#f6f3eb",
  white: "#fff",
  ink: "#2B2A24",
  inkSoft: "#5B574A",
  inkDeep: "#1C1B17",
  line: "#E3D8BC",
  marigold: "oklch(65.809% 0.15943 31.855)",
  yellow: "oklch(94.577% 0.10215 110.6)",
  damson: "#3D0B2B",
  d: "var(--font-zodiak),serif",
  s: "var(--font-inter),sans-serif",
  m: "var(--font-spline-mono),monospace",
} as const;

type Sun = "full" | "part" | "shade";
type Plant = { key: string; name: string; meta: string; sun: Sun; image: string };

const PLANTS: Plant[] = [
  { key: "geum", name: "Geum 'Mrs Bradshaw'", meta: "Avens · Full sun", sun: "full", image: "/demo-thumb-geum.jpg" },
  { key: "thyme", name: "Thymus 'Creeping Red'", meta: "Thyme · Full sun", sun: "full", image: "/demo-thumb-thyme.jpg" },
  { key: "cola", name: "Artemisia abrotanum", meta: "Cola plant · Full sun", sun: "full", image: "/demo-thumb-cola.jpg" },
  { key: "fern", name: "Dryopteris 'Jurassic Gold'", meta: "Fern · Part shade", sun: "part", image: "/demo-thumb-fern.jpg" },
  { key: "fire", name: "Lysimachia 'Firecracker'", meta: "Part shade", sun: "part", image: "/demo-thumb-firecracker.jpg" },
  { key: "hosta", name: "Hosta 'Frances Williams'", meta: "Foliage · Shade", sun: "shade", image: "/demo-thumb-hosta.jpg" },
];

const DIGITALIS: Plant = {
  key: "dig", name: "Digitalis purpurea", meta: "Foxglove · Part shade", sun: "part", image: "/demo-thumb-digitalis.jpg",
};

const LOOKUP: { label: string; value: string }[] = [
  { label: "Common name", value: "Foxglove" },
  { label: "Sun", value: "Part shade" },
  { label: "Flowering", value: "Jun – Sep" },
  { label: "Height", value: "1.2 – 2 m" },
  { label: "Frost", value: "Hardy" },
];

const SPECIES = "Digitalis purpurea";

interface DS {
  filter: boolean;
  sheet: boolean;
  typed: string;
  looked: "none" | "loading" | "done";
  added: boolean;
  caption: string;
}

const INIT: DS = { filter: false, sheet: false, typed: "", looked: "none", added: false, caption: "Browsing the garden" };

const label = {
  fontFamily: P.m, fontSize: 9.5, fontWeight: 500, letterSpacing: "0.14em",
  textTransform: "uppercase" as const, color: P.inkSoft,
};

function Tile({ plant, dimmed, isNew }: { plant: Plant; dimmed: boolean; isNew?: boolean }) {
  return (
    <div
      style={{
        background: P.white, borderRadius: 4, overflow: "hidden",
        transition: "opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.55s",
        opacity: dimmed ? 0.16 : 1,
        transform: dimmed ? "scale(0.95)" : "scale(1)",
        boxShadow: isNew ? `0 0 0 2px ${P.marigold}` : "none",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "4/3", background: P.yellow }}>
        <Image src={plant.image} alt="" fill style={{ objectFit: "cover" }} sizes="140px" />
      </div>
      <div style={{ padding: "8px 9px 10px" }}>
        <div style={{ fontFamily: P.d, fontWeight: 600, fontStyle: "italic", fontSize: 13, color: P.ink, lineHeight: 1.15 }}>
          {plant.name}
        </div>
        <div style={{ fontFamily: P.s, fontSize: 10.5, color: P.inkSoft, marginTop: 3 }}>{plant.meta}</div>
      </div>
    </div>
  );
}

function Phone({ s }: { s: DS }) {
  const cards = s.added ? [DIGITALIS, ...PLANTS] : PLANTS;

  const chip = (active: boolean) => ({
    fontFamily: P.s, fontSize: 12, lineHeight: 1, padding: "7px 12px", borderRadius: 32, whiteSpace: "nowrap" as const,
    background: active ? P.yellow : "transparent",
    color: P.ink,
    border: `1px solid ${active ? P.yellow : P.line}`,
    transition: "background 0.4s, border-color 0.4s",
  });

  return (
    <div className="c-walk-phone" aria-hidden="true">
      <div className="c-walk-phone__screen">
        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 22px 2px", fontFamily: P.m, fontSize: 11, color: P.inkSoft }}>
          <span>17:04</span>
          <span>Plotted</span>
        </div>

        <div style={{ padding: "12px 18px 10px" }}>
          <div style={label}>Your garden</div>
          <div style={{ fontFamily: P.d, fontWeight: 600, fontSize: 25, color: P.ink, lineHeight: 1.05, marginTop: 4 }}>Plants</div>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "2px 18px 12px", overflow: "hidden" }}>
          <span style={chip(!s.filter)}>All</span>
          <span style={chip(false)}>In flower</span>
          <span style={chip(s.filter)}>Full sun</span>
          <span style={chip(false)}>Shade</span>
        </div>

        <div style={{ flex: 1, overflow: "hidden", padding: "2px 14px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {cards.map((p) => (
              <Tile key={p.key} plant={p} dimmed={s.filter && p.sun !== "full"} isNew={s.added && p.key === "dig"} />
            ))}
          </div>
        </div>

        {/* Add button */}
        <div
          style={{
            position: "absolute", right: 16, bottom: 16, width: 52, height: 52, borderRadius: "50%",
            background: P.marigold, display: "grid", placeItems: "center",
            boxShadow: "0 10px 20px -8px rgba(61,11,43,0.55)", zIndex: 5,
            opacity: s.sheet ? 0 : 1, transform: s.sheet ? "scale(0.6)" : "scale(1)",
            transition: "opacity 0.4s, transform 0.4s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={P.inkDeep} strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 3v14M3 10h14" />
          </svg>
        </div>

        {/* Add sheet */}
        <div
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: 388,
            background: P.white, borderRadius: "8px 8px 0 0",
            boxShadow: "0 -18px 40px -18px rgba(61,11,43,0.4)",
            padding: "18px 20px 20px", zIndex: 7,
            transform: s.sheet ? "translateY(0)" : "translateY(112%)",
            transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div style={{ fontFamily: P.d, fontWeight: 600, fontSize: 21, color: P.ink, marginBottom: 16 }}>Add a plant</div>

          <div style={{ ...label, marginBottom: 7 }}>Species or cultivar</div>
          <div
            style={{
              display: "flex", alignItems: "center", minHeight: 42,
              border: `1px solid ${s.sheet ? "oklch(58% 0.095 206.15)" : P.line}`, borderRadius: 4,
              background: P.paper, padding: "9px 12px", marginBottom: 16,
            }}
          >
            <span style={{ fontFamily: P.s, fontSize: 15, color: P.ink }}>{s.typed}</span>
            <span className="mkt-caret" style={{ display: "inline-block", width: 2, height: 18, background: P.marigold, marginLeft: 1 }} />
          </div>

          {s.looked === "loading" && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 2px" }}>
              <span style={{ display: "flex", gap: 4 }}>
                {["mkt-dot-1", "mkt-dot-2", "mkt-dot-3"].map((c) => (
                  <span key={c} className={c} style={{ width: 6, height: 6, borderRadius: "50%", background: "#82175D", display: "inline-block" }} />
                ))}
              </span>
              <span style={{ fontFamily: P.s, fontSize: 12.5, color: P.inkSoft }}>Looking up the details…</span>
            </div>
          )}

          {s.looked === "done" && (
            <div className="c-walk-phone__found">
              <div style={{ border: `1px solid ${P.line}`, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
                {LOOKUP.map((f, i) => (
                  <div
                    key={f.label}
                    style={{
                      display: "flex", justifyContent: "space-between", padding: "8px 12px",
                      borderTop: i ? `1px solid ${P.line}` : undefined, background: P.white,
                    }}
                  >
                    <span style={{ ...label, letterSpacing: "0.1em" }}>{f.label}</span>
                    <span style={{ fontFamily: P.s, fontSize: 12.5, fontWeight: 500, color: P.ink }}>{f.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", fontFamily: P.s, fontSize: 14, fontWeight: 500, lineHeight: 1, color: P.inkDeep, background: P.marigold, padding: 13, borderRadius: 2 }}>
                Add to garden
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PhoneDemo() {
  const [state, setState] = useState<DS>(INIT);
  const runningRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const wait = useCallback(
    (ms: number): Promise<void> => new Promise((res) => { timeoutRef.current = setTimeout(res, ms); }),
    []
  );

  const runLoop = useCallback(async () => {
    while (runningRef.current) {
      setState(INIT);
      await wait(2600); if (!runningRef.current) break;

      setState((s) => ({ ...s, filter: true, caption: "Filtering by sun" }));
      await wait(2500); if (!runningRef.current) break;

      setState((s) => ({ ...s, filter: false, caption: "Browsing the garden" }));
      await wait(1100); if (!runningRef.current) break;

      setState((s) => ({ ...s, sheet: true, caption: "Adding a new plant" }));
      await wait(900); if (!runningRef.current) break;

      for (let i = 1; i <= SPECIES.length; i++) {
        if (!runningRef.current) break;
        setState((s) => ({ ...s, typed: SPECIES.slice(0, i) }));
        await wait(80);
      }
      if (!runningRef.current) break;
      await wait(450); if (!runningRef.current) break;

      setState((s) => ({ ...s, looked: "loading", caption: "Looking up the details" }));
      await wait(1300); if (!runningRef.current) break;

      setState((s) => ({ ...s, looked: "done", caption: "Details found for you" }));
      await wait(2600); if (!runningRef.current) break;

      setState((s) => ({ ...s, added: true, sheet: false, caption: "Saved to your garden" }));
      await wait(2900); if (!runningRef.current) break;
    }
  }, [wait]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    /* Reduced motion: hold the finished state instead of looping. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = setTimeout(
        () => setState({ ...INIT, added: true, caption: "Saved to your garden" }),
        0
      );
      return () => clearTimeout(id);
    }

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !runningRef.current) {
        runningRef.current = true;
        runLoop();
      } else if (!entry.isIntersecting && runningRef.current) {
        runningRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    }, { threshold: 0.1 });

    obs.observe(el);
    return () => {
      runningRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      obs.disconnect();
    };
  }, [runLoop]);

  return (
    <div ref={containerRef} className="c-walk-demo">
      <Phone s={state} />
      <p className="c-walk-demo__caption">
        <span className="mkt-dot" aria-hidden="true" />
        {state.caption}
      </p>
    </div>
  );
}
