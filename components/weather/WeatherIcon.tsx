type Category =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder";

function category(code: number): Category {
  if (code === 0) return "clear";
  if (code <= 2) return "partly-cloudy";
  if (code === 3) return "cloudy";
  if (code <= 48) return "fog";
  if (code <= 57) return "drizzle";
  if (code <= 67 || (code >= 80 && code <= 82)) return "rain";
  if (code <= 77 || (code >= 85 && code <= 86)) return "snow";
  return "thunder";
}

export function wmoLabel(code: number): string {
  const labels: Record<number, string> = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Foggy",
    51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    56: "Freezing drizzle", 57: "Freezing drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain",
    66: "Freezing rain", 67: "Freezing rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Rain showers", 81: "Rain showers", 82: "Heavy showers",
    85: "Snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
  };
  return labels[code] ?? "Unknown";
}

type Props = { code: number; size?: number };

export function WeatherIcon({ code, size = 24 }: Props) {
  const cat = category(code);
  const s = { width: size, height: size };
  const base = "stroke-current fill-none stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]";

  if (cat === "clear") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={s} className={`${base} text-gold`}>
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
        <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
        <line x1="19.07" y1="4.93" x2="16.95" y2="7.05" />
        <line x1="7.05" y1="16.95" x2="4.93" y2="19.07" />
      </svg>
    );
  }

  if (cat === "partly-cloudy") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={s} className={base}>
        <circle cx="10" cy="10" r="3" className="text-gold" />
        <line x1="10" y1="3" x2="10" y2="5.5" className="text-gold" />
        <line x1="10" y1="14.5" x2="10" y2="17" className="text-gold" />
        <line x1="3" y1="10" x2="5.5" y2="10" className="text-gold" />
        <line x1="16" y1="6.5" x2="14.2" y2="8.3" className="text-gold" />
        <path
          d="M9 17.5a4.5 4.5 0 0 1 0-9h.5a4 4 0 0 1 7.5 1.5 3 3 0 0 1-.5 6H9z"
          className="text-ink-soft"
        />
      </svg>
    );
  }

  if (cat === "cloudy") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={s} className={`${base} text-ink-soft`}>
        <path d="M6 19a4 4 0 0 1 0-8h.5a5 5 0 0 1 9.5 1 3.5 3.5 0 0 1-.5 7H6z" />
      </svg>
    );
  }

  if (cat === "fog") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={s} className={`${base} text-ink-soft`}>
        <path d="M5 8a4 4 0 0 1 7.9-1A3 3 0 1 1 17 13H5a4 4 0 0 1 0-5z" />
        <line x1="3" y1="16" x2="21" y2="16" />
        <line x1="5" y1="19" x2="19" y2="19" />
      </svg>
    );
  }

  if (cat === "drizzle") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={s} className={`${base} text-ink-soft`}>
        <path d="M6 15a4 4 0 0 1 0-8h.5a5 5 0 0 1 9.5 1 3.5 3.5 0 0 1-.5 7H6z" />
        <line x1="8" y1="19" x2="8" y2="21" />
        <line x1="12" y1="19" x2="12" y2="21" />
        <line x1="16" y1="19" x2="16" y2="21" />
      </svg>
    );
  }

  if (cat === "rain") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={s} className={`${base} text-ink-soft`}>
        <path d="M6 14a4 4 0 0 1 0-8h.5a5 5 0 0 1 9.5 1 3.5 3.5 0 0 1-.5 7H6z" />
        <line x1="8" y1="18" x2="6" y2="22" />
        <line x1="12" y1="18" x2="10" y2="22" />
        <line x1="16" y1="18" x2="14" y2="22" />
      </svg>
    );
  }

  if (cat === "snow") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={s} className={`${base} text-ink-soft`}>
        <path d="M6 14a4 4 0 0 1 0-8h.5a5 5 0 0 1 9.5 1 3.5 3.5 0 0 1-.5 7H6z" />
        <circle cx="8" cy="19" r="1" className="fill-current" />
        <circle cx="12" cy="22" r="1" className="fill-current" />
        <circle cx="16" cy="19" r="1" className="fill-current" />
      </svg>
    );
  }

  // thunder
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={s} className={`${base} text-ink-soft`}>
      <path d="M6 14a4 4 0 0 1 0-8h.5a5 5 0 0 1 9.5 1 3.5 3.5 0 0 1-.5 7H6z" />
      <polyline points="13 14 10 20 13.5 20 10.5 24" />
    </svg>
  );
}
