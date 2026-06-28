"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { T, WRAP } from "./tokens";
import Eyebrow from "./Eyebrow";

type Sun = "full" | "part" | "shade";
type Plant = { key: string; name: string; meta: string; sun: Sun; bloom: boolean };

const PLANTS: Plant[] = [
  { key: "rosa",  name: "Rosa 'Gertrude Jekyll'", meta: "Climbing rose · Full sun",  sun: "full",  bloom: true  },
  { key: "salv",  name: "Salvia nemorosa",        meta: "Perennial · Full sun",       sun: "full",  bloom: false },
  { key: "lav",   name: "Lavandula",              meta: "Shrub · Full sun",           sun: "full",  bloom: true  },
  { key: "ger",   name: "Geranium 'Rozanne'",     meta: "Perennial · Part shade",     sun: "part",  bloom: true  },
  { key: "alch",  name: "Alchemilla mollis",      meta: "Perennial · Part shade",     sun: "part",  bloom: false },
  { key: "hosta", name: "Hosta 'Frances'",        meta: "Foliage · Shade",            sun: "shade", bloom: false },
];

const DIGITALIS: Plant = {
  key: "dig", name: "Digitalis purpurea", meta: "Foxglove · Part shade", sun: "part", bloom: true,
};

const LOOKUP: { label: string; value: string }[] = [
  { label: "Common name", value: "Foxglove" },
  { label: "Sun",         value: "Part shade" },
  { label: "Flowering",   value: "Jun – Sep" },
  { label: "Height",      value: "1.2 – 2 m" },
  { label: "Habit",       value: "Biennial" },
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

const INIT: DS = { filter: false, sheet: false, typed: "", looked: "none", added: false, caption: "Browsing the collection" };

/* ─────────────── Plant tile ─────────────────────────────── */
function Tile({ plant, dimmed, isNew }: { plant: Plant; dimmed: boolean; isNew?: boolean }) {
  return (
    <div style={{
      border: isNew ? `1px solid ${T.terra}` : `1px solid ${T.hl}`,
      background: T.sand,
      padding: 7,
      borderRadius: 5,
      transition: "all 0.55s cubic-bezier(0.2,0.7,0.2,1)",
      opacity: dimmed ? 0.14 : 1,
      transform: dimmed ? "scale(0.95)" : "scale(1)",
      ...(isNew && { boxShadow: "0 0 0 3px rgba(189,106,69,0.18)" }),
    }}>
      <div style={{
        position: "relative", aspectRatio: "1", borderRadius: 3, overflow: "hidden",
        background: "repeating-linear-gradient(135deg,#E0D3B5 0 10px,#EADFC6 10px 20px)",
      }}>
        {plant.bloom && (
          <span style={{
            position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 999,
            background: T.terra, boxShadow: "0 0 0 3px rgba(244,238,225,0.7)",
          }} />
        )}
      </div>
      <div style={{ fontFamily: T.d, fontStyle: "italic", fontSize: 13.5, color: T.ink, margin: "9px 3px 2px", lineHeight: 1.15 }}>
        {plant.name}
      </div>
      <div style={{ fontFamily: T.s, fontSize: 10.5, color: T.meta, margin: "0 3px 4px" }}>
        {plant.meta}
      </div>
    </div>
  );
}

/* ─────────────── Phone ──────────────────────────────────── */
function Phone({ s }: { s: DS }) {
  const cards = s.added ? [DIGITALIS, ...PLANTS] : PLANTS;

  function chip(active: boolean, activeBg: string) {
    return {
      fontFamily: T.s, fontSize: 12, padding: "6px 13px", borderRadius: 999, whiteSpace: "nowrap" as const,
      background: active ? activeBg : "transparent",
      color: active ? T.paper : T.moss,
      border: active ? `1px solid ${activeBg}` : `1px solid ${T.hl}`,
    };
  }

  return (
    <div
      style={{ position: "relative", width: 330, background: T.ink, borderRadius: 46, padding: 12, boxShadow: "0 40px 70px -28px rgba(44,49,34,0.55)" }}
      className="max-mobile:!w-[min(300px,90vw)]"
    >
      {/* Screen */}
      <div style={{ position: "relative", background: T.paper, borderRadius: 35, height: 606, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Notch */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 112, height: 24, background: T.ink, borderRadius: "0 0 16px 16px", zIndex: 6 }} />

        {/* Status bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 22px 4px", fontFamily: T.m, fontSize: 11, color: T.moss }}>
          <span>9:41</span>
          <span style={{ letterSpacing: 2 }}>● ● ●</span>
        </div>

        {/* App header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "8px 20px 12px" }}>
          <div>
            <div style={{ fontFamily: T.m, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.faint, marginBottom: 3 }}>My garden</div>
            <div style={{ fontFamily: T.d, fontStyle: "italic", fontSize: 24, color: T.ink, lineHeight: 1 }}>Your collection</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: "repeating-linear-gradient(135deg,#D8C9A8 0 6px,#E3D6B8 6px 12px)", border: `1px solid ${T.hl}` }} />
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 7, padding: "4px 20px 12px", overflow: "hidden" }}>
          <span style={chip(!s.filter, T.mossDp)}>All</span>
          <span style={chip(false,   T.mossDp)}>In bloom</span>
          <span style={chip(s.filter, T.terra)}>Full sun</span>
          <span style={chip(false,   T.mossDp)}>Shade</span>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflow: "hidden", padding: "4px 16px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {cards.map(p => (
              <Tile key={p.key} plant={p} dimmed={s.filter && p.sun !== "full"} isNew={s.added && p.key === "dig"} />
            ))}
          </div>
        </div>

        {/* FAB */}
        <div style={{
          position: "absolute", right: 18, bottom: 18, width: 54, height: 54, borderRadius: 999,
          background: T.mossDp, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 10px 22px -6px rgba(63,74,46,0.6)", zIndex: 5,
          opacity: s.sheet ? 0 : 1,
          transform: s.sheet ? "scale(0.6)" : "scale(1)",
          transition: "all 0.4s",
        }}>
          <span style={{ fontFamily: T.s, fontSize: 30, fontWeight: 300, color: T.paper, lineHeight: 1, marginTop: -3 }}>+</span>
        </div>

        {/* Add sheet */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 392,
          background: T.paper, borderTop: "1px solid rgba(60,70,45,0.16)",
          borderRadius: "26px 26px 0 0", boxShadow: "0 -16px 40px -16px rgba(44,49,34,0.28)",
          padding: "14px 22px 22px", zIndex: 7,
          transform: s.sheet ? "translateY(0)" : "translateY(115%)",
          transition: "transform 0.55s cubic-bezier(0.2,0.8,0.2,1)",
        }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: "rgba(60,70,45,0.2)", margin: "0 auto 16px" }} />
          <div style={{ fontFamily: T.d, fontStyle: "italic", fontSize: 20, color: T.ink, marginBottom: 18 }}>Add a plant</div>

          <div style={{ fontFamily: T.m, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.faint, marginBottom: 8 }}>Species or cultivar</div>
          <div style={{ display: "flex", alignItems: "center", minHeight: 44, border: `1px solid ${T.hlStr}`, borderRadius: 8, background: T.raised, padding: "10px 13px", marginBottom: 18 }}>
            <span style={{ fontFamily: T.s, fontSize: 15, color: T.ink }}>{s.typed}</span>
            <span className="mkt-caret" style={{ display: "inline-block", width: 2, height: 18, background: T.mossDp, marginLeft: 1 }} />
          </div>

          {s.looked === "loading" && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 2px" }}>
              <span style={{ display: "flex", gap: 4 }}>
                <span className="mkt-dot-1" style={{ width: 7, height: 7, borderRadius: 999, background: T.terra, display: "inline-block" }} />
                <span className="mkt-dot-2" style={{ width: 7, height: 7, borderRadius: 999, background: T.terra, display: "inline-block" }} />
                <span className="mkt-dot-3" style={{ width: 7, height: 7, borderRadius: 999, background: T.terra, display: "inline-block" }} />
              </span>
              <span style={{ fontFamily: T.m, fontSize: 11.5, color: "#8A7A55" }}>Looking up the details…</span>
            </div>
          )}

          {s.looked === "done" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: T.moss, display: "inline-block" }} />
                <span style={{ fontFamily: T.m, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: T.moss }}>
                  Found automatically
                </span>
              </div>
              <div style={{ border: `1px solid ${T.hl}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                {LOOKUP.map((f, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", padding: "9px 13px",
                    borderBottom: i < LOOKUP.length - 1 ? "1px solid rgba(60,70,45,0.08)" : undefined,
                    background: T.raised,
                  }}>
                    <span style={{ fontFamily: T.s, fontSize: 12.5, color: T.meta }}>{f.label}</span>
                    <span style={{ fontFamily: T.s, fontSize: 12.5, fontWeight: 500, color: T.ink }}>{f.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", fontFamily: T.s, fontSize: 14, fontWeight: 500, color: T.paper, background: T.mossDp, padding: 13, borderRadius: 999 }}>
                Add to garden
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Demo section ───────────────────────────── */
export default function Demo() {
  const [state, setState] = useState<DS>(INIT);
  const runningRef  = useRef(false);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const wait = useCallback((ms: number): Promise<void> =>
    new Promise(res => { timeoutRef.current = setTimeout(res, ms); })
  , []);

  const runLoop = useCallback(async () => {
    while (runningRef.current) {
      setState(INIT);
      await wait(2600); if (!runningRef.current) break;

      setState(s => ({ ...s, filter: true, caption: "Filtering by sun" }));
      await wait(2500); if (!runningRef.current) break;

      setState(s => ({ ...s, filter: false, caption: "Browsing the collection" }));
      await wait(1100); if (!runningRef.current) break;

      setState(s => ({ ...s, sheet: true, caption: "Adding a new plant" }));
      await wait(900); if (!runningRef.current) break;

      for (let i = 1; i <= SPECIES.length; i++) {
        if (!runningRef.current) break;
        setState(s => ({ ...s, typed: SPECIES.slice(0, i) }));
        await wait(80);
      }
      if (!runningRef.current) break;
      await wait(450); if (!runningRef.current) break;

      setState(s => ({ ...s, looked: "loading", caption: "Looking up the details" }));
      await wait(1300); if (!runningRef.current) break;

      setState(s => ({ ...s, looked: "done", caption: "Details found automatically" }));
      await wait(2600); if (!runningRef.current) break;

      setState(s => ({ ...s, added: true, sheet: false, caption: "Saved to your garden" }));
      await wait(2900); if (!runningRef.current) break;
    }
  }, [wait]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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
    <div style={{ width: "100%", background: T.sage, borderTop: "1px solid rgba(60,70,45,0.12)", borderBottom: "1px solid rgba(60,70,45,0.12)" }}>
      <div className={WRAP}>
        <div
          ref={containerRef}
          className="grid grid-cols-[0.95fr_1.05fr] gap-[80px] items-center py-[104px] max-tablet:grid-cols-1 max-tablet:gap-[52px] max-tablet:py-[68px]"
        >
          {/* Phone */}
          <div className="flex justify-center">
            <Phone s={state} />
          </div>

          {/* Copy */}
          <div>
            <Eyebrow text="See it in use" />
            <h2
              style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 24px", lineHeight: 1.06 }}
              className="text-[50px] max-tablet:text-[clamp(32px,7.6vw,48px)] max-mobile:text-[clamp(29px,8.4vw,40px)]"
            >
              Your garden,<br />in your pocket.
            </h2>
            <p style={{ fontFamily: T.s, fontSize: 18, lineHeight: 1.64, color: T.body, margin: "0 0 34px", maxWidth: 440 }}>
              Browse your collection at a glance, filter to what&apos;s thriving right now, and add
              something new in a tap — with the details filled in for you.
            </p>

            {/* Status pill */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: T.paper, border: "1px solid rgba(60,70,45,0.16)", borderRadius: 999, padding: "9px 16px 9px 13px" }}>
              <span className="mkt-dot" style={{ width: 8, height: 8, borderRadius: 999, background: T.moss, display: "inline-block" }} />
              <span style={{ fontFamily: T.d, fontStyle: "italic", fontSize: 16, color: T.mossDp }}>{state.caption}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
