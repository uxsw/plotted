import Link from "next/link";
import { T, WRAP } from "./tokens";
import Eyebrow from "./Eyebrow";

export default function Hero() {
  return (
    <div className={WRAP}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 72, alignItems: "center" }}
        className="pt-[90px] pb-[96px] max-[860px]:grid-cols-1 max-[860px]:gap-[40px] max-[860px]:pt-[48px] max-[860px]:pb-[60px]"
      >
        {/* Left — copy */}
        <div>
          <Eyebrow text="Private beta" mb={30} />
          <h1
            style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 30px", lineHeight: 1.02 }}
            className="text-[76px] max-[860px]:text-[clamp(42px,11vw,64px)] max-[480px]:text-[clamp(34px,9.6vw,46px)] max-[480px]:leading-[1.05]"
          >
            Your whole<br />garden, quietly<br />in order.
          </h1>
          <p style={{ fontFamily: T.s, fontSize: 19, lineHeight: 1.62, color: T.body, margin: "0 0 40px", maxWidth: 470 }}>
            Plotted gives every plant you grow a place to live — photographs, flowering seasons,
            sun and soil. Name a species and it looks up the botanical details for you.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <Link
              href="#request"
              style={{
                textDecoration: "none", fontFamily: T.s, fontSize: 15.5, fontWeight: 500,
                color: T.paper, background: T.mossDp, padding: "15px 32px", borderRadius: 999,
              }}
            >
              Request access
            </Link>
            <span style={{ fontFamily: T.s, fontSize: 13.5, color: "#7A7A63", maxWidth: 200, lineHeight: 1.45 }}>
              We&apos;re inviting new gardeners a few at a time.
            </span>
          </div>
        </div>

        {/* Right — portrait plate */}
        <div>
          <div style={{ aspectRatio: "3/4", border: `1px solid rgba(60,70,45,0.3)`, padding: 9, background: T.paper }}>
            <div style={{
              width: "100%", height: "100%",
              background: T.stripe,
              border: `1px solid rgba(60,70,45,0.18)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: T.m, fontSize: 12, color: T.moss, textAlign: "center", lineHeight: 1.7 }}>
                HERO PHOTO · 3:4<br />garden photograph
              </span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 11, fontFamily: T.d, fontStyle: "italic", fontSize: 13.5, color: "#7A7A63" }}>
            <span>Pl. 01 — The border in June</span>
            <span style={{ fontFamily: T.m, fontStyle: "normal", fontSize: 11 }}>001</span>
          </div>
        </div>
      </div>
    </div>
  );
}
