import Link from "next/link";
import { T, WRAP } from "./tokens";

export default function Footer() {
  return (
    <div style={{ borderTop: `1px solid ${T.hl}` }}>
      <div className={WRAP}>
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          className="py-[44px] max-[860px]:flex-col max-[860px]:items-start max-[860px]:gap-[28px] max-[860px]:py-[36px]"
        >
          {/* Wordmark + tagline */}
          <div>
            <div style={{ fontFamily: T.d, fontWeight: 500, fontSize: 20, letterSpacing: "-0.01em", color: T.ink, marginBottom: 5 }}>
              Plotted
            </div>
            <div style={{ fontFamily: T.s, fontSize: 13.5, color: T.meta }}>
              Your garden, beautifully recorded.
            </div>
          </div>

          {/* Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <Link href="/auth/login" style={{ textDecoration: "none", fontFamily: T.s, fontSize: 13.5, color: T.body }}>
              Login
            </Link>
            <Link href="#request" style={{ textDecoration: "none", fontFamily: T.s, fontSize: 13.5, color: T.body }}>
              Request access
            </Link>
            <span style={{ fontFamily: T.s, fontSize: 13, color: T.meta }}>
              © {new Date().getFullYear()} Plotted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
