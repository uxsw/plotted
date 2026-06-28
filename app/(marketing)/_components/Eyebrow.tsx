import { T } from "./tokens";

export default function Eyebrow({ text, mb = 24 }: { text: string; mb?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: mb }}>
      <span style={{ width: 26, height: 1, background: T.terra, flexShrink: 0, display: "block" }} />
      <span style={{ fontFamily: T.m, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: T.terra }}>
        {text}
      </span>
    </div>
  );
}
