import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

// Literal Go template placeholders substituted by Supabase at send time —
// not React props. Kept as JS string constants (not raw JSX text) because
// `{{ .Foo }}` would otherwise be parsed as a JSX expression, not text.
// See app/auth/confirm/route.ts for the route these links resolve to.
const CONFIRMATION_URL =
  "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup";

// Brand tokens mirrored from app/globals.css — email clients can't consume
// CSS custom properties, so values are inlined as literal hex here. Fonts:
// Inter (--font-sans) with a web-safe fallback stack, not IBM Plex — this
// codebase doesn't use IBM Plex anywhere (see AGENTS.md task assumption
// vs. app/layout.tsx's actual Fraunces/Inter/Spline Sans Mono setup).
const colors = {
  paper: "#FAF6EC",
  ink: "#2d2d2d",
  inkSoft: "#5B574A",
  marigold: "#e26650",
  sandLine: "#D9CCAC",
  deepgrey: "#2d2d2d",
};

const fontFamily =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export default function ConfirmationEmail() {
  return (
    <Html lang="en">
      <Head />
      <Preview>Confirm your email to start your Plotted garden record</Preview>
      <Body style={{ backgroundColor: colors.paper, fontFamily, margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: "480px",
            margin: "0 auto",
            padding: "40px 24px",
          }}
        >
          <Text
            style={{
              fontFamily,
              fontSize: "20px",
              fontWeight: 600,
              color: colors.deepgrey,
              letterSpacing: "0.02em",
              margin: "0 0 32px",
            }}
          >
            Plotted
          </Text>

          <Text
            style={{
              fontFamily,
              fontSize: "15px",
              lineHeight: "1.5",
              color: colors.inkSoft,
              margin: "0 0 24px",
            }}
          >
            Thanks so much for signing up for Plotted
          </Text>

          <Heading
            as="h1"
            style={{
              fontFamily,
              fontSize: "22px",
              fontWeight: 600,
              color: colors.ink,
              margin: "0 0 16px",
            }}
          >
            Please confirm your email.
          </Heading>

          <Text
            style={{
              fontFamily,
              fontSize: "15px",
              lineHeight: "1.5",
              color: colors.inkSoft,
              margin: "0 0 24px",
            }}
          >
            Confirm your email address to start recording what's growing in your garden.
          </Text>

          <Text
            style={{
              fontFamily,
              fontSize: "15px",
              lineHeight: "1.5",
              color: colors.inkSoft,
              margin: "0 0 24px",
            }}
          >
            A quick note before you dive in: Plotted is currently in private beta.
          </Text>

          <Text
            style={{
              fontFamily,
              fontSize: "15px",
              lineHeight: "1.5",
              color: colors.inkSoft,
              margin: "0 0 24px",
            }}
          >
            What does that mean for you?
            You're one of a small number of people helping me shape Plotted before
            it's finished. Some things are still rough around the edges, and you
            might hit the odd bug or a feature that doesn't quite work as expected
            yet — that's all part of the process, not a sign something's
            wrong on your end. If you do spot anything, I'd really appreciate you
            letting me know. Every bit of feedback from early users like you goes
            directly into making Plotted better, and I'm very grateful
            you're willing to test the rough edges!
          </Text>

          <Button
            href={CONFIRMATION_URL}
            style={{
              backgroundColor: colors.marigold,
              color: "#FFFFFF",
              fontFamily,
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              padding: "12px 24px",
              borderRadius: "6px",
              display: "inline-block",
            }}
          >
            Confirm email
          </Button>

          <Text
            style={{
              fontFamily,
              fontSize: "13px",
              lineHeight: "1.5",
              color: colors.inkSoft,
              margin: "32px 0 4px",
            }}
          >
            {/* TODO: Natalie — placeholder copy for review */}
            Or copy and paste this link into your browser:
          </Text>

          <Text
            style={{
              fontFamily,
              fontSize: "13px",
              lineHeight: "1.5",
              margin: "0 0 32px",
              wordBreak: "break-all",
            }}
          >
            <Link href={CONFIRMATION_URL} style={{ color: colors.deepgrey }}>
              {CONFIRMATION_URL}
            </Link>
          </Text>

          <Hr style={{ borderColor: colors.sandLine, margin: "0 0 16px" }} />

          <Text
            style={{
              fontFamily,
              fontSize: "12px",
              lineHeight: "1.5",
              color: colors.inkSoft,
              margin: 0,
            }}
          >
            {/* TODO: Natalie — placeholder copy for review */}
            If you didn&apos;t create a Plotted account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
