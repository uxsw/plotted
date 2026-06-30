const SUN_CONFIG = {
  "full sun": {
    bg: "#D4A830",
    stroke: "#FFF5D8",
    icon: "sun",
  },
  "full sun / partial shade": {
    bg: "#B88C38",
    stroke: "#FFF0C0",
    icon: "sun-cloud",
  },
  "partial shade": {
    bg: "#8FAE88",
    stroke: "#EEF5EC",
    icon: "cloud",
  },
  "full shade": {
    bg: "#5A6E78",
    stroke: "#D8E8EE",
    icon: "moon",
  },
} as const;

type SunNeeds = keyof typeof SUN_CONFIG;

function SunIconSvg({ stroke }: { stroke: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="2" />
      <line x1="6.5" y1="1" x2="6.5" y2="2.5" />
      <line x1="6.5" y1="10.5" x2="6.5" y2="12" />
      <line x1="1" y1="6.5" x2="2.5" y2="6.5" />
      <line x1="10.5" y1="6.5" x2="12" y2="6.5" />
      <line x1="2.9" y1="2.9" x2="4" y2="4" />
      <line x1="9" y1="9" x2="10.1" y2="10.1" />
      <line x1="10.1" y1="2.9" x2="9" y2="4" />
      <line x1="2.9" y1="10.1" x2="4" y2="9" />
    </svg>
  );
}

function SunCloudIconSvg({ stroke }: { stroke: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="4.5" cy="4.5" r="1.8" />
      <line x1="4.5" y1="1" x2="4.5" y2="2" />
      <line x1="1" y1="4.5" x2="2" y2="4.5" />
      <line x1="2" y1="2" x2="2.8" y2="2.8" />
      <line x1="7" y1="2" x2="6.2" y2="2.8" />
      <path d="M3.5 11a2.5 2.5 0 0 1 0-5 3 3 0 0 1 6 .5A2 2 0 0 1 9.5 11H3.5z" />
    </svg>
  );
}

function CloudIconSvg({ stroke }: { stroke: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 9.5a2.5 2.5 0 0 1 0-5 3 3 0 0 1 6 .5A2 2 0 0 1 9 9.5H2.5z" />
    </svg>
  );
}

function MoonIconSvg({ stroke }: { stroke: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.5 9A5.5 5.5 0 0 1 4 2.5a5 5 0 1 0 6.5 6.5z" />
    </svg>
  );
}

export function SunBadge({ value }: { value: string }) {
  if (!(value in SUN_CONFIG)) return null;
  const { bg, stroke, icon } = SUN_CONFIG[value as SunNeeds];

  return (
    <div
      role="img"
      aria-label={value[0].toUpperCase() + value.slice(1)}
      style={{ backgroundColor: bg, width: 24, height: 24 }}
      className="rounded-full flex items-center justify-center shrink-0"
    >
      {icon === "sun" && <SunIconSvg stroke={stroke} />}
      {icon === "sun-cloud" && <SunCloudIconSvg stroke={stroke} />}
      {icon === "cloud" && <CloudIconSvg stroke={stroke} />}
      {icon === "moon" && <MoonIconSvg stroke={stroke} />}
    </div>
  );
}

export function SunBadgePill({ value }: { value: string }) {
  if (!(value in SUN_CONFIG)) return null;
  const { bg, stroke, icon } = SUN_CONFIG[value as SunNeeds];
  const label = value[0].toUpperCase() + value.slice(1);

  return (
    <span
      style={{ backgroundColor: bg, color: stroke }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-sans leading-none"
    >
      {icon === "sun" && <SunIconSvg stroke={stroke} />}
      {icon === "sun-cloud" && <SunCloudIconSvg stroke={stroke} />}
      {icon === "cloud" && <CloudIconSvg stroke={stroke} />}
      {icon === "moon" && <MoonIconSvg stroke={stroke} />}
      {label}
    </span>
  );
}
