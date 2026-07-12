import Link from "next/link";
import { T, WRAP } from "@/app/(marketing)/_components/tokens";
import Wordmark from "@/components/Wordmark";

export default function MarketingHeader() {
  return (
    <div style={{ width: "100%" }}>
      <div className={WRAP}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "30px 0",
            borderBottom: `1px solid ${T.hl}`,
          }}
          className="max-[860px]:py-[22px]"
        >
          <Wordmark className="h-8 w-auto text-ink" />
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <Link
              href="/auth/login"
              style={{
                textDecoration: "none",
                fontFamily: T.s,
                fontSize: 14.5,
                color: T.body,
              }}
            >
              Login
            </Link>
            <Link
              href="/#request"
              style={{
                textDecoration: "none",
                fontFamily: T.s,
                fontSize: 14,
                fontWeight: 500,
                color: T.paper,
                background: T.terra,
                padding: "11px 20px",
                borderRadius: 999,
              }}
            >
              Request access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
