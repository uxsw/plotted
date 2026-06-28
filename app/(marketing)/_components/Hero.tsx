import Link from "next/link";
import { T, WRAP } from "./tokens";
import Eyebrow from "./Eyebrow";
import Image from "next/image";

export default function Hero() {
  return (
    <div className={WRAP}>
      <div
        className="grid grid-cols-[1.15fr_0.85fr] gap-[72px] items-center pt-[90px] pb-[96px] max-tablet:grid-cols-1 max-tablet:gap-[40px] max-tablet:pt-[48px] max-tablet:pb-[60px]"
      >
        {/* Left — copy */}
        <div>
          <Eyebrow text="Private beta" mb={30} />
          <h1
            style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 30px", lineHeight: 1.02 }}
            className="text-[76px] max-tablet:text-[clamp(42px,11vw,64px)] max-mobile:text-[clamp(34px,9.6vw,46px)] max-mobile:leading-[1.05]"
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
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <Image
                src="/garden-hero-1.jpg"
                alt="Euphorbia and Cotinus plants in May sunshine"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 850px) 100vw, 45vw"
                priority
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 11, fontFamily: T.d, fontStyle: "italic", fontSize: 13.5, color: "#7A7A63" }}>
            <span>Pl. 01 — Euphorbia and Cotinus in May</span>
            <span style={{ fontFamily: T.m, fontStyle: "normal", fontSize: 11 }}>001</span>
          </div>
        </div>
      </div>
    </div>
  );
}
