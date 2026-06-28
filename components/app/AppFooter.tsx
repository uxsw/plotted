import Link from "next/link";

export default function AppFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(60,70,45,0.1)",
        padding: "20px 16px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Link
        href="/privacy"
        style={{
          fontFamily: "var(--font-inter),sans-serif",
          fontSize: 12.5,
          color: "#8A8A6E",
          textDecoration: "none",
        }}
      >
        Privacy Policy
      </Link>
    </footer>
  );
}
