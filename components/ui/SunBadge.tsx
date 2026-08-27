const SUN_ICON = {
  "full sun": "sun",
  "full sun / partial shade": "sun-cloud",
  "partial shade": "cloud",
  "full shade": "moon",
} as const;

const SUN_MODIFIER = {
  "full sun": "is-full-sun",
  "full sun / partial shade": "is-sun-shade",
  "partial shade": "is-partial-shade",
  "full shade": "is-full-shade",
} as const;

type SunNeeds = keyof typeof SUN_ICON;

function SunIconSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function SunCloudIconSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="4.5" cy="4.5" r="1.8" />
      <line x1="4.5" y1="1" x2="4.5" y2="2" />
      <line x1="1" y1="4.5" x2="2" y2="4.5" />
      <line x1="2" y1="2" x2="2.8" y2="2.8" />
      <line x1="7" y1="2" x2="6.2" y2="2.8" />
      <path d="M3.5 11a2.5 2.5 0 0 1 0-5 3 3 0 0 1 6 .5A2 2 0 0 1 9.5 11H3.5z" />
    </svg>
  );
}

function CloudIconSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 9.5a2.5 2.5 0 0 1 0-5 3 3 0 0 1 6 .5A2 2 0 0 1 9 9.5H2.5z" />
    </svg>
  );
}

function MoonIconSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.5 9A5.5 5.5 0 0 1 4 2.5a5 5 0 1 0 6.5 6.5z" />
    </svg>
  );
}

function SunIcon({ icon }: { icon: (typeof SUN_ICON)[SunNeeds] }) {
  return (
    <>
      {icon === "sun" && <SunIconSvg />}
      {icon === "sun-cloud" && <SunCloudIconSvg />}
      {icon === "cloud" && <CloudIconSvg />}
      {icon === "moon" && <MoonIconSvg />}
    </>
  );
}

export function SunBadge({ value }: { value: string }) {
  if (!(value in SUN_ICON)) return null;
  const sun = value as SunNeeds;
  const label = value[0].toUpperCase() + value.slice(1);

  return (
    <div role="img" aria-label={label} className={`o-roundel ${SUN_MODIFIER[sun]}`}>
      <SunIcon icon={SUN_ICON[sun]} />
    </div>
  );
}

export function SunBadgePill({ value }: { value: string }) {
  if (!(value in SUN_ICON)) return null;
  const sun = value as SunNeeds;
  const label = value[0].toUpperCase() + value.slice(1);

  return (
    <span className={`o-badge ${SUN_MODIFIER[sun]}`}>
      <SunIcon icon={SUN_ICON[sun]} />
      {label}
    </span>
  );
}
