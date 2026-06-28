import { T, WRAP } from "./tokens";
import FadeIn from "./FadeIn";
import Eyebrow from "./Eyebrow";
import Image from "next/image";

const PRINCIPLES = [
  {
    title: "Made for gardeners, not trackers",
    body: "Plotted isn't a spreadsheet or a database. It's a garden portfolio — the kind of record a thoughtful gardener might keep by hand, now kept effortlessly.",
  },
  {
    title: "Beauty without clutter",
    body: "Every screen was designed to feel calm. No dashboards, no stats, no streak counters. Just your plants, beautifully presented.",
  },
  {
    title: "Clever where it counts",
    body: "The AI does one job: look up plant details so you don't have to. It stays out of the way everywhere else.",
  },
];

export default function Ethos() {
  return (
    <div className={WRAP}>
      <div
        style={{ borderTop: `1px solid ${T.hl}` }}
        className="pt-[104px] pb-[96px] max-tablet:pt-[68px] max-tablet:pb-[60px]"
      >
        <div
          className="grid grid-cols-[0.85fr_1.15fr] gap-[72px] items-start max-tablet:grid-cols-1 max-tablet:gap-[44px]"
        >
          {/* Left — portrait plate */}
          <FadeIn>
            <div style={{ border: `1px solid rgba(60,70,45,0.3)`, padding: 9, background: T.paper }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "3/4" }}>
                <Image
                  src="/garden-hero-3.jpg"
                  alt="Bottom of the garden - summer evening haze"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 850px) 100vw, 45vw"
                  priority
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 11, fontFamily: T.d, fontStyle: "italic", fontSize: 13.5, color: "#7A7A63" }}>
              <span>Pl. 03 — Summer evening looking across the field</span>
              <span style={{ fontFamily: T.m, fontStyle: "normal", fontSize: 11 }}>003</span>
            </div>
          </FadeIn>

          {/* Right — copy */}
          <div>
            <FadeIn>
              <Eyebrow text="Our approach" />
              <h2
                style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 44px", lineHeight: 1.08 }}
                className="text-[52px] max-tablet:text-[clamp(32px,7.6vw,48px)] max-mobile:text-[clamp(29px,8.4vw,40px)]"
              >
                Thoughtfully made, quietly useful.
              </h2>
            </FadeIn>

            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {PRINCIPLES.map((p, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div style={{ borderTop: `1px solid ${T.hl}`, paddingTop: 28 }}>
                    <h3 style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, fontSize: 21, lineHeight: 1.2, color: T.ink, margin: "0 0 12px" }}>
                      {p.title}
                    </h3>
                    <p style={{ fontFamily: T.s, fontSize: 16, lineHeight: 1.66, color: T.body, margin: 0 }}>
                      {p.body}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
