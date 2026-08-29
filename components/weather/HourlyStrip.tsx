"use client";

import type { WeatherHourly, WeatherCurrent } from "@/lib/weather";

function formatHour(timeStr: string): string {
  const h = parseInt(timeStr.slice(11, 13), 10);
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

type HourlyEntry = {
  time: string;
  temperature_2m: number;
  precipitation_probability: number;
};

function getNext24Hours(hourly: WeatherHourly, currentTime: string): HourlyEntry[] {
  const startIdx = hourly.time.findIndex((t) => t >= currentTime);
  const start = startIdx >= 0 ? startIdx : 0;
  const count = Math.min(24, hourly.time.length - start);
  return Array.from({ length: count }, (_, i) => ({
    time: hourly.time[start + i],
    temperature_2m: hourly.temperature_2m[start + i],
    precipitation_probability: hourly.precipitation_probability[start + i],
  }));
}

type Props = {
  hourly: WeatherHourly;
  current: WeatherCurrent;
};

export function HourlyStrip({ hourly, current }: Props) {
  const entries = getNext24Hours(hourly, current.time);

  return (
    <div className="px-4 py-3 border-t border-sand-line">
      <p className="minion text-ink-soft o-type-weight--medium mb-2">Next 24 hours</p>
      {/* Negative right margin lets the strip bleed to the card edge on overflow */}
      <div className="overflow-x-auto -mr-4">
        <div className="flex gap-1.5 pr-4 pb-1">
          {entries.map((entry) => {
            const hasRain = entry.precipitation_probability > 20;
            return (
              <div
                key={entry.time}
                className="flex flex-col items-center gap-1 border border-sand-line px-2 py-2 min-w-[48px]"
              >
                <span className="minion text-ink-soft o-type-leading--none">
                  {formatHour(entry.time)}
                </span>
                <span
                  className={[
                    "minion o-type-leading--none o-type-tabular",
                    hasRain ? "text-marigold" : "text-ink-soft/40",
                  ].join(" ")}
                >
                  {hasRain ? `${entry.precipitation_probability}%` : "—"}
                </span>
                <span className="brevier o-type-weight--medium text-ink o-type-leading--none o-type-tabular">
                  {Math.round(entry.temperature_2m)}°
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
