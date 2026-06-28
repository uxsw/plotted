import { T, WRAP } from "./tokens";
import Eyebrow from "./Eyebrow";
import FadeIn from "./FadeIn";

const CHIPS = ["Foxglove", "Part shade", "Jun – Sep"];

export default function Features() {
  return (
    <div className={WRAP}>
      {/* ── Product explanation ─────────────────────────────── */}
      <div
        style={{ borderTop: `1px solid ${T.hl}` }}
        className="pt-[104px] pb-[96px] max-tablet:pt-[68px] max-tablet:pb-[60px]"
      >
        <FadeIn>
          <Eyebrow text="What is Plotted" />
          <h2
            style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 56px", maxWidth: 780, lineHeight: 1.08 }}
            className="text-[52px] max-tablet:text-[clamp(32px,7.6vw,48px)] max-mobile:text-[clamp(29px,8.4vw,40px)]"
          >
            A considered home for everything you grow.
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div
            style={{ maxWidth: 880 }}
            className="grid grid-cols-2 gap-[64px] max-tablet:grid-cols-1 max-tablet:gap-[36px]"
          >
            <p style={{ fontFamily: T.s, fontSize: 18, lineHeight: 1.68, color: T.body, margin: 0 }}>
              Most of what we know about our own gardens lives in our heads — or scattered across plant
              labels, receipts and half-remembered names. Plotted brings it together into a single,
              beautiful catalogue of everything you grow.
            </p>
            <p style={{ fontFamily: T.s, fontSize: 18, lineHeight: 1.68, color: T.body, margin: 0 }}>
              It was built by gardeners who wanted to remember what thrived where, what flowered when,
              and what to plant next. Quietly clever, and never in the way of the gardening itself.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div style={{ marginTop: 72 }}>
            <div style={{
              aspectRatio: "16/6.5",
              border: `1px solid rgba(60,70,45,0.22)`,
              background: T.stripeDk,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: T.m, fontSize: 12, color: T.moss }}>
                PRODUCT PHOTO · 16:6.5 · a planted border in warm light
              </span>
            </div>
            <div style={{ fontFamily: T.d, fontStyle: "italic", fontSize: 13.5, color: "#7A7A63", marginTop: 11 }}>
              Pl. 02 — A mixed border, late summer
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── How it works ────────────────────────────────────── */}
      <div
        style={{ borderTop: `1px solid ${T.hl}` }}
        className="pt-[104px] pb-[96px] max-tablet:pt-[68px] max-tablet:pb-[60px]"
      >
        <FadeIn>
          <div style={{ maxWidth: 720 }}>
            <Eyebrow text="How it works" />
            <h2
              style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 22px", lineHeight: 1.08 }}
              className="text-[52px] max-tablet:text-[clamp(32px,7.6vw,48px)] max-mobile:text-[clamp(29px,8.4vw,40px)]"
            >
              Name a plant. Plotted does the rest.
            </h2>
            <p style={{ fontFamily: T.s, fontSize: 18, lineHeight: 1.62, color: T.body, margin: 0 }}>
              Starting a record takes seconds. Keeping it takes even less.
            </p>
          </div>
        </FadeIn>

        <div
          className="grid grid-cols-3 gap-[24px] items-stretch mt-16 max-tablet:grid-cols-1 max-tablet:gap-[18px] max-tablet:mt-11"
        >
          {/* Card 01 */}
          <FadeIn style={{ height: "100%" }}>
            <div style={{ height: "100%", background: T.sand, border: `1px solid ${T.hl}`, borderRadius: 6, padding: "34px 30px 36px" }}>
              <div style={{ fontFamily: T.m, fontSize: 13, color: T.faint, marginBottom: 48 }}>01</div>
              <h3 style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, fontSize: 25, lineHeight: 1.15, color: T.ink, margin: "0 0 14px" }}>
                Add what you grow
              </h3>
              <p style={{ fontFamily: T.s, fontSize: 15.5, lineHeight: 1.6, color: T.muted, margin: 0 }}>
                Snap a photo and type the name. That&apos;s all it takes to begin a record for any plant
                in your garden.
              </p>
            </div>
          </FadeIn>

          {/* Card 02 — AI highlight */}
          <FadeIn delay={0.1} style={{ height: "100%" }}>
            <div style={{
              height: "100%", background: T.paper,
              border: `1.5px solid ${T.terra}`, borderRadius: 6, padding: "34px 30px 36px",
              boxShadow: "0 18px 40px -22px rgba(189,106,69,0.5)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
                <span style={{ fontFamily: T.m, fontSize: 13, color: T.terra }}>02</span>
                <span style={{ fontFamily: T.m, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.paper, background: T.terra, padding: "4px 9px", borderRadius: 999 }}>
                  The clever bit
                </span>
              </div>
              <h3 style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, fontSize: 25, lineHeight: 1.15, color: T.ink, margin: "0 0 14px" }}>
                It looks up the details
              </h3>
              <p style={{ fontFamily: T.s, fontSize: 15.5, lineHeight: 1.6, color: T.muted, margin: "0 0 20px" }}>
                Type a species or cultivar and Plotted fills in sun, soil, flowering season and habit
                automatically — drawn from trusted horticultural sources.
              </p>
              <div style={{ borderTop: "1px dashed rgba(189,106,69,0.4)", paddingTop: 16 }}>
                <div style={{ fontFamily: T.m, fontSize: 12, color: "#8A7A55", marginBottom: 8 }}>
                  Digitalis purpurea
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {CHIPS.map((label) => (
                    <span key={label} style={{ fontFamily: T.s, fontSize: 11.5, color: T.muted, background: T.sand, border: `1px solid ${T.hl}`, padding: "4px 9px", borderRadius: 999 }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Card 03 */}
          <FadeIn delay={0.2} style={{ height: "100%" }}>
            <div style={{ height: "100%", background: T.sand, border: `1px solid ${T.hl}`, borderRadius: 6, padding: "34px 30px 36px" }}>
              <div style={{ fontFamily: T.m, fontSize: 13, color: T.faint, marginBottom: 48 }}>03</div>
              <h3 style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, fontSize: 25, lineHeight: 1.15, color: T.ink, margin: "0 0 14px" }}>
                Follow the seasons
              </h3>
              <p style={{ fontFamily: T.s, fontSize: 15.5, lineHeight: 1.6, color: T.muted, margin: 0 }}>
                Filter by what&apos;s in bloom, what needs sun, or what to prune next — and watch your
                garden change through the year.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
