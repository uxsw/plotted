import { T, WRAP } from "../_components/tokens";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Plotted",
};

export default function PrivacyPage() {
  return (
    <main>
      <div className={WRAP} style={{ paddingTop: 64, paddingBottom: 100 }}>
        <div style={{ maxWidth: 680 }}>
          <h1
            style={{
              fontFamily: T.d,
              fontWeight: 500,
              fontSize: 40,
              letterSpacing: "-0.02em",
              color: T.ink,
              marginBottom: 8,
            }}
          >
            Privacy Policy
          </h1>
          <p style={{ fontFamily: T.s, fontSize: 14, color: T.meta, marginBottom: 56 }}>
            Last updated: June 2026
          </p>

          <p style={{ fontFamily: T.s, fontSize: 16, lineHeight: 1.7, color: T.body, marginBottom: 40 }}>
            Plotted is a personal garden portfolio app currently in private beta. This policy explains what data we collect, how we use it, and your rights under UK GDPR.
          </p>

          <Section title="Who we are">
            <p>
              Plotted is developed and operated by John Cowen. If you have any questions about this policy or your data, contact{" "}
              <a href="mailto:john@johncowen.co.uk" style={{ color: T.moss, textDecoration: "underline" }}>
                john@johncowen.co.uk
              </a>.
            </p>
          </Section>

          <Section title="What data we collect">
            <ul>
              <li><strong>Account data</strong> — your email address and password (stored securely via Supabase Auth)</li>
              <li><strong>Garden data</strong> — plant names, notes, photos, and other information you choose to add to your garden</li>
              <li><strong>Feedback</strong> — any bug reports or feedback you submit through the app</li>
              <li><strong>Technical data</strong> — your browser type and the URL of the page you were on when submitting feedback</li>
            </ul>
            <p>
              We do not collect any data beyond what you actively provide, and we do not use third-party analytics or advertising tools.
            </p>
          </Section>

          <Section title="Why we collect it">
            <ul>
              <li>To provide and maintain your account</li>
              <li>To store and display your garden data</li>
              <li>To improve the app based on your feedback</li>
            </ul>
            <p>
              We process your data on the basis of your consent (you chose to create an account) and our legitimate interest in improving the product.
            </p>
          </Section>

          <Section title="How your data is stored">
            <p>
              Your data is stored securely using Supabase (database and file storage) and served via Vercel. Both are reputable infrastructure providers with their own security and compliance practices.
            </p>
            <p>
              Plotted is currently in private beta. While we take reasonable care to protect your data, this is an early-stage product and you should not store sensitive personal information in the app.
            </p>
          </Section>

          <Section title="How long we keep your data">
            <p>
              We keep your data for as long as your account is active. If you&apos;d like your account and data deleted, contact{" "}
              <a href="mailto:john@johncowen.co.uk" style={{ color: T.moss, textDecoration: "underline" }}>
                john@johncowen.co.uk
              </a>{" "}
              and we&apos;ll action it promptly.
            </p>
          </Section>

          <Section title="Your rights">
            <p>Under UK GDPR you have the right to:</p>
            <ul>
              <li>Access the data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to how we process your data</li>
            </ul>
            <p>
              To exercise any of these rights, email{" "}
              <a href="mailto:john@johncowen.co.uk" style={{ color: T.moss, textDecoration: "underline" }}>
                john@johncowen.co.uk
              </a>.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Plotted uses only strictly necessary cookies to manage your login session. No advertising or analytics cookies are used. You do not need to consent to cookies to use Plotted.
            </p>
          </Section>

          <Section title="Changes to this policy" last>
            <p>
              As Plotted develops, this policy may be updated. We&apos;ll let you know of any significant changes.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      style={{
        borderTop: `1px solid rgba(60,70,45,0.12)`,
        paddingTop: 32,
        marginBottom: last ? 0 : 40,
      }}
    >
      <h2
        style={{
          fontFamily: T.d,
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: "-0.01em",
          color: T.ink,
          marginBottom: 16,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontFamily: T.s,
          fontSize: 15.5,
          lineHeight: 1.75,
          color: T.body,
        }}
      >
        {children}
      </div>
    </section>
  );
}
